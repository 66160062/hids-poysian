import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { JwtService } from '@nestjs/jwt';
import { ReportsService } from './reports.service';
import { InspectionRound } from 'src/inspection-rounds/entities/inspection-round.entity';
import { Defect } from 'src/defects/entities/defect.entity';
import { StorageService } from 'src/storage/storage.service';
import { ActivityLogsService } from 'src/activity-logs/activity-logs.service';
import puppeteer from 'puppeteer';

describe('ReportsService', () => {
  let service: ReportsService;
  let roundRepo: { findOneBy: jest.Mock; save: jest.Mock };
  let defectRepo: { find: jest.Mock };
  let storageService: { uploadPdf: jest.Mock; deleteFile: jest.Mock };
  let jwtService: { sign: jest.Mock };
  let activityLogsService: { logForRound: jest.Mock };

  beforeEach(async () => {
    roundRepo = { findOneBy: jest.fn(), save: jest.fn() };
    defectRepo = { find: jest.fn() };
    storageService = {
      uploadPdf: jest
        .fn()
        .mockResolvedValue('https://example.com/reports/new.pdf'),
      deleteFile: jest.fn(),
    };
    jwtService = { sign: jest.fn().mockReturnValue('system-token') };
    activityLogsService = { logForRound: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReportsService,
        { provide: getRepositoryToken(InspectionRound), useValue: roundRepo },
        { provide: getRepositoryToken(Defect), useValue: defectRepo },
        { provide: StorageService, useValue: storageService },
        { provide: JwtService, useValue: jwtService },
        { provide: ActivityLogsService, useValue: activityLogsService },
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
    it('returns null when the round has no cached pdf yet', async () => {
      roundRepo.findOneBy.mockResolvedValue({ lastPdfUrl: null });

      await expect(service.getCachedReportUrl(1)).resolves.toBeNull();
    });

    it('returns the cached pdf url without touching Puppeteer', async () => {
      roundRepo.findOneBy.mockResolvedValue({
        lastPdfUrl: 'https://example.com/reports/cached.pdf',
      });

      await expect(service.getCachedReportUrl(1)).resolves.toBe(
        'https://example.com/reports/cached.pdf',
      );
      expect(puppeteer.launch).not.toHaveBeenCalled();
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
        lastPdfHash: 'stale-hash',
        lastPdfUrl: 'https://example.com/reports/old.pdf',
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
