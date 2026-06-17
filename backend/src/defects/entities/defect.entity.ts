import { DefectSubCategory } from 'src/defect-sub-categories/entities/defect-sub-category.entity';
import { InspectionRound } from 'src/inspection-rounds/entities/inspection-round.entity';
import { RoomTemplate } from 'src/room-templates/entities/room-template.entity';
import { User } from 'src/users/entities/user.entity';
import { Contractor } from 'src/contractor/entities/contractor.entity';
import {
  Column,
  Entity,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  ManyToMany,
  JoinTable,
} from 'typeorm';
export enum DefectStatus {
  PENDING_REPAIR = 'PENDING_REPAIR',
  FIXED = 'Fixed',
  REJECTED = 'REJECTED',
  PASS = 'PASS',
}

@Entity()
export class Defect {
  @PrimaryGeneratedColumn()
  defectId!: number;

  @Column({ type: 'text', nullable: true, default: '-' })
  description!: string;

  @Column({ type: 'varchar', length: 50 })
  severity!: string;

  @Column({
    type: 'varchar',
    length: 255,
    default: '/defect-images/unknown.jpg',
  })
  imageUrl!: string;

  @Column({ type: 'int', nullable: true })
  imageFileSize!: number;

  @Column({ type: 'varchar', length: 255, nullable: true })
  contractorImageUrl!: string;

  @Column({ type: 'int', nullable: true })
  contractorImageFileSize!: number;

  @Column({ type: 'text', nullable: true })
  contractorNote!: string;

  @Column({
    type: 'varchar',
    length: 50,
    default: DefectStatus.PENDING_REPAIR,
    enum: DefectStatus,
  })
  status!: DefectStatus;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  @ManyToOne(() => InspectionRound)
  @JoinColumn({ name: 'round_id' })
  round!: InspectionRound;

  @ManyToOne(() => RoomTemplate)
  @JoinColumn({ name: 'template_id' })
  template!: RoomTemplate;

  @ManyToMany(() => DefectSubCategory)
  @JoinTable({ name: 'defect_sub_category_map' })
  subCategories!: DefectSubCategory[];

  @ManyToOne(() => User)
  @JoinColumn({ name: 'inspector_id' })
  inspector!: User;

  @ManyToOne(() => Contractor, { nullable: true })
  @JoinColumn({ name: 'updated_by' })
  updatedBy!: Contractor;
}
