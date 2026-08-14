import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { InspectionJob } from 'src/inspection-jobs/entities/inspection-job.entity';

@Entity('ratings')
export class Rating {
  @PrimaryGeneratedColumn()
  ratingId!: number;

  @Column({ type: 'int' })
  score!: number;

  @Column({ type: 'text', nullable: true })
  comment!: string | null;

  @Index({ unique: true })
  @Column({ type: 'varchar', length: 64, nullable: true })
  tokenHash!: string | null;

  @CreateDateColumn()
  createdAt!: Date;

  @ManyToOne(() => InspectionJob, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'job_id' })
  job!: InspectionJob;
}
