import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { JwtService } from '@nestjs/jwt';
import { ReportsService } from './reports.service';
import { InspectionRound } from 'src/inspection-rounds/entities/inspection-round.entity';
import { Defect } from 'src/defects/entities/defect.entity';
import { InspectionSummaryItem } from 'src/inspection-summary-items/entities/inspection-summary-item.entity';
import { StorageService } from 'src/storage/storage.service';
import { ActivityLogsService } from 'src/activity-logs/activity-logs.service';
import { AiSummaryService } from 'src/ai-summary/ai-summary.service';
import puppeteer from 'puppeteer';
import { createHash } from 'crypto';

// สูตรเดียวกับ computeDataHash ตอนไม่มีทั้ง defect และแบบสรุปการตรวจ
const EMPTY_DATA_HASH = createHash('sha256').update('##[]').digest('hex');

// อ้างตัว mock ไว้ครั้งเดียว แทนการแตะ puppeteer.launch ตรงๆ ทุกจุด (ติด unbound-method)
// puppeteer ถูก mock ทั้งโมดูล (Backend/__mocks__/puppeteer.js) launch จึงเป็น jest.fn ธรรมดา
// ไม่ใช่ method ที่ผูกกับ this — กฎ unbound-method จับผิดเคสนี้
// eslint-disable-next-line @typescript-eslint/unbound-method
const launchMock = puppeteer.launch as jest.Mock;

function createMockPage() {
  return {
    setDefaultTimeout: jest.fn(),
    setDefaultNavigationTimeout: jest.fn(),
    evaluateOnNewDocument: jest.fn(),
    goto: jest.fn(),
    waitForSelector: jest.fn(),
    waitForFunction: jest.fn(),
    // ดีฟอลต์ = หน้า print ไม่ได้รายงาน error กลับมา (ดู data-report-error)
    $eval: jest.fn().mockResolvedValue(null),
    on: jest.fn(),
    pdf: jest.fn().mockResolvedValue(Buffer.from('pdf-bytes')),
    close: jest.fn().mockResolvedValue(undefined),
  };
}

function createMockBrowser(page: ReturnType<typeof createMockPage>) {
  return {
    connected: true,
    newPage: jest.fn().mockResolvedValue(page),
    close: jest.fn().mockResolvedValue(undefined),
  };
}

describe('ReportsService', () => {
  let service: ReportsService;
  let roundRepo: {
    find: jest.Mock;
    findOneBy: jest.Mock;
    findOneByOrFail: jest.Mock;
    save: jest.Mock;
  };
  let defectRepo: { find: jest.Mock };
  let summaryItemRepo: { find: jest.Mock };
  let storageService: { uploadPdf: jest.Mock; deleteFile: jest.Mock };
  let jwtService: { sign: jest.Mock };
  let activityLogsService: { logForRound: jest.Mock };
  let aiSummaryService: { generateIfChanged: jest.Mock };

  beforeEach(async () => {
    roundRepo = {
      find: jest.fn().mockResolvedValue([]),
      findOneBy: jest.fn(),
      findOneByOrFail: jest.fn(),
      save: jest.fn(),
    };
    defectRepo = { find: jest.fn().mockResolvedValue([]) };
    summaryItemRepo = { find: jest.fn().mockResolvedValue([]) };
    storageService = {
      uploadPdf: jest
        .fn()
        .mockResolvedValue('https://example.com/reports/new.pdf'),
      deleteFile: jest.fn(),
    };
    jwtService = { sign: jest.fn().mockReturnValue('system-token') };
    activityLogsService = { logForRound: jest.fn() };
    aiSummaryService = {
      generateIfChanged: jest.fn().mockResolvedValue(undefined),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReportsService,
        { provide: getRepositoryToken(InspectionRound), useValue: roundRepo },
        { provide: getRepositoryToken(Defect), useValue: defectRepo },
        {
          provide: getRepositoryToken(InspectionSummaryItem),
          useValue: summaryItemRepo,
        },
        { provide: StorageService, useValue: storageService },
        { provide: JwtService, useValue: jwtService },
        { provide: ActivityLogsService, useValue: activityLogsService },
        { provide: AiSummaryService, useValue: aiSummaryService },
      ],
    }).compile();

    service = module.get<ReportsService>(ReportsService);
  });

  afterEach(async () => {
    // เก็บกวาด debounce timer / browser ที่ test อาจทิ้งค้าง ไม่ให้รั่วข้าม test
    await service.onModuleDestroy();
    jest.restoreAllMocks();
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getCachedReportUrl', () => {
    // ฝั่งอ่านสั่ง render ตรงๆ ผ่าน regenerateIfChanged ไม่ผ่าน debounce ของฝั่งเขียน
    // (ดู ensureRegenerationQueued) จึง spy ที่ตัวนี้
    let regenerateSpy: jest.SpyInstance;

    beforeEach(() => {
      regenerateSpy = jest
        .spyOn(service, 'regenerateIfChanged')
        .mockResolvedValue(null);
    });

    it('returns null url/generatedAt and isStale=true when the round has no cached pdf yet', async () => {
      roundRepo.findOneBy.mockResolvedValue({
        lastPdfUrl: null,
        lastPdfGeneratedAt: null,
        lastPdfHash: null,
      });

      await expect(service.getCachedReportUrl(1)).resolves.toEqual({
        url: null,
        generatedAt: null,
        isStale: true,
      });
    });

    it('returns the cached pdf url and isStale=false when the data has not changed, without touching Puppeteer', async () => {
      const generatedAt = new Date('2026-01-01T00:00:00Z');
      roundRepo.findOneBy.mockResolvedValue({
        lastPdfUrl: 'https://example.com/reports/cached.pdf',
        lastPdfGeneratedAt: generatedAt,
        lastPdfHash: EMPTY_DATA_HASH,
      });

      await expect(service.getCachedReportUrl(1)).resolves.toEqual({
        url: 'https://example.com/reports/cached.pdf',
        generatedAt,
        isStale: false,
      });
      expect(launchMock).not.toHaveBeenCalled();
      expect(regenerateSpy).not.toHaveBeenCalled();
    });

    it('returns isStale=true and schedules a regeneration when a defect changed', async () => {
      const generatedAt = new Date('2026-01-01T00:00:00Z');
      roundRepo.findOneBy.mockResolvedValue({
        lastPdfUrl: 'https://example.com/reports/cached.pdf',
        lastPdfGeneratedAt: generatedAt,
        lastPdfHash: EMPTY_DATA_HASH,
      });
      defectRepo.find.mockResolvedValue([
        { defectId: 1, updatedAt: new Date('2026-01-02T00:00:00Z') },
      ]);

      await expect(service.getCachedReportUrl(1)).resolves.toEqual({
        url: 'https://example.com/reports/cached.pdf',
        generatedAt,
        isStale: true,
      });
      expect(regenerateSpy).toHaveBeenCalledWith(1, 'th-TH');
    });

    // เคสหลักที่เคยหลุด: ช่างกรอกแบบสรุปหลังกดยืนยันผลตรวจ (PDF ถูก render ไปแล้ว) แล้วไม่มีอะไร
    // บอกว่าเล่มเก่ากว่าข้อมูลจริง ทำให้ไฟล์ที่แนบไปกับอีเมลอนุมัติเป็นเล่มที่ไม่มีหน้าสรุป
    it('returns isStale=true and schedules a regeneration when only the summary checklist changed', async () => {
      const generatedAt = new Date('2026-01-01T00:00:00Z');
      roundRepo.findOneBy.mockResolvedValue({
        lastPdfUrl: 'https://example.com/reports/cached.pdf',
        lastPdfGeneratedAt: generatedAt,
        lastPdfHash: EMPTY_DATA_HASH,
      });
      summaryItemRepo.find.mockResolvedValue([
        {
          itemId: 5,
          template: { templateId: 2 },
          option: { optionId: 3 },
          detailValue: 'ผ่าน',
          photoUrl: null,
        },
      ]);

      await expect(service.getCachedReportUrl(1)).resolves.toEqual({
        url: 'https://example.com/reports/cached.pdf',
        generatedAt,
        isStale: true,
      });
      expect(regenerateSpy).toHaveBeenCalledWith(1, 'th-TH');
    });

    it('reads the english cache columns and never blocks on a render', async () => {
      const generatedAtEn = new Date('2026-02-02T00:00:00Z');
      roundRepo.findOneBy.mockResolvedValue({
        lastPdfUrl: 'https://example.com/reports/th.pdf',
        lastPdfGeneratedAt: new Date('2026-01-01T00:00:00Z'),
        lastPdfHash: EMPTY_DATA_HASH,
        lastPdfUrlEn: 'https://example.com/reports/en.pdf',
        lastPdfGeneratedAtEn: generatedAtEn,
        lastPdfHashEn: 'stale-hash',
      });

      await expect(service.getCachedReportUrl(1, 'en-US')).resolves.toEqual({
        url: 'https://example.com/reports/en.pdf',
        generatedAt: generatedAtEn,
        isStale: true,
      });
      expect(launchMock).not.toHaveBeenCalled();
      expect(regenerateSpy).toHaveBeenCalledWith(1, 'en-US');
    });

    // ฝั่งอ่านไม่ควรต้องรอ debounce ของฝั่งเขียน ข้อมูลมัน stale ไปแล้ว ไม่มี burst ให้รวบ
    it('starts the render on the very first read instead of waiting out the debounce', async () => {
      roundRepo.findOneBy.mockResolvedValue({
        lastPdfUrl: 'https://example.com/reports/cached.pdf',
        lastPdfGeneratedAt: new Date('2026-01-01T00:00:00Z'),
        lastPdfHash: 'stale-hash',
      });

      await service.getCachedReportUrl(1);

      expect(regenerateSpy).toHaveBeenCalledTimes(1);
    });

    // บั๊กที่เจอจากการใช้งานจริง: หน้ารายงาน poll endpoint นี้ทุก 8 วินาทีตอน banner ขึ้น
    // (ดู checkReportFreshness ใน DefectReport.vue) ถ้าฝั่งอ่านไปรีเซ็ต debounce 30 วิของฝั่งเขียน
    // นัด render จะถูกดันออกไปทุกครั้งที่ poll จนไม่เริ่มสักที — หน้าที่รอไฟล์ใหม่กลายเป็นตัวถ่วงเอง
    it('does not restart or multiply the render on every 8-second poll', async () => {
      jest.useFakeTimers();
      roundRepo.findOneBy.mockResolvedValue({
        lastPdfUrl: 'https://example.com/reports/cached.pdf',
        lastPdfGeneratedAt: new Date('2026-01-01T00:00:00Z'),
        lastPdfHash: 'stale-hash',
      });

      for (let i = 0; i < 4; i += 1) {
        await service.getCachedReportUrl(1);
        jest.advanceTimersByTime(8_000);
      }

      expect(regenerateSpy).toHaveBeenCalledTimes(1);
      jest.useRealTimers();
    });

    // แบบสรุปการตรวจยังแก้ได้หลังอนุมัติ (ไม่มี guard ตามสถานะเหมือน defect) — ห้ามให้การแก้ตรงนั้น
    // ลามไป render ทับเล่มที่ส่งลูกค้าไปแล้ว และห้ามขึ้นธงว่าเล่มเก่ากว่าข้อมูล
    it('never marks an approved round stale nor schedules a regeneration for it', async () => {
      const generatedAt = new Date('2026-01-01T00:00:00Z');
      roundRepo.findOneBy.mockResolvedValue({
        status: 'APPROVED',
        lastPdfUrl: 'https://example.com/reports/approved.pdf',
        lastPdfGeneratedAt: generatedAt,
        lastPdfHash: 'hash-from-before-the-approval',
      });

      await expect(service.getCachedReportUrl(1)).resolves.toEqual({
        url: 'https://example.com/reports/approved.pdf',
        generatedAt,
        isStale: false,
      });
      expect(regenerateSpy).not.toHaveBeenCalled();
    });

    it('returns isStale=false when the round does not exist', async () => {
      roundRepo.findOneBy.mockResolvedValue(null);

      await expect(service.getCachedReportUrl(1)).resolves.toEqual({
        url: null,
        generatedAt: null,
        isStale: false,
      });
      expect(defectRepo.find).not.toHaveBeenCalled();
    });
  });

  describe('regenerateIfChanged', () => {
    it('returns null when the round does not exist', async () => {
      roundRepo.findOneBy.mockResolvedValue(null);

      await expect(service.regenerateIfChanged(1)).resolves.toBeNull();
    });

    it('skips Puppeteer entirely when the data hash has not changed', async () => {
      roundRepo.findOneBy.mockResolvedValue({
        roundId: 1,
        lastPdfHash: EMPTY_DATA_HASH,
        lastPdfUrl: 'https://example.com/reports/cached.pdf',
      });

      const result = await service.regenerateIfChanged(1);

      expect(launchMock).not.toHaveBeenCalled();
      expect(result).toBe('https://example.com/reports/cached.pdf');
    });

    it('refuses to re-render an approved round from a background trigger', async () => {
      defectRepo.find.mockResolvedValue([
        { defectId: 1, updatedAt: new Date('2026-01-01T00:00:00Z') },
      ]);
      roundRepo.findOneBy.mockResolvedValue({
        roundId: 1,
        status: 'APPROVED',
        lastPdfHash: 'hash-from-before-the-approval',
        lastPdfUrl: 'https://example.com/reports/approved.pdf',
      });

      const result = await service.regenerateIfChanged(1);

      expect(result).toBe('https://example.com/reports/approved.pdf');
      expect(launchMock).not.toHaveBeenCalled();
      expect(roundRepo.save).not.toHaveBeenCalled();
    });

    // ข้อยกเว้นเดียว: อีเมลอนุมัติ ซึ่งทำงานหลังรอบเป็น APPROVED แล้วและเป็นคนสร้างไฟล์ฉบับที่ลูกค้าได้รับ
    it('still renders an approved round when the approval email asks for it', async () => {
      defectRepo.find.mockResolvedValue([
        { defectId: 1, updatedAt: new Date('2026-01-01T00:00:00Z') },
      ]);
      roundRepo.findOneBy.mockResolvedValue({
        roundId: 1,
        roundNumber: 1,
        status: 'APPROVED',
        lastPdfHash: 'hash-from-before-the-approval',
        lastPdfUrl: null,
      });
      roundRepo.findOneByOrFail.mockResolvedValue({ roundId: 1 });
      roundRepo.save.mockImplementation((value: unknown) => value);
      launchMock.mockResolvedValue(createMockBrowser(createMockPage()));

      await expect(
        service.regenerateIfChanged(1, 'th-TH', { allowApproved: true }),
      ).resolves.toBe('https://example.com/reports/new.pdf');
    });

    it('deletes the previous pdf once the new one is saved, when the url actually changed', async () => {
      defectRepo.find.mockResolvedValue([
        { defectId: 1, updatedAt: new Date('2026-01-01T00:00:00Z') },
      ]);
      roundRepo.findOneBy.mockResolvedValue({
        roundId: 1,
        roundNumber: 1,
        lastPdfHash: 'stale-hash',
        lastPdfUrl: 'https://example.com/reports/old.pdf',
      });
      // จำลองค่าที่ AiSummaryService เพิ่งอัปเดตไว้แยกต่างหากใน DB ระหว่างทาง
      roundRepo.findOneByOrFail.mockResolvedValue({
        roundId: 1,
        roundNumber: 1,
        lastPdfHash: 'stale-hash',
        lastPdfUrl: 'https://example.com/reports/old.pdf',
        aiSummaryText: 'สรุปล่าสุดจาก AI',
      });
      roundRepo.save.mockImplementation((value: unknown) => value);

      const mockPage = createMockPage();
      const mockBrowser = createMockBrowser(mockPage);
      launchMock.mockResolvedValue(mockBrowser);

      const url = await service.regenerateIfChanged(1);

      expect(url).toBe('https://example.com/reports/new.pdf');
      expect(storageService.deleteFile).toHaveBeenCalledWith(
        'https://example.com/reports/old.pdf',
      );
      expect(mockPage.close).toHaveBeenCalled();
      expect(activityLogsService.logForRound).toHaveBeenCalledWith(
        1,
        expect.objectContaining({ type: 'report_pdf_updated' }),
      );
      // เซฟครั้งเดียวหลัง render สำเร็จ และต้องเซฟจาก object ที่ fetch ใหม่หลัง AI summary
      // ไม่ใช่ object เก่าตั้งแต่ต้นฟังก์ชัน ไม่งั้นค่า AI summary ที่เพิ่งอัปเดตจะถูกเขียนทับ
      expect(roundRepo.save).toHaveBeenCalledTimes(1);
      expect(roundRepo.save).toHaveBeenLastCalledWith(
        expect.objectContaining({
          aiSummaryText: 'สรุปล่าสุดจาก AI',
          lastPdfUrl: 'https://example.com/reports/new.pdf',
          lastPdfHash: expect.any(String) as unknown,
          lastPdfGeneratedAt: expect.any(Date) as unknown,
        }),
      );
    });

    it('stamps the pdf through the print url instead of writing to the db first', async () => {
      defectRepo.find.mockResolvedValue([
        { defectId: 1, updatedAt: new Date('2026-01-01T00:00:00Z') },
      ]);
      roundRepo.findOneBy.mockResolvedValue({
        roundId: 1,
        roundNumber: 1,
        lastPdfHash: 'stale-hash',
        lastPdfUrl: null,
      });
      roundRepo.findOneByOrFail.mockResolvedValue({ roundId: 1 });
      roundRepo.save.mockImplementation((value: unknown) => value);

      const mockPage = createMockPage();
      launchMock.mockResolvedValue(createMockBrowser(mockPage));

      await service.regenerateIfChanged(1, 'en-US');

      const [[visited]] = mockPage.goto.mock.calls as string[][];
      expect(visited).toContain('lang=en-US');
      expect(visited).toContain('generatedAt=');
    });

    // เดิมเซฟ lastPdfGeneratedAt ก่อน render แล้วไม่ rollback — ไฟล์เก่าเลยติดป้ายเวลาใหม่ตอน render พัง
    it('leaves the cached pdf columns untouched when rendering fails', async () => {
      defectRepo.find.mockResolvedValue([
        { defectId: 1, updatedAt: new Date('2026-01-01T00:00:00Z') },
      ]);
      roundRepo.findOneBy.mockResolvedValue({
        roundId: 1,
        lastPdfHash: 'stale-hash',
        lastPdfUrl: 'https://example.com/reports/old.pdf',
      });
      roundRepo.save.mockImplementation((value: unknown) => value);

      const mockPage = createMockPage();
      mockPage.goto.mockRejectedValue(new Error('navigation timeout'));
      launchMock.mockResolvedValue(createMockBrowser(mockPage));

      await expect(service.regenerateIfChanged(1)).rejects.toThrow(
        'navigation timeout',
      );
      expect(roundRepo.save).not.toHaveBeenCalled();
      expect(storageService.deleteFile).not.toHaveBeenCalled();
      expect(mockPage.close).toHaveBeenCalled();
    });

    // หน้า print โหลดข้อมูลไม่ได้ต้องล้มทันทีพร้อมเหตุผล ไม่ใช่ปล่อยให้รอจนครบ timeout
    // แล้วได้แค่ "รอ selector ไม่เจอ" ซึ่งไล่ต้นเหตุต่อไม่ได้
    it('fails with the reason reported by the print page', async () => {
      defectRepo.find.mockResolvedValue([
        { defectId: 1, updatedAt: new Date('2026-01-01T00:00:00Z') },
      ]);
      roundRepo.findOneBy.mockResolvedValue({
        roundId: 1,
        lastPdfHash: 'stale-hash',
        lastPdfUrl: 'https://example.com/reports/old.pdf',
      });
      roundRepo.save.mockImplementation((value: unknown) => value);

      const mockPage = createMockPage();
      mockPage.$eval.mockResolvedValue('Request failed with status code 500');
      launchMock.mockResolvedValue(createMockBrowser(mockPage));

      await expect(service.regenerateIfChanged(1)).rejects.toThrow(
        'Request failed with status code 500',
      );
      expect(mockPage.pdf).not.toHaveBeenCalled();
      expect(roundRepo.save).not.toHaveBeenCalled();
    });

    // ถ้าไม่กันซ้อน ทั้งสองฝั่งจะ upload คนละไฟล์แล้วเซฟทับกัน เหลือไฟล์ขยะค้างใน storage
    it('shares one render between concurrent calls for the same round and locale', async () => {
      defectRepo.find.mockResolvedValue([
        { defectId: 1, updatedAt: new Date('2026-01-01T00:00:00Z') },
      ]);
      roundRepo.findOneBy.mockResolvedValue({
        roundId: 1,
        roundNumber: 1,
        lastPdfHash: 'stale-hash',
        lastPdfUrl: null,
      });
      roundRepo.findOneByOrFail.mockResolvedValue({ roundId: 1 });
      roundRepo.save.mockImplementation((value: unknown) => value);

      const mockPage = createMockPage();
      const mockBrowser = createMockBrowser(mockPage);
      launchMock.mockResolvedValue(mockBrowser);

      const [first, second] = await Promise.all([
        service.regenerateIfChanged(1),
        service.regenerateIfChanged(1),
      ]);

      expect(first).toBe(second);
      expect(mockBrowser.newPage).toHaveBeenCalledTimes(1);
      expect(storageService.uploadPdf).toHaveBeenCalledTimes(1);
    });
  });

  describe('sweepStaleRounds', () => {
    // เรียก sweep ผ่าน timer ที่ onModuleInit ตั้งไว้ จะได้ทดสอบของจริงโดยไม่ต้องแตะ private method
    const runSweep = async () => {
      service.onModuleInit();
      jest.advanceTimersByTime(5 * 60_000);
      // ปล่อยให้ promise chain ใน sweep เดินจนจบ
      await Promise.resolve();
      await Promise.resolve();
      await Promise.resolve();
    };

    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    // sweep มีไว้ "ตามให้ทัน" เวลา debounce หลุด ไม่ใช่ไปไล่สร้างรายงานให้รอบที่ไม่เคยมี
    // ซึ่งรวมรอบข้อมูลกำพร้าที่หน้า print โดน 404 แล้ววน render ใหม่ไม่มีวันจบ
    it('only looks at rounds that already have a pdf', async () => {
      await runSweep();

      const [options] = roundRepo.find.mock.calls[0] as [
        { where: Record<string, unknown> },
      ];
      expect(Object.keys(options.where).sort()).toEqual([
        'inspectedAt',
        'lastPdfUrl',
        'status',
      ]);
    });
  });

  describe('getLatestReportPdf', () => {
    const fetchMock = jest.fn();
    const originalFetch = global.fetch;

    beforeEach(() => {
      global.fetch = fetchMock;
    });

    afterEach(() => {
      fetchMock.mockReset();
      global.fetch = originalFetch;
    });

    it('regenerates right away, cancels the pending debounce, and returns the pdf bytes', async () => {
      jest.useFakeTimers();
      const regenerate = jest
        .spyOn(service, 'regenerateIfChanged')
        .mockResolvedValue('https://example.com/reports/latest.pdf');
      fetchMock.mockResolvedValue({
        ok: true,
        arrayBuffer: () => Promise.resolve(Buffer.from('%PDF-1.7')),
      });

      service.scheduleRegeneration(1);
      const pdf = await service.getLatestReportPdf(1);
      jest.advanceTimersByTime(30_000);

      expect(regenerate).toHaveBeenCalledTimes(1);
      expect(regenerate).toHaveBeenCalledWith(1, 'th-TH', {
        allowApproved: true,
      });
      expect(fetchMock).toHaveBeenCalledWith(
        'https://example.com/reports/latest.pdf',
      );
      expect(pdf.toString()).toBe('%PDF-1.7');
      jest.useRealTimers();
    });

    it('throws when the round has no report to attach', async () => {
      jest.spyOn(service, 'regenerateIfChanged').mockResolvedValue(null);

      await expect(service.getLatestReportPdf(1)).rejects.toThrow();
      expect(fetchMock).not.toHaveBeenCalled();
    });

    it('throws when downloading the stored pdf fails', async () => {
      jest
        .spyOn(service, 'regenerateIfChanged')
        .mockResolvedValue('https://example.com/reports/latest.pdf');
      fetchMock.mockResolvedValue({ ok: false, status: 404 });

      await expect(service.getLatestReportPdf(1)).rejects.toThrow('404');
    });
  });

  describe('scheduleRegeneration', () => {
    it('debounces repeated calls for the same round into a single regeneration', () => {
      jest.useFakeTimers();
      const spy = jest
        .spyOn(service, 'regenerateIfChanged')
        .mockResolvedValue(null);

      service.scheduleRegeneration(1);
      service.scheduleRegeneration(1);
      service.scheduleRegeneration(1);

      jest.advanceTimersByTime(30_000);

      expect(spy).toHaveBeenCalledTimes(1);
      jest.useRealTimers();
    });

    it('keeps thai and english debounce timers separate', () => {
      jest.useFakeTimers();
      const spy = jest
        .spyOn(service, 'regenerateIfChanged')
        .mockResolvedValue(null);

      service.scheduleRegeneration(1);
      service.scheduleRegeneration(1, 'en-US');

      jest.advanceTimersByTime(30_000);

      expect(spy).toHaveBeenCalledTimes(2);
      expect(spy).toHaveBeenCalledWith(1, 'th-TH');
      expect(spy).toHaveBeenCalledWith(1, 'en-US');
      jest.useRealTimers();
    });

    // แก้ถี่กว่า debounce ไปเรื่อยๆ เคยทำให้ timer ถูกเลื่อนไม่รู้จบจน PDF ไม่ถูกสร้างสักที
    it('stops pushing the timer back once the max wait is exceeded', () => {
      jest.useFakeTimers();
      const spy = jest
        .spyOn(service, 'regenerateIfChanged')
        .mockResolvedValue(null);

      service.scheduleRegeneration(1);
      for (let i = 0; i < 10; i += 1) {
        jest.advanceTimersByTime(25_000);
        service.scheduleRegeneration(1);
      }

      expect(spy).toHaveBeenCalled();
      jest.useRealTimers();
    });
  });
});
