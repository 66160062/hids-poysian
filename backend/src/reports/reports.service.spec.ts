import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { JwtService } from '@nestjs/jwt';
import { ReportsService } from './reports.service';
import { InspectionRound } from 'src/inspection-rounds/entities/inspection-round.entity';
import { Defect } from 'src/defects/entities/defect.entity';
import { StorageService } from 'src/storage/storage.service';
import { ActivityLogsService } from 'src/activity-logs/activity-logs.service';
import { AiSummaryService } from 'src/ai-summary/ai-summary.service';
import puppeteer from 'puppeteer';
import { createHash } from 'crypto';

const EMPTY_DEFECTS_HASH = createHash('sha256').update('').digest('hex');

describe('ReportsService', () => {
  let service: ReportsService;
  let roundRepo: {
    findOneBy: jest.Mock;
    findOneByOrFail: jest.Mock;
    save: jest.Mock;
  };
  let defectRepo: { find: jest.Mock };
  let storageService: { uploadPdf: jest.Mock; deleteFile: jest.Mock };
  let jwtService: { sign: jest.Mock };
  let activityLogsService: { logForRound: jest.Mock };
  let aiSummaryService: { generateIfChanged: jest.Mock };

  beforeEach(async () => {
    roundRepo = {
      findOneBy: jest.fn(),
      findOneByOrFail: jest.fn(),
      save: jest.fn(),
    };
    defectRepo = { find: jest.fn() };
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
        { provide: StorageService, useValue: storageService },
        { provide: JwtService, useValue: jwtService },
        { provide: ActivityLogsService, useValue: activityLogsService },
        { provide: AiSummaryService, useValue: aiSummaryService },
      ],
    }).compile();

    service = module.get<ReportsService>(ReportsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getCachedReportUrl', () => {
    it('returns null url/generatedAt and isStale=true when the round has no cached pdf yet', async () => {
      roundRepo.findOneBy.mockResolvedValue({
        lastPdfUrl: null,
        lastPdfGeneratedAt: null,
        lastPdfHash: null,
      });
      defectRepo.find.mockResolvedValue([]);

      await expect(service.getCachedReportUrl(1)).resolves.toEqual({
        url: null,
        generatedAt: null,
        isStale: true,
      });
    });

    it('returns the cached pdf url and isStale=false when defect data has not changed, without touching Puppeteer', async () => {
      const generatedAt = new Date('2026-01-01T00:00:00Z');
      roundRepo.findOneBy.mockResolvedValue({
        lastPdfUrl: 'https://example.com/reports/cached.pdf',
        lastPdfGeneratedAt: generatedAt,
        lastPdfHash: EMPTY_DEFECTS_HASH,
      });
      defectRepo.find.mockResolvedValue([]);

      await expect(service.getCachedReportUrl(1)).resolves.toEqual({
        url: 'https://example.com/reports/cached.pdf',
        generatedAt,
        isStale: false,
      });
      expect(puppeteer.launch).not.toHaveBeenCalled();
    });

    it('returns isStale=true when a defect changed after the cached pdf was generated', async () => {
      const generatedAt = new Date('2026-01-01T00:00:00Z');
      roundRepo.findOneBy.mockResolvedValue({
        lastPdfUrl: 'https://example.com/reports/cached.pdf',
        lastPdfGeneratedAt: generatedAt,
        lastPdfHash: EMPTY_DEFECTS_HASH,
      });
      defectRepo.find.mockResolvedValue([
        { defectId: 1, updatedAt: new Date('2026-01-02T00:00:00Z') },
      ]);

      await expect(service.getCachedReportUrl(1)).resolves.toEqual({
        url: 'https://example.com/reports/cached.pdf',
        generatedAt,
        isStale: true,
      });
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

    it('skips Puppeteer entirely when the defect data hash has not changed', async () => {
      defectRepo.find.mockResolvedValue([]);
      const unchangedHash =
        'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855';
      roundRepo.findOneBy.mockResolvedValue({
        roundId: 1,
        lastPdfHash: unchangedHash,
        lastPdfUrl: 'https://example.com/reports/cached.pdf',
      });

      const result = await service.regenerateIfChanged(1);

      expect(puppeteer.launch).not.toHaveBeenCalled();
      expect(result).toBe('https://example.com/reports/cached.pdf');
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
      // simule ค่าที่ AiSummaryService เพิ่งอัปเดตไว้แยกต่างหากใน DB ระหว่างทาง
      roundRepo.findOneByOrFail.mockResolvedValue({
        roundId: 1,
        roundNumber: 1,
        lastPdfHash: 'stale-hash',
        lastPdfUrl: 'https://example.com/reports/old.pdf',
        aiSummaryText: 'สรุปล่าสุดจาก AI',
      });
      roundRepo.save.mockImplementation((value) => value);

      const mockPage = {
        setDefaultTimeout: jest.fn(),
        setDefaultNavigationTimeout: jest.fn(),
        evaluateOnNewDocument: jest.fn(),
        goto: jest.fn(),
        waitForSelector: jest.fn(),
        pdf: jest.fn().mockResolvedValue(Buffer.from('pdf-bytes')),
      };
      const mockBrowser = {
        newPage: jest.fn().mockResolvedValue(mockPage),
        close: jest.fn(),
      };
      (puppeteer.launch as jest.Mock).mockResolvedValue(mockBrowser);

      const url = await service.regenerateIfChanged(1);

      expect(url).toBe('https://example.com/reports/new.pdf');
      expect(storageService.deleteFile).toHaveBeenCalledWith(
        'https://example.com/reports/old.pdf',
      );
      expect(mockBrowser.close).toHaveBeenCalled();
      expect(activityLogsService.logForRound).toHaveBeenCalledWith(
        1,
        expect.objectContaining({ type: 'report_pdf_updated' }),
      );
      // ต้อง save จาก object ที่ fetch ใหม่หลัง AI summary ไม่ใช่ object เก่าตั้งแต่ต้นฟังก์ชัน
      // ไม่งั้นค่า AI summary ที่เพิ่งอัปเดตจะถูกเขียนทับกลับเป็นค่าเก่า/undefined
      expect(roundRepo.save).toHaveBeenLastCalledWith(
        expect.objectContaining({
          aiSummaryText: 'สรุปล่าสุดจาก AI',
          lastPdfUrl: 'https://example.com/reports/new.pdf',
          lastPdfGeneratedAt: expect.any(Date),
        }),
      );
    });

    it('closes the browser even when rendering throws', async () => {
      defectRepo.find.mockResolvedValue([
        { defectId: 1, updatedAt: new Date('2026-01-01T00:00:00Z') },
      ]);
      roundRepo.findOneBy.mockResolvedValue({
        roundId: 1,
        lastPdfHash: 'stale-hash',
        lastPdfUrl: null,
      });
      roundRepo.findOneByOrFail.mockResolvedValue({
        roundId: 1,
        lastPdfHash: 'stale-hash',
        lastPdfUrl: null,
      });
      roundRepo.save.mockImplementation((value) => value);

      const mockPage = {
        setDefaultTimeout: jest.fn(),
        setDefaultNavigationTimeout: jest.fn(),
        evaluateOnNewDocument: jest.fn(),
        goto: jest.fn().mockRejectedValue(new Error('navigation timeout')),
        waitForSelector: jest.fn(),
        pdf: jest.fn(),
      };
      const mockBrowser = {
        newPage: jest.fn().mockResolvedValue(mockPage),
        close: jest.fn(),
      };
      (puppeteer.launch as jest.Mock).mockResolvedValue(mockBrowser);

      await expect(service.regenerateIfChanged(1)).rejects.toThrow(
        'navigation timeout',
      );
      expect(mockBrowser.close).toHaveBeenCalled();
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
  });
});
