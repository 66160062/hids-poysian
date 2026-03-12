import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class DefectsCategory {
  @PrimaryGeneratedColumn()
  category_id: number;

  @Column({ type: 'varchar', length: 255 })
  name: string;
}
