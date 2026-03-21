import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { SummaryTemplateOption } from 'src/summary-template-options/entities/summary-template-option.entity';

@Entity()
export class SummaryTemplate {
  @PrimaryGeneratedColumn()
  templateId: number;

  @Column({ length: 255 })
  category: string;

  @Column({ length: 255 })
  label: string;

  @OneToMany(() => SummaryTemplateOption, (option) => option.template)
  options: SummaryTemplateOption[];
}
