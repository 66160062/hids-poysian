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
import { User } from 'src/users/entities/user.entity';

export enum NotificationType {
  ALERT = 'alert',
  INFO = 'info',
}

@Entity('notification')
export class Notification {
  @PrimaryGeneratedColumn()
  notificationId!: number;

  @Column({ type: 'varchar', length: 20, default: NotificationType.INFO })
  type!: NotificationType;

  @Column({ type: 'varchar', length: 500 })
  message!: string;

  @Column({ type: 'boolean', default: false })
  isRead!: boolean;

  // ผู้รับแบบ role กว้างๆ (เช่น 'admin') สำหรับแจ้งเตือนที่ admin ทุกคนควรเห็น
  @Column({ type: 'varchar', length: 20, nullable: true })
  recipientRole!: string | null;

  @ManyToOne(() => User, { nullable: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'recipient_user_id' })
  recipientUser!: User | null;

  @ManyToOne(() => InspectionJob, { nullable: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'job_id' })
  job!: InspectionJob | null;

  @ManyToOne(() => InspectionRound, { nullable: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'round_id' })
  round!: InspectionRound | null;

  @CreateDateColumn()
  createdAt!: Date;
}
