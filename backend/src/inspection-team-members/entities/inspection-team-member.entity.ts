import {
  Entity,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  DeleteDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { InspectionJob } from 'src/inspection-jobs/entities/inspection-job.entity';
import { Inspector } from 'src/inspectors/entities/inspector.entity';

@Entity('inspection_team_member')
export class InspectionTeamMember {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => InspectionJob)
  @JoinColumn({ name: 'job_id' })
  job: InspectionJob;

  @ManyToOne(() => Inspector)
  @JoinColumn({ name: 'inspector_id' })
  inspector: Inspector;

  @CreateDateColumn({ name: 'assigned_at' })
  assignedAt: Date;

  @DeleteDateColumn({ name: 'deleted_at' })
  deletedAt: Date;
}
