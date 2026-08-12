import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { InspectionJob } from 'src/inspection-jobs/entities/inspection-job.entity';
import { InspectionRound } from 'src/inspection-rounds/entities/inspection-round.entity';

export enum ActivityLogType {
  ROUND_SCHEDULED = 'round_scheduled',
  ROUND_INSPECTED = 'round_inspected',
  ROUND_SUBMITTED = 'round_submitted',
  ROUND_APPROVED = 'round_approved',
  DEFECT_CREATED = 'defect_created',
  DEFECT_REPAIRED = 'defect_repaired',
  REPORT_PDF_UPDATED = 'report_pdf_updated',
}

// สีที่ใช้แสดงจุด (dot) หน้ารายการในหน้า "อัพเดตล่าสุด" ของลูกค้า
export type ActivityLogColor = 'green' | 'orange' | 'blue' | 'purple';

@Entity('activity_log')
export class ActivityLog {
  @PrimaryGeneratedColumn()
  activityId!: number;

  @Column({ type: 'varchar', length: 50 })
  type!: ActivityLogType;

  @Column({ type: 'varchar', length: 20 })
  color!: ActivityLogColor;

  @Column({ type: 'varchar', length: 255 })
  title!: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  sub!: string | null;

  @CreateDateColumn()
  createdAt!: Date;

  @ManyToOne(() => InspectionJob, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'job_id' })
  job!: InspectionJob;

  @ManyToOne(() => InspectionRound, { nullable: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'round_id' })
  round!: InspectionRound | null;
}
