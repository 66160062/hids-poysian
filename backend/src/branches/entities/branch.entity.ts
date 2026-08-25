import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Team } from 'src/teams/entities/team.entity';

@Entity('branch')
export class Branch {
  @PrimaryGeneratedColumn()
  branchId!: number;

  @Column({ type: 'varchar', length: 255, nullable: true })
  branchName!: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  logoUrl!: string | null;

  @Column({ name: 'team_id', type: 'int', nullable: true, unique: true })
  teamId!: number | null;

  @ManyToOne(() => Team, { nullable: true })
  @JoinColumn({ name: 'team_id' })
  team!: Team | null;

  @Column({ type: 'varchar', length: 50, default: 'active' })
  status!: string;

  @CreateDateColumn()
  createdAt!: Date;

  @DeleteDateColumn()
  deletedAt!: Date;
}
