import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Defect } from './entities/defect.entity';
import {
  needsEnglishTranslation,
  TranslationService,
} from 'src/ai-summary/translation.service';

type NoteField = 'description' | 'contractorNote';

// ต่อรอบ sweep แปลไม่เกินนี้ กัน LLM free tier ชน rate limit และกัน PDF รอนานเมื่อมี defect เยอะ
const MAX_BACKFILL_PER_RUN = 40;
const BACKFILL_CHUNK_SIZE = 3;

/*
 * แปลหมายเหตุของ defect (description / contractorNote) เป็นอังกฤษแล้วเก็บลงคอลัมน์ *_en
 *
 * ทำแบบ async หลังบันทึก ไม่ให้ผู้ตรวจรอ LLM (ผู้ตรวจทำงานแบบ offline-first ถ้าต้องรอ API ทุกจุดจะช้าและพังเมื่อ API ล่ม)
 * แปลไม่สำเร็จก็ไม่เป็นไร คอลัมน์ยังเป็น null และรายงานอังกฤษจะแสดงข้อความไทยแทน แล้วรอบถัดไปจะแปลซ้ำ (translateMissingForRound)
 */
@Injectable()
export class DefectNoteTranslator {
  private readonly logger = new Logger(DefectNoteTranslator.name);

  constructor(
    @InjectRepository(Defect)
    private readonly defectsRepo: Repository<Defect>,
    private readonly translation: TranslationService,
  ) {}

  // เรียกแบบ fire-and-forget หลังสร้าง/แก้ defect — ไม่ throw เด็ดขาด
  async translateAndStore(
    defectId: number,
    notes: { description?: string | null; contractorNote?: string | null },
  ): Promise<void> {
    try {
      for (const field of ['description', 'contractorNote'] as const) {
        const original = notes[field];
        if (!needsEnglishTranslation(original)) continue;

        const english = await this.translation.toEnglish(original);
        if (english) await this.store(defectId, field, original!, english);
      }
    } catch (error) {
      this.logger.warn(
        `แปลหมายเหตุ defect ${defectId} ไม่สำเร็จ: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  // แปลหมายเหตุที่ยังไม่มีคำแปลของรอบตรวจนั้น (defect เก่า หรือรอบที่ LLM ล่มตอนบันทึก)
  // คืนจำนวนที่แปลสำเร็จ — หยุดทันทีถ้าชุดล่าสุดล้มเหลวทั้งหมด กันรอ timeout ซ้ำๆ เมื่อ provider ล่มหมด
  async translateMissingForRound(roundId: number): Promise<number> {
    const defects = await this.defectsRepo.find({
      where: { round: { roundId } },
      select: [
        'defectId',
        'description',
        'descriptionEn',
        'contractorNote',
        'contractorNoteEn',
      ],
      order: { defectId: 'ASC' },
    });

    const pending: { defectId: number; field: NoteField; text: string }[] = [];
    for (const d of defects) {
      if (!d.descriptionEn && needsEnglishTranslation(d.description)) {
        pending.push({
          defectId: d.defectId,
          field: 'description',
          text: d.description,
        });
      }
      if (!d.contractorNoteEn && needsEnglishTranslation(d.contractorNote)) {
        pending.push({
          defectId: d.defectId,
          field: 'contractorNote',
          text: d.contractorNote,
        });
      }
    }

    let stored = 0;
    const batch = pending.slice(0, MAX_BACKFILL_PER_RUN);
    for (let i = 0; i < batch.length; i += BACKFILL_CHUNK_SIZE) {
      const chunk = batch.slice(i, i + BACKFILL_CHUNK_SIZE);
      const results = await this.translation.toEnglishMany(
        chunk.map((c) => c.text),
        BACKFILL_CHUNK_SIZE,
      );

      for (const [index, item] of chunk.entries()) {
        const english = results[index];
        if (!english) continue;
        if (await this.store(item.defectId, item.field, item.text, english)) {
          stored += 1;
        }
      }

      if (results.every((r) => r === null)) {
        this.logger.warn(
          `รอบตรวจ ${roundId}: แปลหมายเหตุไม่สำเร็จทั้งชุด หยุดแปลที่เหลือไว้รอบหน้า`,
        );
        break;
      }
    }
    return stored;
  }

  // เขียนเฉพาะเมื่อข้อความต้นฉบับยังเหมือนที่ส่งไปแปล — ถ้าผู้ใช้แก้ข้อความระหว่างรอ LLM คำแปลเก่าจะไม่ทับของใหม่
  // และตั้ง updatedAt เป็นค่าเดิม เพราะ hash ของ PDF/AI summary คิดจาก updatedAt — ถ้าปล่อยให้เลื่อน
  // การแปลทุกครั้งจะทำให้สรุป AI ถูกสร้างซ้ำโดยไม่จำเป็น (คำแปลถูกนับเข้า hash ของ PDF อังกฤษแยกต่างหาก)
  private async store(
    defectId: number,
    field: NoteField,
    original: string,
    english: string,
  ): Promise<boolean> {
    const keepUpdatedAt = () => 'updated_at';
    const builder = this.defectsRepo.createQueryBuilder().update(Defect);
    const result =
      field === 'description'
        ? await builder
            .set({ descriptionEn: english, updatedAt: keepUpdatedAt })
            .where({ defectId, description: original })
            .execute()
        : await builder
            .set({ contractorNoteEn: english, updatedAt: keepUpdatedAt })
            .where({ defectId, contractorNote: original })
            .execute();
    return (result.affected ?? 0) > 0;
  }
}
