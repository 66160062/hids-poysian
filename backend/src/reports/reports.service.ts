import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { createHash } from 'crypto';
import { JwtService } from '@nestjs/jwt';
import puppeteer from 'puppeteer';
import { InspectionRound } from 'src/inspection-rounds/entities/inspection-round.entity';
import { Defect } from 'src/defects/entities/defect.entity';
import { StorageService } from 'src/storage/storage.service';

const DEBOUNCE_MS = 10_000;
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
  async getCachedReportUrl(roundId: number): Promise<string | null> {
    const round = await this.roundRepo.findOneBy({ roundId });
    return round?.lastPdfUrl ?? null;
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

    const pdfBuffer = await this.renderReportPdf(roundId);
    const url = await this.storageService.uploadPdf(pdfBuffer, 'reports');

    round.lastPdfHash = hash;
    round.lastPdfUrl = url;
    await this.roundRepo.save(round);

    // ลบไฟล์ PDF เก่าของรอบเดียวกันทิ้ง หลังจาก DB ชี้ไปไฟล์ใหม่แล้วอย่างปลอดภัย —
    // กันไม่ให้ Storage สะสมไฟล์ค้างจากทุกรอบที่ regenerate (ปกติ round เดียวกันจะ regenerate ซ้ำหลายครั้ง)
    if (previousUrl && previousUrl !== url) {
      await this.storageService.deleteFile(previousUrl);
    }

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

  // เปิด headless browser ไปที่ route พิเศษของ frontend ที่ mount DefectReport.vue ตัวจริง
  // แล้ว print-to-PDF ผ่านกลไกเดียวกับที่ window.print() ใช้ตอนนี้ (ข้อความ select ได้จริง ไม่ใช่รูป)
  private async renderReportPdf(roundId: number): Promise<Buffer> {
    const frontendUrl = process.env.FRONTEND_URL ?? 'http://localhost:9000';
    // route /print/report/:roundId เรียก endpoint เดิมที่ต้อง login (AuthGuard) — เพราะ Puppeteer
    // ไม่มี session ของผู้ใช้เลย จึงมิ้นต์ token ภายในให้ตัวเองแทน แล้วฉีดลง localStorage
    // ก่อนหน้าเพจโหลด ให้ตรงกับ pattern ที่ useAuthStore() อ่านตอนสร้าง store (Frontend/src/stores/useAuth.ts)
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
