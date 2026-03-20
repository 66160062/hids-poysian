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
  teamId: number;

  @Column({ type: 'varchar', length: 255 })
  teamName: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  logoUrl: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  contactInfo: string;

  @Column({ type: 'varchar', length: 50, default: 'active' })
  status: string;

  @CreateDateColumn()
  createdAt: Date;

  @DeleteDateColumn()
  deletedAt: Date;
}
