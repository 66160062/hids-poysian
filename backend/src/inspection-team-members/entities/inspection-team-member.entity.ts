import {
  Entity,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  DeleteDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { InspectionRound } from 'src/inspection-rounds/entities/inspection-round.entity';
import { User } from 'src/users/entities/user.entity';
import { Team } from 'src/teams/entities/team.entity';

@Entity('inspection_team_member')
export class InspectionTeamMember {
  @PrimaryGeneratedColumn()
  id!: number;

  @ManyToOne(() => InspectionRound)
  @JoinColumn({ name: 'round_id' })
  round: InspectionRound;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'inspector_id' })
  inspector!: User | null;

  @ManyToOne(() => Team, { nullable: true })
  @JoinColumn({ name: 'team_id' })
  team!: Team | null;

  @CreateDateColumn({ name: 'assigned_at' })
  assignedAt!: Date;

  @DeleteDateColumn({ name: 'deleted_at' })
  deletedAt!: Date;
}
