import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { InspectionSummaryItem } from './entities/inspection-summary-item.entity';
import {
  needsEnglishTranslation,
  TranslationService,
} from 'src/ai-summary/translation.service';

// ต่อรอบ render แปลไม่เกินนี้ กัน LLM free tier ชน rate limit และกัน PDF รอนานเมื่อมีหมายเหตุเยอะ
const MAX_BACKFILL_PER_RUN = 30;
const BACKFILL_CHUNK_SIZE = 3;

/*
 * แปลหมายเหตุที่ผู้ตรวจพิมพ์เองในแบบสรุปท้ายเล่ม (detailValue) เป็นอังกฤษเก็บลง detailValueEn
 *
 * ไม่แปลตอนบันทึกเหมือนหมายเหตุ defect เพราะหน้าแบบสรุปบันทึกด้วยการลบแล้วสร้างแถวใหม่ทั้งรอบ (replaceForRound)
 * ทุกครั้งที่กดบันทึก — จึงแปลตอนจะ render PDF อังกฤษแทน และ replaceForRound ยกคำแปลเดิมมาใช้ต่อถ้าข้อความไม่เปลี่ยน
 */
@Injectable()
export class SummaryNoteTranslator {
  private readonly logger = new Logger(SummaryNoteTranslator.name);

  constructor(
    @InjectRepository(InspectionSummaryItem)
    private readonly itemsRepo: Repository<InspectionSummaryItem>,
    private readonly translation: TranslationService,
  ) {}

  // คืนจำนวนที่แปลสำเร็จ — หยุดทันทีถ้าชุดล่าสุดล้มเหลวทั้งหมด กันรอ timeout ซ้ำๆ เมื่อ provider ล่มหมด
  async translateMissingForRound(roundId: number): Promise<number> {
    const items = await this.itemsRepo.find({
      where: { round: { roundId } },
      select: ['itemId', 'detailValue', 'detailValueEn'],
      order: { itemId: 'ASC' },
    });

    // หมายเหตุเดียวกันถูกเก็บซ้ำลงทุกตัวเลือกที่ติ้กในหัวข้อเดียว — แปลข้อความละครั้งแล้วเขียนลงทุกแถวที่ตรงกัน
    const pendingByText = new Map<string, number[]>();
    for (const item of items) {
      if (item.detailValueEn || !needsEnglishTranslation(item.detailValue)) {
        continue;
      }
      const ids = pendingByText.get(item.detailValue) ?? [];
      ids.push(item.itemId);
      pendingByText.set(item.detailValue, ids);
    }

    const texts = [...pendingByText.keys()].slice(0, MAX_BACKFILL_PER_RUN);
    let stored = 0;
    for (let i = 0; i < texts.length; i += BACKFILL_CHUNK_SIZE) {
      const chunk = texts.slice(i, i + BACKFILL_CHUNK_SIZE);
      const results = await this.translation.toEnglishMany(
        chunk,
        BACKFILL_CHUNK_SIZE,
      );

      for (const [index, text] of chunk.entries()) {
        const english = results[index];
        if (!english) continue;
        // เขียนเฉพาะเมื่อข้อความต้นฉบับยังเหมือนที่ส่งไปแปล กันคำแปลเก่าทับข้อความที่เพิ่งแก้
        const result = await this.itemsRepo
          .createQueryBuilder()
          .update(InspectionSummaryItem)
          .set({ detailValueEn: english })
          .where('item_id IN (:...ids) AND detail_value = :text', {
            ids: pendingByText.get(text),
            text,
          })
          .execute();
        stored += result.affected ?? 0;
      }

      if (results.every((r) => r === null)) {
        this.logger.warn(
          `รอบตรวจ ${roundId}: แปลหมายเหตุแบบสรุปไม่สำเร็จทั้งชุด หยุดแปลที่เหลือไว้รอบหน้า`,
        );
        break;
      }
    }
    return stored;
  }
}
