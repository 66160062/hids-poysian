import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { InspectionRound } from 'src/inspection-rounds/entities/inspection-round.entity';
import { SummaryTemplate } from 'src/summary-templates/entities/summary-template.entity';
import { SummaryTemplateOption } from 'src/summary-template-options/entities/summary-template-option.entity';

@Entity()
export class InspectionSummaryItem {
  @PrimaryGeneratedColumn()
  itemId: number;

  @ManyToOne(() => InspectionRound)
  @JoinColumn({ name: 'round_id' })
  round: InspectionRound;

  @ManyToOne(() => SummaryTemplate)
  @JoinColumn({ name: 'template_id' })
  template: SummaryTemplate;

  @ManyToOne(() => SummaryTemplateOption)
  @JoinColumn({ name: 'option_id' })
  option: SummaryTemplateOption;

  @Column({ type: 'text', nullable: true })
  detailValue: string;
}
