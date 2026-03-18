import { DefectSubCategory } from 'src/defect-sub-categories/entities/defect-sub-category.entity';
import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';

@Entity('defect_category')
export class DefectCategory {
  @PrimaryGeneratedColumn()
  categoryId: number;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @OneToMany(() => DefectSubCategory, (sub) => sub.category)
  subCategories: DefectSubCategory[];
}
