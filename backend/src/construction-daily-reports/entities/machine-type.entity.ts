import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  DeleteDateColumn,
} from 'typeorm';

@Entity('machine_type')
export class MachineType {
  @PrimaryGeneratedColumn()
  machineTypeId!: number;

  @Column({ type: 'varchar', length: 100 })
  name!: string;

  @Column({ type: 'text', nullable: true })
  description!: string;

  @DeleteDateColumn()
  deletedAt!: Date;
}
