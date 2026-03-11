import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  //   ManyToOne,
  //   JoinColumn,
} from 'typeorm';

@Entity()
export class InspectionJob {
  @PrimaryGeneratedColumn({ name: 'job_id' })
  jobId: number;

  @Column()
  customerId: number;

  @Column()
  addressId: number;

  @Column()
  houseTypeId: number;

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

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @DeleteDateColumn({ name: 'deleted_at' })
  deletedAt: Date;

  /*
  @ManyToOne(() => Customer)
  @JoinColumn({ name: 'customer_id' }) // ระบุคอลัมน์ FK ในตารางนี้
  customer: Customer;

  @ManyToOne(() => Address)
  @JoinColumn({ name: 'address_id' })
  address: Address;

  @ManyToOne(() => HouseType)
  @JoinColumn({ name: 'house_type_id' })
  houseType: HouseType;
  */
}
