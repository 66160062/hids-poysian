import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  DeleteDateColumn,
} from 'typeorm';
import { ConstructionDailyReport } from './construction-daily-report.entity';

@Entity('daily_report_image')
export class DailyReportImage {
  @PrimaryGeneratedColumn()
  imageId!: number;

  @Column({ type: 'int', nullable: true })
  sequence!: number;

  @Column({ type: 'varchar', length: 100, nullable: true })
  imageType!: string; // 'PANORAMA' or 'WORK_DETAIL'

  @Column({ type: 'varchar', length: 255, nullable: true })
  imageUrl!: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  caption!: string; // workDetailName for mapping

  @CreateDateColumn()
  createdAt!: Date;

  @DeleteDateColumn()
  deletedAt!: Date;

  @ManyToOne(() => ConstructionDailyReport, (report) => report.images, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'daily_report_id' })
  dailyReport!: ConstructionDailyReport;
}
