import { DefectNoteTranslator } from './defect-note-translator.service';
import { Defect } from './entities/defect.entity';
import { TranslationService } from 'src/ai-summary/translation.service';
import { Repository } from 'typeorm';

describe('DefectNoteTranslator', () => {
  let translator: DefectNoteTranslator;
  let defectsRepo: { find: jest.Mock; createQueryBuilder: jest.Mock };
  let translation: { toEnglish: jest.Mock; toEnglishMany: jest.Mock };
  let builder: {
    update: jest.Mock;
    set: jest.Mock;
    where: jest.Mock;
    execute: jest.Mock;
  };

  beforeEach(() => {
    builder = {
      update: jest.fn().mockReturnThis(),
      set: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      execute: jest.fn().mockResolvedValue({ affected: 1 }),
    };
    defectsRepo = {
      find: jest.fn().mockResolvedValue([]),
      createQueryBuilder: jest.fn().mockReturnValue(builder),
    };
    translation = {
      toEnglish: jest.fn(),
      toEnglishMany: jest.fn(),
    };
    translator = new DefectNoteTranslator(
      defectsRepo as unknown as Repository<Defect>,
      translation as unknown as TranslationService,
    );
  });

  describe('translateAndStore', () => {
    it('stores the translation without moving updatedAt', async () => {
      translation.toEnglish.mockResolvedValue('Uneven wall paint');

      await translator.translateAndStore(5, { description: 'สีผนังไม่เรียบ' });

      expect(builder.set).toHaveBeenCalledWith({
        descriptionEn: 'Uneven wall paint',
        updatedAt: expect.any(Function) as unknown,
      });
      // ต้องเขียนเฉพาะเมื่อข้อความต้นฉบับยังเหมือนเดิม กันคำแปลเก่าทับข้อความที่ผู้ใช้เพิ่งแก้
      expect(builder.where).toHaveBeenCalledWith({
        defectId: 5,
        description: 'สีผนังไม่เรียบ',
      });
    });

    it('translates the description and the contractor note separately', async () => {
      translation.toEnglish
        .mockResolvedValueOnce('Cracked wall')
        .mockResolvedValueOnce('Repaired');

      await translator.translateAndStore(5, {
        description: 'ผนังร้าว',
        contractorNote: 'ซ่อมแล้ว',
      });

      expect(builder.set).toHaveBeenCalledWith(
        expect.objectContaining({ descriptionEn: 'Cracked wall' }),
      );
      expect(builder.set).toHaveBeenCalledWith(
        expect.objectContaining({ contractorNoteEn: 'Repaired' }),
      );
    });

    it('skips text without Thai characters and never calls the LLM for it', async () => {
      await translator.translateAndStore(5, {
        description: '-',
        contractorNote: null,
      });

      expect(translation.toEnglish).not.toHaveBeenCalled();
      expect(builder.execute).not.toHaveBeenCalled();
    });

    it('writes nothing when the translation fails and never throws', async () => {
      translation.toEnglish.mockResolvedValue(null);
      await expect(
        translator.translateAndStore(5, { description: 'ผนังร้าว' }),
      ).resolves.toBeUndefined();
      expect(builder.execute).not.toHaveBeenCalled();

      translation.toEnglish.mockRejectedValue(new Error('boom'));
      await expect(
        translator.translateAndStore(5, { description: 'ผนังร้าว' }),
      ).resolves.toBeUndefined();
    });
  });

  describe('translateMissingForRound', () => {
    it('translates only notes that have Thai text and no translation yet', async () => {
      defectsRepo.find.mockResolvedValue([
        {
          defectId: 1,
          description: 'ผนังร้าว',
          descriptionEn: null,
          contractorNote: null,
          contractorNoteEn: null,
        },
        {
          defectId: 2,
          description: 'พื้นแตก',
          descriptionEn: 'Cracked floor',
          contractorNote: 'ซ่อมแล้ว',
          contractorNoteEn: null,
        },
        {
          defectId: 3,
          description: '-',
          descriptionEn: null,
          contractorNote: null,
          contractorNoteEn: null,
        },
      ]);
      translation.toEnglishMany.mockResolvedValue(['Cracked wall', 'Repaired']);

      const stored = await translator.translateMissingForRound(9);

      expect(translation.toEnglishMany).toHaveBeenCalledWith(
        ['ผนังร้าว', 'ซ่อมแล้ว'],
        expect.any(Number),
      );
      expect(stored).toBe(2);
      expect(builder.where).toHaveBeenCalledWith({
        defectId: 1,
        description: 'ผนังร้าว',
      });
      expect(builder.where).toHaveBeenCalledWith({
        defectId: 2,
        contractorNote: 'ซ่อมแล้ว',
      });
    });

    it('stops after a whole chunk fails so a dead provider is not retried for every note', async () => {
      defectsRepo.find.mockResolvedValue(
        Array.from({ length: 10 }, (_, i) => ({
          defectId: i + 1,
          description: 'ผนังร้าว',
          descriptionEn: null,
          contractorNote: null,
          contractorNoteEn: null,
        })),
      );
      translation.toEnglishMany.mockResolvedValue([null, null, null]);

      const stored = await translator.translateMissingForRound(9);

      expect(stored).toBe(0);
      expect(translation.toEnglishMany).toHaveBeenCalledTimes(1);
    });

    it('does nothing when every note is already translated', async () => {
      defectsRepo.find.mockResolvedValue([
        {
          defectId: 1,
          description: 'ผนังร้าว',
          descriptionEn: 'Cracked wall',
          contractorNote: null,
          contractorNoteEn: null,
        },
      ]);

      await expect(translator.translateMissingForRound(9)).resolves.toBe(0);
      expect(translation.toEnglishMany).not.toHaveBeenCalled();
    });
  });
});
