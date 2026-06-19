import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  DeleteDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { ConstructionDailyReport } from './construction-daily-report.entity';

@Entity('daily_work_item')
export class DailyWorkItem {
  @PrimaryGeneratedColumn()
  workItemId!: number;

  @Column({ type: 'int', nullable: true })
  sequence!: number;

  @Column({ type: 'varchar', length: 100, nullable: true })
  location!: string;

  @Column({ type: 'text', nullable: true })
  description!: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  unit!: string;

  @Column({ type: 'real', nullable: true })
  plannedPercent!: number;

  @Column({ type: 'real', nullable: true })
  actualPercent!: number;

  @Column({ type: 'real', nullable: true })
  remainingPercent!: number;

  @Column({ type: 'text', nullable: true })
  note!: string;

  @DeleteDateColumn()
  deletedAt!: Date;

  @ManyToOne(() => ConstructionDailyReport, (report) => report.workItems)
  @JoinColumn({ name: 'daily_report_id' })
  dailyReport!: ConstructionDailyReport;
}
