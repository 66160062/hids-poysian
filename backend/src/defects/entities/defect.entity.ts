import { DefectSubCategory } from 'src/defect-sub-categories/entities/defect-sub-category.entity';
import { InspectionRound } from 'src/inspection-rounds/entities/inspection-round.entity';
import { User } from 'src/users/entities/user.entity';
import {
  Column,
  Entity,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';

@Entity()
export class Defect {
  @PrimaryGeneratedColumn()
  defectId: number;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'varchar', length: 50 })
  severity: string;

  @Column({
    type: 'varchar',
    length: 255,
    default: '/defect-images/unknown.jpg',
  })
  imageUrl: string;

  @Column({ type: 'int', nullable: true })
  imageFileSize: number;

  @Column({ type: 'varchar', length: 50, default: 'OPEN' })
  status: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @ManyToOne(() => InspectionRound)
  @JoinColumn({ name: 'round_id' })
  round: InspectionRound;

  // @ManyToOne(() => RoomTemplate)
  // @JoinColumn({ name: 'template_id' })
  // template: RoomTemplate;

  @ManyToOne(() => DefectSubCategory)
  @JoinColumn({ name: 'sub_category_id' })
  subCategory: DefectSubCategory;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'inspector_id' })
  inspector: User;
}
