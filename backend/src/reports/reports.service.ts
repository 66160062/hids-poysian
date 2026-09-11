import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { createHash } from 'crypto';
import { JwtService } from '@nestjs/jwt';
import puppeteer from 'puppeteer';
import { InspectionRound } from 'src/inspection-rounds/entities/inspection-round.entity';
import { Defect } from 'src/defects/entities/defect.entity';
import { StorageService } from 'src/storage/storage.service';
import { ActivityLogsService } from 'src/activity-logs/activity-logs.service';
import { ActivityLogType } from 'src/activity-logs/entities/activity-log.entity';
import { AiSummaryService } from 'src/ai-summary/ai-summary.service';

const DEBOUNCE_MS = 30_000;
const REPORT_READY_SELECTOR = '[data-report-ready="true"]';

@Injectable()
export class ReportsService {
  private readonly logger = new Logger(ReportsService.name);
  private readonly debounceTimers = new Map<number, NodeJS.Timeout>();

  constructor(
    @InjectRepository(InspectionRound)
    private readonly roundRepo: Repository<InspectionRound>,
    @InjectRepository(Defect)
    private readonly defectRepo: Repository<Defect>,
    private readonly storageService: StorageService,
    private readonly jwtService: JwtService,
    private readonly activityLogsService: ActivityLogsService,
    private readonly aiSummaryService: AiSummaryService,
  ) {}

  // เรียกจาก defects controller ทุกครั้งที่ defect ในรอบตรวจเปลี่ยน (สร้าง/แก้ไข/ลบ) — fire-and-forget ไม่บล็อก request
  scheduleRegeneration(roundId: number): void {
    const existing = this.debounceTimers.get(roundId);
    if (existing) clearTimeout(existing);

    const timer = setTimeout(() => {
      this.debounceTimers.delete(roundId);
      this.regenerateIfChanged(roundId).catch((error: unknown) => {
        this.logger.error(
          `สร้างรายงาน PDF สำหรับรอบตรวจ ${roundId} ไม่สำเร็จ`,
          error instanceof Error ? error.stack : String(error),
        );
      });
    }, DEBOUNCE_MS);

    this.debounceTimers.set(roundId, timer);
  }

  // อ่าน URL ที่ cache ไว้ตรงๆ ไม่ trigger การ generate ใดๆ ทั้งสิ้น
  // ส่ง generatedAt กลับไปด้วยเพื่อให้ฝั่ง UI โชว์ได้ว่าไฟล์นี้ render จริงเมื่อไหร่ (PDF อาจล้าหลังการแก้ defect ล่าสุดได้เพราะ debounce)
  // isStale เทียบ hash defect สดกับ lastPdfHash ที่เซฟไว้ ให้ UI รู้ได้ว่าของที่โชว์อยู่เก่ากว่าข้อมูลจริงหรือยัง
  // (เทียบจากข้อมูลตรงๆ แทนที่จะเก็บ state "กำลัง generate" ไว้ในหน่วยความจำ กัน state หลุดตอน server restart)
  async getCachedReportUrl(roundId: number): Promise<{
    url: string | null;
    generatedAt: Date | null;
    isStale: boolean;
  }> {
    const round = await this.roundRepo.findOneBy({ roundId });
    if (!round) {
      return { url: null, generatedAt: null, isStale: false };
    }

    const currentHash = await this.computeDataHash(roundId);
    return {
      url: round.lastPdfUrl ?? null,
      generatedAt: round.lastPdfGeneratedAt ?? null,
      isStale: currentHash !== round.lastPdfHash,
    };
  }

  // จุดหลัก: เช็ค hash ก่อนเสมอ ข้าม Puppeteer ถ้าข้อมูล defect ไม่ได้เปลี่ยนจริงตั้งแต่ครั้งก่อน
  async regenerateIfChanged(roundId: number): Promise<string | null> {
    const round = await this.roundRepo.findOneBy({ roundId });
    if (!round) return null;

    const hash = await this.computeDataHash(roundId);
    if (hash === round.lastPdfHash) {
      this.logger.log(
        `รอบตรวจ ${roundId}: ข้อมูล defect ไม่เปลี่ยน ข้าม Puppeteer render`,
      );
      return round.lastPdfUrl;
    }

    const previousUrl = round.lastPdfUrl;

    // สร้าง % ความสมบูรณ์ + สรุป AI ท้ายเล่มก่อน render เพื่อให้หน้า print มีข้อมูลพร้อมตอน Puppeteer จับภาพ
    // ใช้ hash เดียวกับ PDF เพื่อข้ามการเรียก LLM ซ้ำเวลาข้อมูล defect ไม่เปลี่ยน
    try {
      await this.aiSummaryService.generateIfChanged(roundId, hash);
    } catch (error) {
      this.logger.error(
        `รอบตรวจ ${roundId}: สร้าง AI summary ไม่สำเร็จ (ไม่กระทบการสร้าง PDF)`,
        error instanceof Error ? error.stack : String(error),
      );
    }

    // fetch ใหม่หลัง AI summary เพราะ generateIfChanged เซฟลง DB แยกจาก object `round` ที่ถืออยู่ —
    // ถ้าเซฟทับด้วย `round` (ค่าเก่าตั้งแต่ต้นฟังก์ชัน) ตอนท้าย จะไปเขียนทับค่า AI summary ที่เพิ่งอัปเดตให้กลายเป็นค่าเก่า/null
    const freshRound = await this.roundRepo.findOneByOrFail({ roundId });

    // บันทึกเวลาก่อน render เพื่อให้หน้า print (ที่ Puppeteer กำลังจะไปโหลด) เห็นค่านี้ และโชว์ในตัว PDF ว่าไฟล์นี้ข้อมูล ณ เวลาไหน
    freshRound.lastPdfGeneratedAt = new Date();
    await this.roundRepo.save(freshRound);

    const pdfBuffer = await this.renderReportPdf(roundId);
    const url = await this.storageService.uploadPdf(pdfBuffer, 'reports');

    freshRound.lastPdfHash = hash;
    freshRound.lastPdfUrl = url;
    await this.roundRepo.save(freshRound);

    // ลบไฟล์ PDF เก่า
    if (previousUrl && previousUrl !== url) {
      await this.storageService.deleteFile(previousUrl);
    }

    void this.activityLogsService.logForRound(roundId, {
      type: ActivityLogType.REPORT_PDF_UPDATED,
      color: 'orange',
      title: `อัปเดตรายงาน PDF รอบที่ ${round.roundNumber} แล้ว`,
    });

    return url;
  }

  // hash จาก (defectId + updatedAt) ทั้งชุด ไม่ใช่แค่ MAX(updatedAt) เดี่ยวๆ เพื่อให้จับกรณีลบ defect ได้ด้วย
  private async computeDataHash(roundId: number): Promise<string> {
    const defects = await this.defectRepo.find({
      where: { round: { roundId } },
      select: ['defectId', 'updatedAt'],
      order: { defectId: 'ASC' },
    });

    const raw = defects
      .map((d) => `${d.defectId}:${d.updatedAt.getTime()}`)
      .join('|');
    return createHash('sha256').update(raw).digest('hex');
  }

  private async renderReportPdf(roundId: number): Promise<Buffer> {
    const frontendUrl = process.env.FRONTEND_URL ?? 'http://localhost:9000';

    const systemToken = this.jwtService.sign(
      { sub: 0, role: 'system' },
      { expiresIn: '5m' },
    );

    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });

    try {
      const page = await browser.newPage();
      // ตั้ง default timeout ของ page ทั้งหมดด้วย (ไม่ใช่แค่ override ต่อ call) เพราะ Puppeteer
      // มี internal timeout 30000ms ของตัวเองในบาง operation ที่ไม่ได้ผูกกับ option ที่ส่งเข้า goto/waitForSelector โดยตรง
      page.setDefaultTimeout(120_000);
      page.setDefaultNavigationTimeout(120_000);
      // Quasar LocalStorage เข้ารหัสค่าด้วย prefix ของตัวเอง (ไม่ใช่ JSON.stringify เฉยๆ) —
      // ต้อง encode ให้ตรง format ถึงจะ decode กลับมาถูกตอน useAuthStore() อ่านค่า
      // (ดู Frontend/node_modules/quasar/src/plugins/storage/engine/web-storage.js)
      await page.evaluateOnNewDocument((token: string) => {
        window.localStorage.setItem('token', '__q_strn|' + token);
      }, systemToken);

      // Frontend ใช้ vueRouterMode: 'hash' (Frontend/quasar.config.ts) — ต้องมี # ก่อน path เสมอ
      // timeout ยืดไว้ให้พอสำหรับรายงานที่มี defect เยอะ (หลักร้อย) ที่ต้องรอรูปโหลดครบทุกใบ
      await page.goto(`${frontendUrl}/#/print/report/${roundId}`, {
        waitUntil: 'networkidle0',
        timeout: 120_000,
      });
      await page.waitForSelector(REPORT_READY_SELECTOR, { timeout: 120_000 });

      const pdfBytes = await page.pdf({
        format: 'A4',
        printBackground: true,
      });
      return Buffer.from(pdfBytes);
    } finally {
      await browser.close();
    }
  }
}
