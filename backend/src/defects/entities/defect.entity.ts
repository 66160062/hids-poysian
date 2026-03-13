import { DefectsSubCategory } from 'src/defects-sub-categories/entities/defects-sub-category.entity';
import {
  Column,
  Entity,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';

@Entity()
export class Defect {
  @PrimaryGeneratedColumn()
  defect_id: number;

  @Column({ type: 'text' })
  description: string;

  @Column({ type: 'varchar', length: 50 })
  severity: string;

  @Column({
    type: 'varchar',
    length: 255,
    default: '/defect-images/unknown.jpg',
  })
  image_url: string;

  @Column()
  image_file_size: number;

  @Column({ type: 'varchar', length: 50, default: 'ไม่ผ่าน' })
  status: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @DeleteDateColumn()
  deleted_at: Date;

  @ManyToOne(() => DefectsSubCategory)
  @JoinColumn({ name: 'sub_category_id' })
  subCategory: DefectsSubCategory;
}
