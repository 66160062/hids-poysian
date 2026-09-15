import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { SummaryTemplateOption } from 'src/summary-template-options/entities/summary-template-option.entity';

@Entity()
export class SummaryTemplate {
  @PrimaryGeneratedColumn()
  templateId!: number;

  @Column({ length: 255 })
  category!: string;

  @Column({ length: 255 })
  label!: string;

  // ชื่อภาษาอังกฤษ (optional) — ตารางนี้เป็น lookup ปิดตายตัว (ไม่กี่แถว) ไม่มี admin UI แก้ชื่อ
  @Column({ type: 'varchar', length: 255, nullable: true })
  categoryEn!: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  labelEn!: string | null;

  @OneToMany(() => SummaryTemplateOption, (option) => option.template)
  options!: SummaryTemplateOption[];
}
