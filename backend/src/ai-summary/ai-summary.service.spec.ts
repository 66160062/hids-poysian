import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { AiSummaryService } from './ai-summary.service';
import { InspectionRound } from 'src/inspection-rounds/entities/inspection-round.entity';
import { Defect } from 'src/defects/entities/defect.entity';
import { InspectionSummaryItem } from 'src/inspection-summary-items/entities/inspection-summary-item.entity';
import { ProviderRegistryService } from './providers/provider-registry.service';

describe('AiSummaryService', () => {
  let service: AiSummaryService;
  let roundRepo: {
    findOne: jest.Mock;
    findOneBy: jest.Mock;
    findOneByOrFail: jest.Mock;
    save: jest.Mock;
  };
  let defectRepo: { find: jest.Mock };
  let summaryItemRepo: { find: jest.Mock };
  let providerRegistry: { getFallbackChain: jest.Mock; getById: jest.Mock };

  beforeEach(async () => {
    roundRepo = {
      findOne: jest.fn().mockResolvedValue({
        roundId: 1,
        job: { usableArea: 135, address: { floor: '2' } },
      }),
      findOneBy: jest.fn(),
      findOneByOrFail: jest.fn(),
      save: jest.fn(),
    };
    defectRepo = { find: jest.fn().mockResolvedValue([]) };
    summaryItemRepo = { find: jest.fn().mockResolvedValue([]) };
    providerRegistry = { getFallbackChain: jest.fn(), getById: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AiSummaryService,
        { provide: getRepositoryToken(InspectionRound), useValue: roundRepo },
        { provide: getRepositoryToken(Defect), useValue: defectRepo },
        {
          provide: getRepositoryToken(InspectionSummaryItem),
          useValue: summaryItemRepo,
        },
        { provide: ProviderRegistryService, useValue: providerRegistry },
      ],
    }).compile();

    service = module.get<AiSummaryService>(AiSummaryService);
  });

  describe('computeStats', () => {
    it('scores the round from its defects, system checks and house size together', async () => {
      defectRepo.find.mockResolvedValue([
        {
          severity: 'Major',
          status: 'pending_repair',
          subCategories: [{ category: { name: 'งานโครงสร้าง' } }],
          floor: { label: 'ชั้น 1' },
        },
      ]);
      summaryItemRepo.find.mockResolvedValue([
        {
          template: { category: 'งานระบบไฟฟ้า', label: 'มิเตอร์ไฟฟ้า' },
          option: { value: 'ยังไม่ได้ติดตั้ง' },
        },
      ]);

      const stats = await service.computeStats(1);

      expect(stats.totalDefects).toBe(1);
      expect(stats.majorCount).toBe(1);
      expect(stats.systemScore).toBe(0);
      expect(stats.failedSystems).toHaveLength(1);
      // คะแนนรวมต้องต่ำกว่าคะแนนส่วน defect เพราะผลตรวจระบบไม่ผ่าน
      expect(stats.completionPercent).toBeLessThan(stats.defectScore);
    });

    it('still scores the round when the house has no recorded floor count', async () => {
      roundRepo.findOne.mockResolvedValue({
        roundId: 1,
        job: { usableArea: 120, address: { floor: null } },
      });

      const stats = await service.computeStats(1);

      expect(stats.completionPercent).toBe(100);
    });
  });

  describe('generateIfChanged', () => {
    it('does nothing when the round does not exist', async () => {
      roundRepo.findOneBy.mockResolvedValue(null);

      await service.generateIfChanged(1, 'hash-a');

      expect(providerRegistry.getFallbackChain).not.toHaveBeenCalled();
    });

    it('skips calling the provider when the data hash has not changed', async () => {
      roundRepo.findOneBy.mockResolvedValue({
        roundId: 1,
        aiSummaryDataHash: 'hash-a',
      });

      await service.generateIfChanged(1, 'hash-a');

      expect(providerRegistry.getFallbackChain).not.toHaveBeenCalled();
      expect(roundRepo.save).not.toHaveBeenCalled();
    });

    it('does nothing when no provider is configured', async () => {
      roundRepo.findOneBy.mockResolvedValue({
        roundId: 1,
        aiSummaryDataHash: 'old-hash',
      });
      providerRegistry.getFallbackChain.mockReturnValue([]);

      await service.generateIfChanged(1, 'new-hash');

      expect(roundRepo.save).not.toHaveBeenCalled();
    });

    it('saves the AI text and completionPercent when the first provider in the chain succeeds', async () => {
      const round = { roundId: 1, aiSummaryDataHash: 'old-hash' };
      roundRepo.findOneBy.mockResolvedValue(round);
      roundRepo.save.mockImplementation((value) => value);
      providerRegistry.getFallbackChain.mockReturnValue([
        {
          id: 'gemini',
          generate: jest.fn().mockResolvedValue({ text: '  สรุปผลตรวจ  ' }),
        },
      ]);

      await service.generateIfChanged(1, 'new-hash');

      expect(roundRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({
          aiSummaryText: 'สรุปผลตรวจ',
          aiSummaryProvider: 'gemini',
          aiSummaryDataHash: 'new-hash',
          completionPercent: 100,
          // คะแนนย่อยต้องถูกเขียนพร้อมคะแนนรวมเสมอ ไม่งั้นรายงานจะโชว์ที่มาของคะแนนไม่ตรงกัน
          completionDefectScore: 100,
          completionSystemScore: null,
        }),
      );
    });

    it('falls back to the next provider in the chain when the first one throws', async () => {
      const round = { roundId: 1, aiSummaryDataHash: 'old-hash' };
      roundRepo.findOneBy.mockResolvedValue(round);
      roundRepo.save.mockImplementation((value) => value);
      const failingProvider = {
        id: 'gemini',
        generate: jest.fn().mockRejectedValue(new Error('rate limited')),
      };
      const workingProvider = {
        id: 'groq',
        generate: jest.fn().mockResolvedValue({ text: 'สรุปจาก groq' }),
      };
      providerRegistry.getFallbackChain.mockReturnValue([
        failingProvider,
        workingProvider,
      ]);

      await service.generateIfChanged(1, 'new-hash');

      expect(failingProvider.generate).toHaveBeenCalled();
      expect(workingProvider.generate).toHaveBeenCalled();
      expect(roundRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({
          aiSummaryText: 'สรุปจาก groq',
          aiSummaryProvider: 'groq',
          aiSummaryDataHash: 'new-hash',
        }),
      );
    });

    it('treats an empty summary as a failure and falls through to the next provider', async () => {
      const round = { roundId: 1, aiSummaryDataHash: 'old-hash' };
      roundRepo.findOneBy.mockResolvedValue(round);
      roundRepo.save.mockImplementation((value) => value);
      // reasoning model ที่ token หมดตอนคิด จะคืน string ว่างมาแบบไม่ throw
      const emptyProvider = {
        id: 'groq',
        generate: jest.fn().mockResolvedValue({ text: '   ' }),
      };
      const workingProvider = {
        id: 'gemini',
        generate: jest.fn().mockResolvedValue({ text: 'สรุปจริง' }),
      };
      providerRegistry.getFallbackChain.mockReturnValue([
        emptyProvider,
        workingProvider,
      ]);

      await service.generateIfChanged(1, 'new-hash');

      expect(workingProvider.generate).toHaveBeenCalled();
      expect(roundRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({
          aiSummaryText: 'สรุปจริง',
          aiSummaryProvider: 'gemini',
        }),
      );
    });

    it('still saves the deterministic completionPercent when every provider in the chain throws', async () => {
      const round = { roundId: 1, aiSummaryDataHash: 'old-hash' };
      roundRepo.findOneBy.mockResolvedValue(round);
      roundRepo.save.mockImplementation((value) => value);
      providerRegistry.getFallbackChain.mockReturnValue([
        {
          id: 'gemini',
          generate: jest.fn().mockRejectedValue(new Error('down')),
        },
        {
          id: 'groq',
          generate: jest.fn().mockRejectedValue(new Error('down')),
        },
      ]);

      await service.generateIfChanged(1, 'new-hash');

      expect(roundRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({ completionPercent: 100 }),
      );
      expect(roundRepo.save).toHaveBeenCalledWith(
        expect.not.objectContaining({ aiSummaryDataHash: 'new-hash' }),
      );
    });
  });

  describe('generateWithProvider', () => {
    it('throws when the requested provider is not configured', async () => {
      providerRegistry.getById.mockReturnValue({
        id: 'groq',
        isConfigured: () => false,
      });

      await expect(service.generateWithProvider(1, 'groq')).rejects.toThrow(
        'Provider groq ไม่ได้ configure ไว้',
      );
    });

    it('saves and returns the generated summary when the provider is configured', async () => {
      providerRegistry.getById.mockReturnValue({
        id: 'gemini',
        isConfigured: () => true,
        generate: jest.fn().mockResolvedValue({ text: 'สรุป' }),
      });
      roundRepo.findOneByOrFail.mockResolvedValue({ roundId: 1 });
      roundRepo.save.mockImplementation((value) => value);

      const result = await service.generateWithProvider(1, 'gemini');

      expect(result).toMatchObject({ text: 'สรุป', provider: 'gemini' });
      expect(roundRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({
          aiSummaryText: 'สรุป',
          aiSummaryProvider: 'gemini',
        }),
      );
    });
  });
});
