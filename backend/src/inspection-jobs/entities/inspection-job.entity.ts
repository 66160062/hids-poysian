import { Address } from 'src/addresses/entities/address.entity';
import { Customer } from 'src/customers/entities/customer.entity';
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';

@Entity()
export class InspectionJob {
  @PrimaryGeneratedColumn({ name: 'job_id' })
  jobId: number;

  @Column({ type: 'varchar', length: 50 })
  inspectionType: string;

  @Column({
    type: 'varchar',
    length: 255,
  })
  projectName: string;

  @Column({
    name: 'location_coordinate',
    type: 'varchar',
    length: 255,
  })
  locationCoordinate: string;

  @Column({
    name: 'house_plan_url',
    type: 'varchar',
    length: 255,
  })
  housePlanUrl: string;

  @Column({ type: 'real' })
  usableArea: number;

  @Column({
    type: 'varchar',
    length: 255,
    default: '/project-images/unknown.jpg',
  })
  projectImageUrl: string;

  @Column({ type: 'varchar', length: 50, default: 'draft' })
  status: string;

  @CreateDateColumn()
  createdAt: Date;

  @DeleteDateColumn()
  deletedAt: Date;

  @ManyToOne(() => Customer)
  @JoinColumn({ name: 'customer_id' })
  customer: Customer;

  @ManyToOne(() => Address)
  @JoinColumn({ name: 'address_id' })
  address: Address;

  /*
  @ManyToOne(() => HouseType)
  @JoinColumn({ name: 'house_type_id' })
  houseType: HouseType;
  */
}
