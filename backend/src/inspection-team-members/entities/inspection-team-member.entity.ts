import {
  Entity,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  DeleteDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { InspectionJob } from 'src/inspection-jobs/entities/inspection-job.entity';
import { User } from 'src/users/entities/user.entity';

@Entity('inspection_team_member')
export class InspectionTeamMember {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => InspectionJob)
  @JoinColumn({ name: 'job_id' })
  job: InspectionJob;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'inspector_id' })
  inspector: User;

  @CreateDateColumn({ name: 'assigned_at' })
  assignedAt: Date;

  @DeleteDateColumn({ name: 'deleted_at' })
  deletedAt: Date;
}
