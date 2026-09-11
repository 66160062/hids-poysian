import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { InspectionJob } from 'src/inspection-jobs/entities/inspection-job.entity';
import { Floor } from 'src/floor/entities/floor.entity';

@Entity('job_plans')
export class JobPlan {
  @PrimaryGeneratedColumn()
  planId!: number;

  @Column({ type: 'varchar', length: 255 })
  name!: string;

  @Column({ type: 'varchar', length: 255 })
  imageUrl!: string;

  @Column({ type: 'int', default: 0 })
  orderIndex!: number;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  @ManyToOne(() => InspectionJob, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'job_id' })
  job!: InspectionJob;

  @ManyToOne(() => Floor, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'floor_id' })
  floor!: Floor | null;
}
