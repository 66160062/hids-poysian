import { SummaryTemplate } from 'src/summary-templates/entities/summary-template.entity';
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';

@Entity()
export class SummaryTemplateOption {
  @PrimaryGeneratedColumn()
  optionId!: number;

  @ManyToOne(() => SummaryTemplate)
  @JoinColumn({ name: 'template_id' })
  template!: SummaryTemplate;

  @Column({ length: 255 })
  value!: string;

  @Column({ length: 255, nullable: true })
  group!: string; // เช่น "รูปแบบโครงสร้าง", "รายละเอียด"

  @Column({ length: 50, default: 'radio' })
  type!: string; // 'radio' หรือ 'checkbox'

  // ชื่อภาษาอังกฤษ (optional) — ตารางนี้เป็น lookup ปิดตายตัว (ไม่กี่แถว) ไม่มี admin UI แก้ชื่อ
  @Column({ type: 'varchar', length: 255, nullable: true })
  valueEn!: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  groupEn!: string | null;
}
