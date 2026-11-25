import {
  Entity,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  DeleteDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { InspectionJob } from 'src/inspection-jobs/entities/inspection-job.entity';
import { User } from 'src/users/entities/user.entity';
import { InspectionRound } from 'src/inspection-rounds/entities/inspection-round.entity';

@Entity('assignment')
export class Assignment {
  @PrimaryGeneratedColumn()
  id!: number;

  @Index()
  @ManyToOne(() => InspectionJob)
  @JoinColumn({ name: 'job_id' })
  job!: InspectionJob;

  @Index()
  @ManyToOne(() => User)
  @JoinColumn({ name: 'inspector_id' })
  inspector!: User;

  // null = มอบหมายทั้ง job (เข้าถึงได้ทุกรอบ), ไม่ null = มอบหมายเฉพาะรอบนี้เท่านั้น
  @Index()
  @ManyToOne(() => InspectionRound, { nullable: true })
  @JoinColumn({ name: 'round_id' })
  round!: InspectionRound | null;

  @CreateDateColumn({ name: 'assigned_at' })
  assignedAt!: Date;

  @DeleteDateColumn({ name: 'deleted_at' })
  deletedAt!: Date;
}
