import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  DeleteDateColumn,
} from 'typeorm';

@Entity('address')
export class Address {
  @PrimaryGeneratedColumn()
  address_id: number;

  @Column({ type: 'varchar', length: 10 })
  house_number: string;

  @Column({ type: 'varchar', length: 10 })
  floor: string;

  @Column({ type: 'varchar', length: 10 })
  soi: string;

  @Column({ type: 'varchar', length: 255 })
  sub_district: string;

  @Column({ type: 'varchar', length: 255 })
  district: string;

  @Column({ type: 'varchar', length: 255 })
  province: string;

  @Column({ type: 'varchar', length: 50 })
  postal_code: string;

  @Column({ type: 'real' })
  usable_area: number;

  @DeleteDateColumn()
  deleted_at: Date;
}
