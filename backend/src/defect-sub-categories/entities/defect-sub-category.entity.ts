import { DefectCategory } from 'src/defect-categories/entities/defect-category.entity';
import {
  Column,
  Entity,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
@Entity('defect_sub_category')
export class DefectSubCategory {
  @PrimaryGeneratedColumn()
  subCategoryId: number;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @ManyToOne(() => DefectCategory, (category) => category.subCategories)
  @JoinColumn({ name: 'category_id' })
  category: DefectCategory;
}
