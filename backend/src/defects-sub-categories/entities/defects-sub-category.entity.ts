import {
  Column,
  Entity,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
@Entity()
export class DefectsSubCategory {
  @PrimaryGeneratedColumn()
  subCategoryId: number;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @ManyToOne(() => DefectCategory)
  @JoinColumn({ name: 'category_id' })
  category: DefectCategory;
}
