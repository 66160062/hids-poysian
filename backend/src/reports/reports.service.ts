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

export type ReportLocale = 'th-TH' | 'en-US';

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

  // อ่าน URL ที่ cache ไว้ตรงๆ ไม่ trigger การ generate ใดๆ ทั้งสิ้น (ยกเว้น locale อังกฤษที่ยังไม่เคย
  // render มาก่อนเลย — กรณีนั้น lazy-generate ให้ทันที เพราะ debounce ปกติ render แค่ไทยเท่านั้น ดู scheduleRegeneration)
  // ส่ง generatedAt กลับไปด้วยเพื่อให้ฝั่ง UI โชว์ได้ว่าไฟล์นี้ render จริงเมื่อไหร่ (PDF อาจล้าหลังการแก้ defect ล่าสุดได้เพราะ debounce)
  // isStale เทียบ hash defect สดกับ lastPdfHash ที่เซฟไว้ ให้ UI รู้ได้ว่าของที่โชว์อยู่เก่ากว่าข้อมูลจริงหรือยัง
  // (เทียบจากข้อมูลตรงๆ แทนที่จะเก็บ state "กำลัง generate" ไว้ในหน่วยความจำ กัน state หลุดตอน server restart)
  async getCachedReportUrl(
    roundId: number,
    locale: ReportLocale = 'th-TH',
  ): Promise<{
    url: string | null;
    generatedAt: Date | null;
    isStale: boolean;
  }> {
    const round = await this.roundRepo.findOneBy({ roundId });
    if (!round) {
      return { url: null, generatedAt: null, isStale: false };
    }

    if (locale === 'en-US') {
      // อังกฤษไม่มี debounce คอยอัปเดตล่วงหน้าเหมือนไทย (ดู scheduleRegeneration) — เรียก
      // regenerateIfChanged ตรงๆ เลย ซึ่งเช็ค hash ให้เองอยู่แล้วว่าจะข้าม Puppeteer หรือ render ใหม่
      // ผลคือ "อ่าน cache" กับ "render ครั้งแรก/ครั้งที่ข้อมูลเปลี่ยน" ใช้ทางเดียวกัน จึงไม่มี isStale ค้างให้ต้องโชว์
      const url = await this.regenerateIfChanged(roundId, 'en-US');
      const refreshed = await this.roundRepo.findOneBy({ roundId });
      return {
        url,
        generatedAt: refreshed?.lastPdfGeneratedAtEn ?? null,
        isStale: false,
      };
    }

    const currentHash = await this.computeDataHash(roundId);
    return {
      url: round.lastPdfUrl ?? null,
      generatedAt: round.lastPdfGeneratedAt ?? null,
      isStale: currentHash !== round.lastPdfHash,
    };
  }

  // ใช้ตอนแนบรายงานไปกับอีเมลอนุมัติ: ต้องได้ไฟล์ล่าสุดทันที ไม่รอ debounce และเป็นไฟล์เดียวกับที่เปิดดูในแอป
  // locale มาจาก customer.preferredLocale (ดู InspectionRoundsService) — ไม่มี "locale ปัจจุบัน" ให้อ้างอิงเพราะทำงานฝั่ง server ล้วน
  async getLatestReportPdf(
    roundId: number,
    locale: ReportLocale = 'th-TH',
  ): Promise<Buffer> {
    if (locale === 'th-TH') {
      const pending = this.debounceTimers.get(roundId);
      if (pending) {
        clearTimeout(pending);
        this.debounceTimers.delete(roundId);
      }
    }

    const url = await this.regenerateIfChanged(roundId, locale);
    if (!url) {
      throw new Error(`ไม่พบรายงาน PDF ของรอบตรวจ ${roundId}`);
    }

    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(
        `ดาวน์โหลดรายงาน PDF ของรอบตรวจ ${roundId} ไม่สำเร็จ (HTTP ${response.status})`,
      );
    }
    return Buffer.from(await response.arrayBuffer());
  }

  // จุดหลัก: เช็ค hash ก่อนเสมอ ข้าม Puppeteer ถ้าข้อมูล defect ไม่ได้เปลี่ยนจริงตั้งแต่ครั้งก่อน
  // cache ไทย/อังกฤษแยกกันคนละคู่ column (lastPdfHash* / lastPdfUrl* / lastPdfGeneratedAt*)
  async regenerateIfChanged(
    roundId: number,
    locale: ReportLocale = 'th-TH',
  ): Promise<string | null> {
    const round = await this.roundRepo.findOneBy({ roundId });
    if (!round) return null;

    const hash = await this.computeDataHash(roundId);
    const cachedHash =
      locale === 'en-US' ? round.lastPdfHashEn : round.lastPdfHash;
    const cachedUrl =
      locale === 'en-US' ? round.lastPdfUrlEn : round.lastPdfUrl;

    if (hash === cachedHash) {
      this.logger.log(
        `รอบตรวจ ${roundId} (${locale}): ข้อมูล defect ไม่เปลี่ยน ข้าม Puppeteer render`,
      );
      return cachedUrl;
    }

    const previousUrl = cachedUrl;

    // สร้าง % ความสมบูรณ์ + สรุป AI ท้ายเล่มก่อน render เพื่อให้หน้า print มีข้อมูลพร้อมตอน Puppeteer จับภาพ
    // ใช้ hash เดียวกับ PDF เพื่อข้ามการเรียก LLM ซ้ำเวลาข้อมูล defect ไม่เปลี่ยน — ใช้ hash เดียวกันทั้งสอง locale
    // เพราะ AI summary text เก็บที่เดียว ไม่ได้ทำสองภาษา
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
    if (locale === 'en-US') {
      freshRound.lastPdfGeneratedAtEn = new Date();
    } else {
      freshRound.lastPdfGeneratedAt = new Date();
    }
    await this.roundRepo.save(freshRound);

    const pdfBuffer = await this.renderReportPdf(roundId, locale);
    const url = await this.storageService.uploadPdf(pdfBuffer, 'reports');

    if (locale === 'en-US') {
      freshRound.lastPdfHashEn = hash;
      freshRound.lastPdfUrlEn = url;
    } else {
      freshRound.lastPdfHash = hash;
      freshRound.lastPdfUrl = url;
    }
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

  private async renderReportPdf(
    roundId: number,
    locale: ReportLocale = 'th-TH',
  ): Promise<Buffer> {
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
      // ส่ง lang ผ่าน query แทนการฉีด localStorage เพราะหน้า print อ่าน locale จาก query เป็นหลัก —
      // headless browser ของ Puppeteer ไม่มี localStorage เดิมอยู่แล้ว จะ fallback เป็น th-TH เสมอถ้าไม่ส่งมา
      await page.goto(
        `${frontendUrl}/#/print/report/${roundId}?lang=${locale}`,
        {
          waitUntil: 'networkidle0',
          timeout: 120_000,
        },
      );
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
