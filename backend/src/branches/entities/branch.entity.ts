import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Team } from 'src/teams/entities/team.entity';

@Entity('branch')
export class Branch {
  @PrimaryGeneratedColumn()
  branchId!: number;

  @Column({ type: 'varchar', length: 255, nullable: true })
  branchName!: string | null;

  @Column({ type: 'varchar', length: 10, nullable: true })
  phoneNumber!: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  mailAddress!: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  facebook!: string | null;

  @Column({ type: 'varchar', length: 30, nullable: true })
  line!: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  logoUrl!: string | null;

  @Column({ type: 'varchar', length: 50, default: 'active' })
  status!: string;

  @CreateDateColumn()
  createdAt!: Date;

  @DeleteDateColumn()
  deletedAt!: Date | null;

  @OneToMany(() => Team, (team) => team.branch)
  teams!: Team[];
}
