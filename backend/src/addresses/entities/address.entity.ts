import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  DeleteDateColumn,
} from 'typeorm';

@Entity('address')
export class Address {
  @PrimaryGeneratedColumn()
  addressId: number;

  @Column({ type: 'varchar', length: 10 })
  houseNumber: string;

  @Column({ type: 'varchar', length: 10 })
  floor: string;

  @Column({ type: 'varchar', length: 50 })
  soi: string;

  @Column({ type: 'varchar', length: 255 })
  subDistrict: string;

  @Column({ type: 'varchar', length: 255 })
  district: string;

  @Column({ type: 'varchar', length: 255 })
  province: string;

  @Column({ type: 'varchar', length: 50 })
  postalCode: string;

  @DeleteDateColumn()
  deletedAt: Date;
}
