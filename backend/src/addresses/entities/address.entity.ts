import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  DeleteDateColumn,
} from 'typeorm';

@Entity('address')
export class Address {
  @PrimaryGeneratedColumn()
  addressId!: number;

  @Column({ type: 'varchar', length: 50, nullable: true })
  houseNumber!: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  floor!: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  soi!: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  subDistrict!: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  district!: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  province!: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  postalCode!: string;

  @DeleteDateColumn()
  deletedAt!: Date;
}
