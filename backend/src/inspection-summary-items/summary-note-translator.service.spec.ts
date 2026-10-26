import { Repository } from 'typeorm';
import { SummaryNoteTranslator } from './summary-note-translator.service';
import { InspectionSummaryItem } from './entities/inspection-summary-item.entity';
import { TranslationService } from 'src/ai-summary/translation.service';

describe('SummaryNoteTranslator', () => {
  let translator: SummaryNoteTranslator;
  let itemsRepo: { find: jest.Mock; createQueryBuilder: jest.Mock };
  let translation: { toEnglishMany: jest.Mock };
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
      execute: jest.fn().mockResolvedValue({ affected: 2 }),
    };
    itemsRepo = {
      find: jest.fn().mockResolvedValue([]),
      createQueryBuilder: jest.fn().mockReturnValue(builder),
    };
    translation = { toEnglishMany: jest.fn() };
    translator = new SummaryNoteTranslator(
      itemsRepo as unknown as Repository<InspectionSummaryItem>,
      translation as unknown as TranslationService,
    );
  });

  it('translates each distinct note once and writes it to every row that shares it', async () => {
    itemsRepo.find.mockResolvedValue([
      { itemId: 1, detailValue: 'รั่วหนักที่ชายคาน', detailValueEn: null },
      { itemId: 2, detailValue: 'รั่วหนักที่ชายคาน', detailValueEn: null },
      { itemId: 3, detailValue: '', detailValueEn: null },
      { itemId: 4, detailValue: 'Already English', detailValueEn: null },
      { itemId: 5, detailValue: 'ผนังร้าว', detailValueEn: 'Cracked wall' },
    ]);
    translation.toEnglishMany.mockResolvedValue([
      'Heavy leak at the beam eave',
    ]);

    const stored = await translator.translateMissingForRound(7);

    expect(translation.toEnglishMany).toHaveBeenCalledWith(
      ['รั่วหนักที่ชายคาน'],
      expect.any(Number),
    );
    expect(builder.set).toHaveBeenCalledWith({
      detailValueEn: 'Heavy leak at the beam eave',
    });
    // ต้องเขียนเฉพาะเมื่อข้อความต้นฉบับยังเหมือนที่ส่งไปแปล
    expect(builder.where).toHaveBeenCalledWith(
      expect.stringContaining('detail_value = :text'),
      { ids: [1, 2], text: 'รั่วหนักที่ชายคาน' },
    );
    expect(stored).toBe(2);
  });

  it('does nothing when every note is already translated or needs no translation', async () => {
    itemsRepo.find.mockResolvedValue([
      { itemId: 1, detailValue: 'ผนังร้าว', detailValueEn: 'Cracked wall' },
      { itemId: 2, detailValue: '-', detailValueEn: null },
    ]);

    await expect(translator.translateMissingForRound(7)).resolves.toBe(0);
    expect(translation.toEnglishMany).not.toHaveBeenCalled();
  });

  it('stops after a whole chunk fails so a dead provider is not retried for every note', async () => {
    itemsRepo.find.mockResolvedValue(
      Array.from({ length: 10 }, (_, i) => ({
        itemId: i + 1,
        detailValue: `หมายเหตุ ${i + 1}`,
        detailValueEn: null,
      })),
    );
    translation.toEnglishMany.mockResolvedValue([null, null, null]);

    await expect(translator.translateMissingForRound(7)).resolves.toBe(0);
    expect(translation.toEnglishMany).toHaveBeenCalledTimes(1);
    expect(builder.execute).not.toHaveBeenCalled();
  });
});
