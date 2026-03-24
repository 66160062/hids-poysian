import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { InspectionJob } from 'src/inspection-jobs/entities/inspection-job.entity';
import { InspectionTeamMember } from 'src/inspection-team-members/entities/inspection-team-member.entity';

@Entity('inspection_round')
export class InspectionRound {
  @PrimaryGeneratedColumn()
  roundId: number;

  @Column()
  roundNumber: number;

  @Column({ type: 'datetime', nullable: true })
  scheduledDate: Date;

  @Column({ type: 'varchar', length: 50, default: 'SCHEDULED' })
  status: string;

  @Column({ name: 'inspected_at', type: 'datetime', nullable: true })
  inspectedAt: Date;

  @Column({ name: 'summary_completed_at', type: 'datetime', nullable: true })
  summaryCompletedAt: Date;

  @Column({ type: 'datetime', nullable: true })
  submittedAt: Date;

  @Column({ type: 'varchar', length: 255, nullable: true })
  signatureImageUrl: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  customerToken: string;

  @Column({ type: 'datetime', nullable: true })
  customerTokenExpiredAt: Date;

  @Column({ type: 'varchar', length: 255, nullable: true })
  contractorToken: string;

  @Column({ type: 'datetime', nullable: true })
  contractorTokenExpiredAt: Date;

  @Column({ type: 'datetime', nullable: true })
  approvedAt: Date;

  @CreateDateColumn()
  createdAt: Date;

  @DeleteDateColumn()
  deletedAt: Date;

  @ManyToOne(() => InspectionJob)
  @JoinColumn({ name: 'job_id' })
  job: InspectionJob;

  @ManyToOne(() => InspectionTeamMember)
  @JoinColumn({ name: 'team_member_id' })
  teamMember: InspectionTeamMember;
}
