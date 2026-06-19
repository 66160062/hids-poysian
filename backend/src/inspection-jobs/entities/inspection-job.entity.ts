import { Address } from 'src/addresses/entities/address.entity';
import { Customer } from 'src/customers/entities/customer.entity';
import { HouseType } from 'src/house-types/entities/house-type.entity';
import { Contractor } from 'src/contractor/entities/contractor.entity';
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  ManyToOne,
  JoinColumn,
  OneToMany,
} from 'typeorm';
import { InspectionRound } from 'src/inspection-rounds/entities/inspection-round.entity';

@Entity()
export class InspectionJob {
  @PrimaryGeneratedColumn()
  jobId!: number;

  @Column({ type: 'varchar', length: 50 })
  inspectionType!: string;

  @Column({
    type: 'varchar',
    length: 255,
  })
  projectName!: string;

  @Column({
    type: 'varchar',
    length: 255,
  })
  locationCoordinate!: string;

  @Column({
    type: 'varchar',
    length: 255,
    nullable: true,
    default: '',
  })
  housePlanUrl!: string;

  @Column({ type: 'real' })
  usableArea!: number;

  @Column({
    type: 'varchar',
    length: 255,
    default: '/project-images/unknown.jpg',
  })
  projectImageUrl!: string;

  @Column({ type: 'varchar', length: 50, default: 'Active' })
  status!: string;

  @CreateDateColumn()
  createdAt!: Date;

  @DeleteDateColumn()
  deletedAt!: Date;

  @ManyToOne(() => Customer)
  @JoinColumn({ name: 'customer_id' })
  customer!: Customer;

  @ManyToOne(() => Address)
  @JoinColumn({ name: 'address_id' })
  address!: Address;

  @ManyToOne(() => HouseType)
  @JoinColumn({ name: 'house_type_id' })
  houseType!: HouseType;

  @ManyToOne(() => Contractor, { nullable: true })
  @JoinColumn({ name: 'contractor_id' })
  contractor!: Contractor;

  @OneToMany(() => InspectionRound, (round) => round.job)
  rounds!: InspectionRound[];
}
