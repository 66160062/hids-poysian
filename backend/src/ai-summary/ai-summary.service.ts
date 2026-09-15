import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { InspectionRound } from 'src/inspection-rounds/entities/inspection-round.entity';
import { Defect } from 'src/defects/entities/defect.entity';
import { InspectionSummaryItem } from 'src/inspection-summary-items/entities/inspection-summary-item.entity';
import { ProviderRegistryService } from './providers/provider-registry.service';
import {
  buildRoundStats,
  buildSummaryPrompt,
  RoundStats,
} from './round-stats.util';

@Injectable()
export class AiSummaryService {
  private readonly logger = new Logger(AiSummaryService.name);

  constructor(
    @InjectRepository(InspectionRound)
    private readonly roundRepo: Repository<InspectionRound>,
    @InjectRepository(Defect)
    private readonly defectRepo: Repository<Defect>,
    @InjectRepository(InspectionSummaryItem)
    private readonly summaryItemRepo: Repository<InspectionSummaryItem>,
    private readonly providerRegistry: ProviderRegistryService,
  ) {}

  async computeStats(roundId: number): Promise<RoundStats> {
    const [defects, summaryItems, round] = await Promise.all([
      this.defectRepo.find({
        where: { round: { roundId } },
        relations: ['subCategories', 'subCategories.category', 'floor'],
      }),
      this.summaryItemRepo.find({
        where: { round: { roundId } },
        relations: ['template', 'option'],
      }),
      this.roundRepo.findOne({
        where: { roundId },
        relations: ['job', 'job.address'],
      }),
    ]);

    // address.floor เก็บเป็น varchar และ nullable — parse ไม่ได้ก็ปล่อยให้ computeScope ใช้ค่า default
    const floorCount = Number.parseInt(round?.job?.address?.floor ?? '', 10);

    return buildRoundStats({
      defects: defects.map((d) => ({
        severity: d.severity,
        status: d.status,
        categoryName: d.subCategories?.[0]?.category?.name ?? 'ไม่ระบุประเภท',
        // ใช้ทุกหมวดที่ defect จุดนี้ผูกอยู่มาคิดความสำคัญ ไม่ใช่แค่หมวดแรก
        categoryNames:
          d.subCategories?.map((s) => s.category?.name ?? '') ?? [],
        floorName: d.floor?.label ?? 'ไม่ระบุชั้น',
      })),
      summaryItems: summaryItems.map((item) => ({
        category: item.template?.category ?? '',
        label: item.template?.label ?? '',
        optionValue: item.option?.value ?? '',
      })),
      usableArea: round?.job?.usableArea,
      floorCount: Number.isNaN(floorCount) ? null : floorCount,
    });
  }

  // เรียกจาก ReportsService ทุกครั้งที่จะ render PDF ใหม่ — ใช้ hash เดียวกับที่ PDF ใช้เช็คว่าข้อมูล defect เปลี่ยนจริงไหม
  // เพื่อไม่ต้องยิง LLM API ซ้ำเวลาข้อมูลไม่เปลี่ยน (ประหยัด cost และ rate limit)
  async generateIfChanged(roundId: number, dataHash: string): Promise<void> {
    const round = await this.roundRepo.findOneBy({ roundId });
    if (!round) return;
    if (round.aiSummaryDataHash === dataHash) {
      this.logger.log(
        `รอบตรวจ ${roundId}: ข้อมูล defect ไม่เปลี่ยน ข้าม AI summary`,
      );
      return;
    }

    const chain = this.providerRegistry.getFallbackChain();
    if (chain.length === 0) {
      this.logger.warn(
        `รอบตรวจ ${roundId}: ไม่มี AI provider ที่ configure ไว้ (ตั้ง ANTHROPIC_API_KEY/GEMINI_API_KEY/GROQ_API_KEY/OLLAMA_MODEL) ข้าม AI summary`,
      );
      return;
    }

    const stats = await this.computeStats(roundId);
    const prompt = buildSummaryPrompt(stats);

    // ไล่ลองตาม fallback chain ทีละตัว — ตัวไหน error/rate-limit ก็ข้ามไปตัวถัดไปทันที
    // ไม่ต้องรอ manual switch เหมือนก่อนหน้าที่พึ่ง provider เดียว
    for (const provider of chain) {
      try {
        const result = await provider.generate(prompt);
        const text = result.text.trim();
        // reasoning model บางตัว (เช่น gpt-oss ผ่าน Groq) คืนข้อความว่างเปล่าเมื่อ token หมดตอน reasoning
        // ถือเป็นความล้มเหลว ไม่งั้นจะบันทึกสรุปเปล่าลงรายงานที่ส่งให้ลูกค้า
        if (!text) {
          throw new Error('ได้ข้อความสรุปว่างเปล่ากลับมา');
        }

        applyScore(round, stats);
        round.aiSummaryText = text;
        round.aiSummaryProvider = provider.id;
        round.aiSummaryDataHash = dataHash;
        round.aiSummaryGeneratedAt = new Date();
        await this.roundRepo.save(round);
        return;
      } catch (error) {
        this.logger.warn(
          `รอบตรวจ ${roundId}: ${provider.id} ล้มเหลว ลอง provider ถัดไปใน fallback chain`,
          error instanceof Error ? error.message : String(error),
        );
      }
    }

    this.logger.error(
      `รอบตรวจ ${roundId}: AI provider ทุกตัวใน fallback chain ล้มเหลว บันทึกแค่ % ความสมบูรณ์`,
    );
    // ยังบันทึกคะแนนความสมบูรณ์ไว้ได้แม้ AI text จะล้มเหลวทุกตัว เพราะคำนวณจากสูตร ไม่ต้องพึ่ง LLM
    applyScore(round, stats);
    await this.roundRepo.save(round);
  }

  // ให้ผู้ใช้เลือก provider เองแบบ manual (เช่นปุ่ม "สร้างสรุปใหม่" ในหน้า admin) ไม่ผ่านการเช็ค hash
  async generateWithProvider(
    roundId: number,
    providerId: string,
  ): Promise<{ stats: RoundStats; text: string; provider: string }> {
    const provider = this.providerRegistry.getById(providerId);
    if (!provider?.isConfigured()) {
      throw new Error(`Provider ${providerId} ไม่ได้ configure ไว้`);
    }

    const stats = await this.computeStats(roundId);
    const result = await provider.generate(buildSummaryPrompt(stats));

    const round = await this.roundRepo.findOneByOrFail({ roundId });
    applyScore(round, stats);
    round.aiSummaryText = result.text.trim();
    round.aiSummaryProvider = provider.id;
    round.aiSummaryGeneratedAt = new Date();
    await this.roundRepo.save(round);

    return { stats, text: result.text.trim(), provider: provider.id };
  }
}

// เขียนคะแนนทั้งสามช่องพร้อมกันเสมอ กันกรณีอัปเดตคะแนนรวมแล้วลืมอัปเดตคะแนนย่อยจนไม่ตรงกัน
function applyScore(round: InspectionRound, stats: RoundStats): void {
  round.completionPercent = stats.completionPercent;
  round.completionDefectScore = stats.defectScore;
  round.completionSystemScore = stats.systemScore;
}
