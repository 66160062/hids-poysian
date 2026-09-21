import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Not, Repository } from 'typeorm';
import { createHash } from 'crypto';
import { JwtService } from '@nestjs/jwt';
import puppeteer from 'puppeteer';
import type { Browser } from 'puppeteer';
import { InspectionRound } from 'src/inspection-rounds/entities/inspection-round.entity';
import { Defect } from 'src/defects/entities/defect.entity';
import { InspectionSummaryItem } from 'src/inspection-summary-items/entities/inspection-summary-item.entity';
import { StorageService } from 'src/storage/storage.service';
import { ActivityLogsService } from 'src/activity-logs/activity-logs.service';
import { ActivityLogType } from 'src/activity-logs/entities/activity-log.entity';
import { AiSummaryService } from 'src/ai-summary/ai-summary.service';

const DEBOUNCE_MS = 30_000;
// เพดานเวลารอนับจากครั้งแรกที่ schedule — กันเคสที่มีคนแก้ถี่กว่า DEBOUNCE_MS ต่อเนื่อง
// แล้ว timer ถูกรีเซ็ตไม่รู้จบจน PDF ไม่ถูก render สักที
const MAX_DEBOUNCE_WAIT_MS = 120_000;
// debounce timer อยู่ใน memory ล้วน หายได้หลายทาง (server restart กลางคัน, render รอบนั้นพัง) — sweep
// เก็บตกรอบที่ข้อมูลเปลี่ยนแล้วแต่ PDF ยังไม่ตาม ให้กลับมา consistent เองโดยไม่ต้องรอให้มีคนแก้ defect ซ้ำ
const SWEEP_INTERVAL_MS = 5 * 60_000;
// จำกัดจำนวนต่อรอบ sweep กัน Puppeteer ถล่มรวดเดียวตอนมีรอบค้างเยอะ (เช่นหลัง deploy ที่สูตร hash
// เปลี่ยน ทำให้ทุกรอบกลายเป็น stale พร้อมกัน) — ที่เหลือถูกเก็บในรอบถัดๆ ไป
const SWEEP_MAX_PER_RUN = 3;
// รอบที่ sweep สร้างไม่สำเร็จ พักไว้ก่อนค่อยลองใหม่ — บางรอบพังถาวร (เช่นข้อมูลกำพร้า) ถ้าลองทุก 5 นาที
// จะเปลือง Puppeteer เปล่าๆ และแย่งคิวรอบอื่นที่ยังสร้างได้
const SWEEP_RETRY_AFTER_MS = 30 * 60_000;
const REPORT_ROOT_SELECTOR = '[data-report-ready]';

// ความกว้างรูปย่อที่หน้ารายงานขอใช้ — ต้องตรงกับที่ resolveImageUrl ใน DefectReport.vue ส่งมา
// ไม่งั้น warm ไว้แล้วก็ไม่ถูกใช้ แล้วหน้า print จะไปย่อเองตอนโหลดซึ่งช้ากว่ามาก
const DEFECT_THUMB_WIDTH = 600;
const SUMMARY_THUMB_WIDTH = 400;
const THUMB_WARM_CONCURRENCY = 6;

export type ReportLocale = 'th-TH' | 'en-US';

@Injectable()
export class ReportsService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(ReportsService.name);
  private readonly debounceTimers = new Map<string, NodeJS.Timeout>();
  private readonly debounceStartedAt = new Map<string, number>();
  // กัน render ซ้อนสำหรับ round+locale เดียวกัน (debounce ยิงชนอีเมลอนุมัติ, admin เปิดรายงานพร้อมกันสองคน ฯลฯ)
  // ถ้าไม่กัน ทั้งสองฝั่งจะอ่าน previousUrl ค่าเดียวกันแล้วต่างคนต่าง upload — ไฟล์ของฝั่งที่เซฟทีหลัง
  // กลายเป็นขยะค้างใน storage ที่ไม่มีใครลบ และ entity ที่ save ทับกันก็เสี่ยงล้างค่าของอีกฝั่ง
  private readonly inFlight = new Map<string, Promise<string | null>>();
  // เวลาที่ฝั่งอ่านสั่ง render ครั้งล่าสุด ใช้หน่วงการลองใหม่เวลา render พังซ้ำๆ (ดู ensureRegenerationQueued)
  private readonly lastReadTriggerAt = new Map<string, number>();
  // roundId -> เวลาที่ sweep สร้างไม่สำเร็จครั้งล่าสุด (ดู sweepStaleRounds)
  private readonly sweepFailedAt = new Map<number, number>();
  private browserPromise: Promise<Browser> | null = null;
  private sweepTimer: NodeJS.Timeout | null = null;

  constructor(
    @InjectRepository(InspectionRound)
    private readonly roundRepo: Repository<InspectionRound>,
    @InjectRepository(Defect)
    private readonly defectRepo: Repository<Defect>,
    @InjectRepository(InspectionSummaryItem)
    private readonly summaryItemRepo: Repository<InspectionSummaryItem>,
    private readonly storageService: StorageService,
    private readonly jwtService: JwtService,
    private readonly activityLogsService: ActivityLogsService,
    private readonly aiSummaryService: AiSummaryService,
  ) {}

  onModuleInit(): void {
    this.sweepTimer = setInterval(() => {
      this.sweepStaleRounds().catch((error: unknown) => {
        this.logger.error(
          'sweep หารอบที่ PDF ยังไม่ตามข้อมูลไม่สำเร็จ',
          error instanceof Error ? error.stack : String(error),
        );
      });
    }, SWEEP_INTERVAL_MS);
    // ไม่ให้ timer ตัวนี้กั้น process ไม่ให้ปิด (สำคัญกับ test runner และ graceful shutdown)
    this.sweepTimer.unref();
  }

  async onModuleDestroy(): Promise<void> {
    if (this.sweepTimer) {
      clearInterval(this.sweepTimer);
      this.sweepTimer = null;
    }
    for (const timer of this.debounceTimers.values()) clearTimeout(timer);
    this.debounceTimers.clear();
    this.debounceStartedAt.clear();
    this.lastReadTriggerAt.clear();
    this.sweepFailedAt.clear();

    const pendingBrowser = this.browserPromise;
    this.browserPromise = null;
    if (!pendingBrowser) return;
    try {
      await (await pendingBrowser).close();
    } catch {
      // ปิดไม่ได้ก็ปล่อยให้ตายไปพร้อม process ไม่มีอะไรให้กู้ต่อ
    }
  }

  private cacheKey(roundId: number, locale: ReportLocale): string {
    return `${roundId}:${locale}`;
  }

  // เรียกทุกครั้งที่ข้อมูลที่ขึ้นในรายงานเปลี่ยน — defect (ดู DefectsController) และแบบสรุปการตรวจ
  // (ดู InspectionSummaryItemsController) — fire-and-forget ไม่บล็อก request
  scheduleRegeneration(roundId: number, locale: ReportLocale = 'th-TH'): void {
    const key = this.cacheKey(roundId, locale);
    const existing = this.debounceTimers.get(key);
    const startedAt = this.debounceStartedAt.get(key);

    if (existing) {
      // ชนเพดานแล้วปล่อยให้ timer เดิมยิงตามกำหนดเดิม ไม่เลื่อนออกไปอีก
      if (
        startedAt !== undefined &&
        Date.now() - startedAt >= MAX_DEBOUNCE_WAIT_MS
      ) {
        return;
      }
      clearTimeout(existing);
    } else {
      this.debounceStartedAt.set(key, Date.now());
    }

    const timer = setTimeout(() => {
      this.debounceTimers.delete(key);
      this.debounceStartedAt.delete(key);
      this.regenerateIfChanged(roundId, locale).catch((error: unknown) => {
        this.logger.error(
          `สร้างรายงาน PDF สำหรับรอบตรวจ ${roundId} (${locale}) ไม่สำเร็จ`,
          error instanceof Error ? error.stack : String(error),
        );
      });
    }, DEBOUNCE_MS);

    this.debounceTimers.set(key, timer);
  }

  // สำหรับ "ฝั่งอ่าน" โดยเฉพาะ — หน้ารายงาน poll endpoint นี้ทุก 8 วินาทีตอนขึ้น banner ว่าข้อมูลเปลี่ยน
  // (ดู checkReportFreshness ใน DefectReport.vue) ถ้าใช้ scheduleRegeneration ซึ่งรีเซ็ตนาฬิกาทุกครั้ง
  // ที่ถูกเรียก การ poll ถี่กว่า DEBOUNCE_MS จะดันนัด render ออกไปเรื่อยๆ จนไม่เริ่มสักที —
  // กลายเป็นว่าหน้าที่รอไฟล์ใหม่คือตัวที่ถ่วงไม่ให้มันถูกสร้าง
  //
  // debounce มีไว้รวบ burst ของ "การเขียน" (แก้ defect รัวๆ) ส่วนการอ่านมาเป็นจังหวะคงที่และข้อมูล
  // ก็ stale ไปแล้ว ไม่มี burst ให้รวบ จึงเริ่ม render ได้เลย แล้วปล่อยให้ in-flight lock กันงานซ้อนแทน
  private ensureRegenerationQueued(
    roundId: number,
    locale: ReportLocale,
  ): void {
    const key = this.cacheKey(roundId, locale);
    // มีคิวรออยู่จากการแก้ข้อมูล หรือกำลัง render อยู่แล้ว ปล่อยให้ตัวนั้นทำงานไป
    if (this.debounceTimers.has(key) || this.inFlight.has(key)) return;

    // กันยิงรัวเวลา render พังซ้ำๆ — ถ้าไม่คุม การ poll ทุก 8 วิจะสั่ง render ใหม่ทุก 8 วิไม่จบ
    const lastAttempt = this.lastReadTriggerAt.get(key);
    if (lastAttempt !== undefined && Date.now() - lastAttempt < DEBOUNCE_MS) {
      return;
    }
    this.lastReadTriggerAt.set(key, Date.now());

    this.regenerateIfChanged(roundId, locale).catch((error: unknown) => {
      this.logger.error(
        `สร้างรายงาน PDF สำหรับรอบตรวจ ${roundId} (${locale}) ไม่สำเร็จ`,
        error instanceof Error ? error.stack : String(error),
      );
    });
  }

  private cancelPending(roundId: number, locale: ReportLocale): void {
    const key = this.cacheKey(roundId, locale);
    const pending = this.debounceTimers.get(key);
    if (!pending) return;
    clearTimeout(pending);
    this.debounceTimers.delete(key);
    this.debounceStartedAt.delete(key);
  }

  // อ่าน URL ที่ cache ไว้ตรงๆ ไม่เคยบล็อก request รอ Puppeteer ไม่ว่าภาษาไหน — ถ้าข้อมูลเปลี่ยนแล้ว
  // (หรือยังไม่เคยมีไฟล์ของภาษานี้เลย) แค่สั่ง regenerate เบื้องหลังแล้วคืนของเท่าที่มีไปก่อน
  // ฝั่ง UI ที่ได้ url: null มี fallback ไป render ฝั่ง client ให้อยู่แล้ว (ดู exportPdf ใน DefectReport.vue)
  // ส่ง generatedAt กลับไปด้วยเพื่อให้ UI โชว์ได้ว่าไฟล์นี้ render จริงเมื่อไหร่
  // isStale เทียบ hash ข้อมูลสดกับ hash ที่เซฟไว้ ให้ UI รู้ว่าของที่โชว์อยู่เก่ากว่าข้อมูลจริงหรือยัง
  // (เทียบจากข้อมูลตรงๆ แทนการเก็บ state "กำลัง generate" ในหน่วยความจำ กัน state หลุดตอน server restart)
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

    const isEn = locale === 'en-US';
    const cachedHash = isEn ? round.lastPdfHashEn : round.lastPdfHash;
    const cachedUrl = isEn ? round.lastPdfUrlEn : round.lastPdfUrl;
    const generatedAt = isEn
      ? round.lastPdfGeneratedAtEn
      : round.lastPdfGeneratedAt;

    // รายงานที่อนุมัติแล้วถือว่าจบแล้ว — ไฟล์ที่ส่งถึงลูกค้าคือฉบับจริง ไม่ต้อง render ทับและไม่ต้อง
    // ขึ้นธงว่าเก่ากว่าข้อมูล (ดู runRegeneration)
    if (round.status === 'APPROVED') {
      return {
        url: cachedUrl ?? null,
        generatedAt: generatedAt ?? null,
        isStale: false,
      };
    }

    const currentHash = await this.computeDataHash(roundId);
    const isStale = currentHash !== cachedHash;

    if (isStale) this.ensureRegenerationQueued(roundId, locale);

    return {
      url: cachedUrl ?? null,
      generatedAt: generatedAt ?? null,
      isStale,
    };
  }

  // ใช้ตอนแนบรายงานไปกับอีเมลอนุมัติ: ต้องได้ไฟล์ล่าสุดทันที ไม่รอ debounce และเป็นไฟล์เดียวกับที่เปิดดูในแอป
  // locale มาจาก customer.preferredLocale (ดู InspectionRoundsService) — ไม่มี "locale ปัจจุบัน" ให้อ้างอิงเพราะทำงานฝั่ง server ล้วน
  async getLatestReportPdf(
    roundId: number,
    locale: ReportLocale = 'th-TH',
  ): Promise<Buffer> {
    this.cancelPending(roundId, locale);

    // flow นี้ทำงานหลังรอบถูกตั้งเป็น APPROVED แล้ว (ดู sendApprovalEmailToCustomer) และเป็นตัวที่
    // สร้างไฟล์ฉบับที่ลูกค้าจะได้รับ จึงเป็นข้อยกเว้นเดียวที่ render รอบที่อนุมัติแล้วได้
    const url = await this.regenerateIfChanged(roundId, locale, {
      allowApproved: true,
    });
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

  // เปลือกกันงานซ้อน: ถ้า round+locale นี้มี render ค้างอยู่ ให้ผู้เรียกใหม่ไปรอผลของงานเดิมแทนที่จะเปิดอีกงาน
  // (งานที่ค้างอยู่ render จากข้อมูลชุดเดียวกันอยู่แล้ว ผลที่ได้จึงใช้แทนกันได้ ไม่ว่าผู้เรียกจะเป็นทางไหน)
  async regenerateIfChanged(
    roundId: number,
    locale: ReportLocale = 'th-TH',
    options: { allowApproved?: boolean } = {},
  ): Promise<string | null> {
    const key = this.cacheKey(roundId, locale);
    const running = this.inFlight.get(key);
    if (running) {
      this.logger.log(
        `รอบตรวจ ${roundId} (${locale}): มีงาน render ค้างอยู่แล้ว ใช้ผลร่วมกัน`,
      );
      return running;
    }

    const task = this.runRegeneration(roundId, locale, options).finally(() => {
      this.inFlight.delete(key);
    });
    this.inFlight.set(key, task);
    return task;
  }

  // จุดหลัก: เช็ค hash ก่อนเสมอ ข้าม Puppeteer ถ้าข้อมูลไม่ได้เปลี่ยนจริงตั้งแต่ครั้งก่อน
  // cache ไทย/อังกฤษแยกกันคนละคู่ column (lastPdfHash* / lastPdfUrl* / lastPdfGeneratedAt*)
  private async runRegeneration(
    roundId: number,
    locale: ReportLocale,
    options: { allowApproved?: boolean } = {},
  ): Promise<string | null> {
    const round = await this.roundRepo.findOneBy({ roundId });
    if (!round) return null;

    const isEn = locale === 'en-US';
    const cachedHash = isEn ? round.lastPdfHashEn : round.lastPdfHash;
    const cachedUrl = isEn ? round.lastPdfUrlEn : round.lastPdfUrl;

    // ไฟล์ของรอบที่อนุมัติแล้วคือฉบับที่ส่งถึงลูกค้าไปแล้ว ห้ามงานเบื้องหลัง render ทับ — ข้อยกเว้นเดียว
    // คือตอนแนบไปกับอีเมลอนุมัติ ซึ่งเป็นคนสร้างไฟล์ฉบับนั้นเอง (ดู getLatestReportPdf)
    // จำเป็นเพราะแบบสรุปการตรวจยังแก้ได้หลังอนุมัติ (InspectionSummaryItemsService ไม่ได้ล็อกตามสถานะ
    // เหมือน DefectsService) การแก้ตรงนั้นจึงไม่ควรลาม ไปเปลี่ยนรายงานที่ปิดจ็อบไปแล้ว
    if (round.status === 'APPROVED' && !options.allowApproved) {
      this.logger.log(
        `รอบตรวจ ${roundId} (${locale}): อนุมัติแล้ว ไม่ render ทับรายงานที่ส่งลูกค้าไปแล้ว`,
      );
      return cachedUrl;
    }

    const hash = await this.computeDataHash(roundId);

    if (hash === cachedHash) {
      this.logger.log(
        `รอบตรวจ ${roundId} (${locale}): ข้อมูลไม่เปลี่ยน ข้าม Puppeteer render`,
      );
      return cachedUrl;
    }

    const previousUrl = cachedUrl;
    const startedAt = Date.now();
    this.logger.log(
      `รอบตรวจ ${roundId} (${locale}): ข้อมูลเปลี่ยน เริ่มสร้างรายงาน PDF ใหม่`,
    );

    // สร้าง % ความสมบูรณ์ + สรุป AI ท้ายเล่มก่อน render เพื่อให้หน้า print มีข้อมูลพร้อมตอน Puppeteer จับภาพ
    // ใช้ hash เดียวกับ PDF เพื่อข้ามการเรียก LLM ซ้ำเวลาข้อมูลไม่เปลี่ยน — ใช้ hash เดียวกันทั้งสอง locale
    // เพราะ AI summary text เก็บที่เดียว ไม่ได้ทำสองภาษา
    try {
      await this.aiSummaryService.generateIfChanged(roundId, hash);
    } catch (error) {
      this.logger.error(
        `รอบตรวจ ${roundId}: สร้าง AI summary ไม่สำเร็จ (ไม่กระทบการสร้าง PDF)`,
        error instanceof Error ? error.stack : String(error),
      );
    }

    // เวลาที่จะประทับในตัว PDF ส่งผ่าน query ให้หน้า print ตรงๆ ไม่ต้องเซฟลง DB ก่อน render
    // (ของเดิมเซฟก่อนแล้วไม่ rollback ตอน render พัง ทำให้ไฟล์เก่าติดป้ายเวลาใหม่ และหน้า print
    // อ่านคอลัมน์ฝั่งไทยเสมอ ทำให้ PDF อังกฤษโชว์เวลาของไฟล์ไทย)
    await this.warmThumbnails(roundId);

    const generatedAt = new Date();
    const pdfBuffer = await this.renderReportPdf(roundId, locale, generatedAt);
    const url = await this.storageService.uploadPdf(pdfBuffer, 'reports');

    // fetch ใหม่หลัง AI summary เพราะ generateIfChanged เซฟลง DB แยกจาก object `round` ที่ถืออยู่ —
    // ถ้าเซฟทับด้วย `round` (ค่าเก่าตั้งแต่ต้นฟังก์ชัน) จะไปเขียนทับค่า AI summary ที่เพิ่งอัปเดตให้กลายเป็นค่าเก่า/null
    const freshRound = await this.roundRepo.findOneByOrFail({ roundId });

    // เซฟ hash/url/generatedAt พร้อมกันทีเดียวหลัง render สำเร็จ — render พังเมื่อไหร่ DB ไม่ถูกแตะเลย
    if (isEn) {
      freshRound.lastPdfHashEn = hash;
      freshRound.lastPdfUrlEn = url;
      freshRound.lastPdfGeneratedAtEn = generatedAt;
    } else {
      freshRound.lastPdfHash = hash;
      freshRound.lastPdfUrl = url;
      freshRound.lastPdfGeneratedAt = generatedAt;
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

    // บอกเวลาที่ใช้ไปด้วย เพราะรายงานที่ defect เยอะ (หลักร้อย) ใช้เวลาระดับนาที — ถ้าไม่ log ไว้
    // เวลา banner "กำลังสร้างรายงานฉบับใหม่" ค้างนานจะแยกไม่ออกว่าช้าหรือพังเงียบ
    this.logger.log(
      `รอบตรวจ ${roundId} (${locale}): สร้างรายงาน PDF ใหม่เสร็จแล้ว (${Date.now() - startedAt} ms, ${pdfBuffer.length} bytes)`,
    );

    return url;
  }

  // สร้างรูปย่อให้ครบก่อนเปิดหน้า print — ถ้าปล่อยให้ backend ย่อรูปทีละใบตอนเบราว์เซอร์โหลด
  // รายงานที่มีรูปหลายร้อยใบจะใช้เวลานานจนชน timeout ของ networkidle0 ในรอบแรกที่ยังไม่มีรูปย่อเลย
  // best-effort: ใบไหนย่อไม่ได้ก็ปล่อยผ่าน หน้า print จะไป fallback เป็นต้นฉบับเอง (ดู ImagesController)
  private async warmThumbnails(roundId: number): Promise<void> {
    const [defects, summaryItems] = await Promise.all([
      this.defectRepo.find({
        where: { round: { roundId } },
        select: ['defectId', 'imageUrl'],
      }),
      this.summaryItemRepo.find({
        where: { round: { roundId } },
        select: ['itemId', 'photoUrl'],
      }),
    ]);

    const queue: { url: string; width: number }[] = [
      ...defects
        .filter((d) => d.imageUrl)
        .map((d) => ({ url: d.imageUrl, width: DEFECT_THUMB_WIDTH })),
      ...summaryItems
        .filter((i) => i.photoUrl)
        .map((i) => ({
          url: i.photoUrl as string,
          width: SUMMARY_THUMB_WIDTH,
        })),
    ];
    if (!queue.length) return;

    const startedAt = Date.now();
    let failed = 0;
    const worker = async (): Promise<void> => {
      for (let job = queue.pop(); job; job = queue.pop()) {
        try {
          await this.storageService.ensureThumbnail(job.url, job.width);
        } catch {
          failed += 1;
        }
      }
    };
    await Promise.all(
      Array.from({ length: THUMB_WARM_CONCURRENCY }, () => worker()),
    );

    this.logger.log(
      `รอบตรวจ ${roundId}: เตรียมรูปย่อเสร็จ (${Date.now() - startedAt} ms, ย่อไม่สำเร็จ ${failed} ใบ)`,
    );
  }

  // เก็บตกเฉพาะ locale ไทย ซึ่งเป็นตัวที่ระบบ generate ไว้ล่วงหน้าให้เสมอ — อังกฤษ render ตอนมีคนขอ
  // เท่านั้นอยู่แล้ว (ดู getCachedReportUrl) ไม่ต้องไล่ทำให้ครบทุกรอบ
  private async sweepStaleRounds(): Promise<void> {
    // เฉพาะรอบที่ตรวจเสร็จแล้วและยังไม่อนุมัติ — ก่อนตรวจเสร็จยังไม่ต้องมี PDF (ดู DefectsController)
    // ส่วนรอบที่อนุมัติแล้วห้ามแตะ ไม่งั้นจะ render ทับรายงานที่ส่งลูกค้าไปแล้ว (ดู confirmInspection)
    //
    // ต้องเคยมี PDF มาแล้ว (lastPdfUrl ไม่เป็น null) เพราะหน้าที่ของ sweep คือ "ตามให้ทัน" เวลา
    // debounce หลุด ไม่ใช่ไปไล่สร้างรายงานให้รอบที่ไม่เคยมี ซึ่งรวมรอบข้อมูลกำพร้าที่ไม่มี job ผูกอยู่
    // (หน้า print จะโดน 404 จาก RoundAccessGuard) แล้ววน render ใหม่ทุก 5 นาทีไม่มีวันจบ
    // รอบที่ยังไม่เคยมี PDF จะได้ตอนมีคนแก้ข้อมูลหรือเปิดดูรายงาน (ดู ensureRegenerationQueued)
    const rounds = await this.roundRepo.find({
      where: {
        inspectedAt: Not(IsNull()),
        status: Not('APPROVED'),
        lastPdfUrl: Not(IsNull()),
      },
      select: ['roundId', 'lastPdfHash'],
    });

    let handled = 0;
    for (const round of rounds) {
      if (handled >= SWEEP_MAX_PER_RUN) break;

      // รอบที่เพิ่งพังไป ให้พักก่อนค่อยลองใหม่ ไม่งั้นรอบที่พังถาวรจะกิน quota ของ sweep
      // ทุกครั้งจนรอบอื่นที่ยังพอไหวไม่ได้คิว
      const failedAt = this.sweepFailedAt.get(round.roundId);
      if (
        failedAt !== undefined &&
        Date.now() - failedAt < SWEEP_RETRY_AFTER_MS
      ) {
        continue;
      }

      const hash = await this.computeDataHash(round.roundId);
      if (hash === round.lastPdfHash) {
        this.sweepFailedAt.delete(round.roundId);
        continue;
      }

      handled += 1;
      this.logger.log(
        `sweep: รอบตรวจ ${round.roundId} ข้อมูลเปลี่ยนแต่ PDF ยังไม่ตาม สั่ง render ใหม่`,
      );
      try {
        await this.regenerateIfChanged(round.roundId);
        this.sweepFailedAt.delete(round.roundId);
      } catch (error) {
        this.sweepFailedAt.set(round.roundId, Date.now());
        this.logger.error(
          `sweep: สร้างรายงาน PDF สำหรับรอบตรวจ ${round.roundId} ไม่สำเร็จ (พัก ${SWEEP_RETRY_AFTER_MS / 60_000} นาทีก่อนลองใหม่)`,
          error instanceof Error ? error.stack : String(error),
        );
      }
    }
  }

  // hash จาก (defectId + updatedAt) ทั้งชุด ไม่ใช่แค่ MAX(updatedAt) เดี่ยวๆ เพื่อให้จับกรณีลบ defect ได้ด้วย
  //
  // แบบสรุปการตรวจต้องรวมด้วย เพราะมันขึ้นเป็นหน้าสรุปในเล่มรายงาน (ดู summaryPages ใน DefectReport.vue)
  // และช่างกรอกมัน "หลัง" กดยืนยันผลตรวจ ซึ่งเป็นจังหวะที่ PDF ถูก render ไปแล้ว — ถ้าไม่นับเข้า hash
  // ไฟล์ที่แนบไปกับอีเมลอนุมัติจะเป็นเล่มที่ไม่มีหน้าสรุป ทั้งที่ UI ขึ้นว่า "ล่าสุดแล้ว"
  // entity ตัวนี้ไม่มี updatedAt จึง hash จากเนื้อหาที่ถูก render จริงแทน (ครอบทั้งเพิ่ม/แก้/ลบ/เปลี่ยนรูป)
  private async computeDataHash(roundId: number): Promise<string> {
    const [defects, summaryItems] = await Promise.all([
      this.defectRepo.find({
        where: { round: { roundId } },
        select: ['defectId', 'updatedAt'],
        order: { defectId: 'ASC' },
      }),
      this.summaryItemRepo.find({
        where: { round: { roundId } },
        relations: ['template', 'option'],
        order: { itemId: 'ASC' },
      }),
    ]);

    const defectPart = defects
      .map((d) => `${d.defectId}:${d.updatedAt.getTime()}`)
      .join('|');

    // JSON.stringify กันเคส detailValue ที่เป็นข้อความอิสระมีตัวคั่นปนมาแล้วทำให้ได้ hash ซ้ำกับชุดอื่น
    const summaryPart = JSON.stringify(
      summaryItems.map((item) => [
        item.itemId,
        item.template?.templateId ?? null,
        item.option?.optionId ?? null,
        item.detailValue ?? '',
        item.photoUrl ?? '',
      ]),
    );

    return createHash('sha256')
      .update(`${defectPart}##${summaryPart}`)
      .digest('hex');
  }

  // reuse browser ตัวเดิมข้าม render — launch ใหม่ทุกครั้งกินเวลาหลักวินาทีและ RAM อีกก้อนโดยไม่จำเป็น
  // ปิดเฉพาะ page ต่อ render ส่วน browser ปิดตอน onModuleDestroy
  private async getBrowser(): Promise<Browser> {
    const existing = this.browserPromise;
    if (existing) {
      try {
        const browser = await existing;
        if (browser.connected) return browser;
      } catch {
        // launch รอบก่อนพัง ตกไป launch ใหม่ข้างล่าง
      }
      this.browserPromise = null;
    }

    const launched = puppeteer.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        // /dev/shm ใน container ดีฟอลต์แค่ 64MB — Chrome crash ตอน render รายงานที่รูปเยอะ
        '--disable-dev-shm-usage',
      ],
    });
    this.browserPromise = launched;

    try {
      return await launched;
    } catch (error) {
      this.browserPromise = null;
      throw error;
    }
  }

  private async renderReportPdf(
    roundId: number,
    locale: ReportLocale,
    generatedAt: Date,
  ): Promise<Buffer> {
    const frontendUrl = process.env.FRONTEND_URL ?? 'http://localhost:9000';

    const systemToken = this.jwtService.sign(
      { sub: 0, role: 'system' },
      { expiresIn: '5m' },
    );

    const browser = await this.getBrowser();
    const page = await browser.newPage();

    try {
      // ตั้ง default timeout ของ page ทั้งหมดด้วย (ไม่ใช่แค่ override ต่อ call) เพราะ Puppeteer
      // มี internal timeout 30000ms ของตัวเองในบาง operation ที่ไม่ได้ผูกกับ option ที่ส่งเข้า goto/waitForSelector โดยตรง
      page.setDefaultTimeout(120_000);
      page.setDefaultNavigationTimeout(120_000);

      // เก็บ request ที่โหลดไม่ขึ้นไว้สรุปท้าย render — รูปที่หายไปจากเล่มจะได้ไล่ต้นเหตุได้
      // จำกัดจำนวนไว้ ไม่งั้นรายงานที่พังยกเล่มจะถล่ม log เป็นพันบรรทัด
      const failedRequests: string[] = [];
      page.on('requestfailed', (request) => {
        if (failedRequests.length >= 10) return;
        failedRequests.push(
          `${request.url()} (${request.failure()?.errorText ?? 'unknown'})`,
        );
      });
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
      // generatedAt ส่งมาด้วยเพื่อให้ประทับเวลาในเล่มได้โดยไม่ต้องเซฟลง DB ก่อน render (ดู runRegeneration)
      const printUrl =
        `${frontendUrl}/#/print/report/${roundId}` +
        `?lang=${locale}&generatedAt=${encodeURIComponent(generatedAt.toISOString())}`;
      await page.goto(printUrl, {
        waitUntil: 'networkidle0',
        timeout: 120_000,
      });
      // รอให้หน้า print จบ ไม่ว่าจะสำเร็จหรือพัง แทนการรอเฉพาะสถานะสำเร็จ — ของเดิมพอหน้าโหลด
      // ข้อมูลไม่ได้จะไม่มีอะไรเกิดขึ้นเลย แล้วเราไปรอจนครบ timeout แล้วโยน "รอ selector ไม่เจอ"
      // ซึ่งไล่ต้นเหตุต่อไม่ได้ (ดู PrintDefectReportPage.vue)
      await page.waitForFunction(
        () => {
          const el = document.querySelector('[data-report-ready]');
          if (!el) return false;
          if (el.getAttribute('data-report-error')) return true;
          return el.getAttribute('data-report-ready') === 'true';
        },
        { timeout: 120_000 },
      );

      const pageError = await page.$eval(REPORT_ROOT_SELECTOR, (el) =>
        el.getAttribute('data-report-error'),
      );
      if (pageError) {
        throw new Error(`หน้า print โหลดข้อมูลไม่สำเร็จ: ${pageError}`);
      }

      if (failedRequests.length) {
        this.logger.warn(
          `รอบตรวจ ${roundId} (${locale}): มี request ที่โหลดไม่ขึ้นระหว่าง render — ${failedRequests.join(', ')}`,
        );
      }

      const pdfBytes = await page.pdf({
        format: 'A4',
        printBackground: true,
      });
      return Buffer.from(pdfBytes);
    } finally {
      // อย่าให้ error ตอนปิด page มากลบ error จริงที่เกิดระหว่าง render
      await page.close().catch(() => undefined);
    }
  }
}
