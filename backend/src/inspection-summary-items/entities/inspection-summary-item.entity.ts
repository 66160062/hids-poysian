import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  RelationId,
} from 'typeorm';
import { InspectionRound } from 'src/inspection-rounds/entities/inspection-round.entity';
import { SummaryTemplate } from 'src/summary-templates/entities/summary-template.entity';
import { SummaryTemplateOption } from 'src/summary-template-options/entities/summary-template-option.entity';

@Entity()
export class InspectionSummaryItem {
  @PrimaryGeneratedColumn()
  itemId!: number;

  @ManyToOne(() => InspectionRound)
  @JoinColumn({ name: 'round_id' })
  round!: InspectionRound;

  // ได้ roundId มาโดยไม่ต้อง join round ทั้งก้อน — controller ใช้สั่ง regenerate PDF ตอนแก้/ลบ
  // item รายตัว ซึ่ง service ไม่ได้โหลด relation round มาให้ (ดู InspectionSummaryItemsController)
  @RelationId((item: InspectionSummaryItem) => item.round)
  roundId?: number;

  @ManyToOne(() => SummaryTemplate)
  @JoinColumn({ name: 'template_id' })
  template!: SummaryTemplate;

  // แถวรูปหลักฐานไม่ผูก option (null) — แยกแถวรูปด้วย photoUrl แทน
  @ManyToOne(() => SummaryTemplateOption, { nullable: true })
  @JoinColumn({ name: 'option_id' })
  option?: SummaryTemplateOption | null;

  @ManyToOne(() => InspectionSummaryItem, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'ref_item_id' })
  refItem?: InspectionSummaryItem | null;

  @RelationId((item: InspectionSummaryItem) => item.refItem)
  refItemId?: number | null;

  @Column({ type: 'text', nullable: true })
  detailValue!: string;

  // มีค่า = แถวนี้คือรูปหลักฐาน 1 รูป
  @Column({ type: 'text', nullable: true })
  photoUrl?: string | null;
}
