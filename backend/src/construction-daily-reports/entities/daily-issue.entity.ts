import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  DeleteDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { ConstructionDailyReport } from './construction-daily-report.entity';

@Entity('daily_issue')
export class DailyIssue {
  @PrimaryGeneratedColumn()
  issueId!: number;

  @Column({ type: 'text', nullable: true })
  description!: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  note!: string;

  @DeleteDateColumn()
  deletedAt!: Date;

  @ManyToOne(() => ConstructionDailyReport, (report) => report.issues)
  @JoinColumn({ name: 'daily_report_id' })
  dailyReport!: ConstructionDailyReport;
}
