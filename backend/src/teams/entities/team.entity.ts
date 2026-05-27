import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  DeleteDateColumn,
} from 'typeorm';

@Entity('team')
export class Team {
  @PrimaryGeneratedColumn()
  team_Id: number;

  @Column({ type: 'varchar', length: 255 })
  team_name: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  logo_url: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  contact_info: string;

  @Column({ type: 'varchar', length: 50, default: 'active' })
  status: string;

  @CreateDateColumn()
  created_at: Date;

  @DeleteDateColumn()
  deleted_at: Date;
}
