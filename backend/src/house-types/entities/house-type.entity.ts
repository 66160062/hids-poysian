import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  DeleteDateColumn,
} from 'typeorm';

@Entity('house_type')
export class HouseType {
  @PrimaryGeneratedColumn()
  house_type_id: number;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @DeleteDateColumn()
  deleted_at: Date;
}
