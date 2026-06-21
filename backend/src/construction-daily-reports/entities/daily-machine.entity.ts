import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { ConstructionDailyReport } from './construction-daily-report.entity';
import { MachineType } from './machine-type.entity';

@Entity('daily_machine')
export class DailyMachine {
  @PrimaryGeneratedColumn()
  dailyMachineId!: number;

  @Column({ type: 'varchar', length: 50, nullable: true })
  machineSize!: string;

  @Column({ type: 'int', default: 1 })
  quantity!: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  workingHours!: number;

  @ManyToOne(() => ConstructionDailyReport, (report) => report.machines)
  @JoinColumn({ name: 'daily_report_id' })
  dailyReport!: ConstructionDailyReport;

  @ManyToOne(() => MachineType, { nullable: true })
  @JoinColumn({ name: 'machine_type_id' })
  machineType!: MachineType;
}
