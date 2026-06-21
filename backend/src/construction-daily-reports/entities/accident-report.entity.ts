import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  DeleteDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { ConstructionDailyReport } from './construction-daily-report.entity';

@Entity('accident_report')
export class AccidentReport {
  @PrimaryGeneratedColumn()
  accidentReportId!: number;

  @Column({ type: 'int', nullable: true })
  accidentCount!: number;

  @Column({ type: 'text', nullable: true })
  description!: string;

  @DeleteDateColumn()
  deletedAt!: Date;

  @ManyToOne(() => ConstructionDailyReport, (report) => report.accidents)
  @JoinColumn({ name: 'daily_report_id' })
  dailyReport!: ConstructionDailyReport;
}
