import { Team } from 'src/teams/entities/team.entity';
import { Branch } from 'src/branches/entities/branch.entity';
import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  DeleteDateColumn,
  Index,
} from 'typeorm';
@Entity()
export class User {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  fullName!: string;

  @Column()
  phoneNumber!: string;

  @Column()
  email!: string;

  @Column({ nullable: true, default: '' })
  lineId!: string;

  // ไม่ดึง hash มาโดยอัตโนมัติ (เดิมหลุดไปใน response ของ defect ทุกตัว) ตอน login ใช้ findByEmailWithPassword
  @Column({ select: false })
  password!: string;

  @Column()
  role!: string;

  @Column({
    type: 'varchar',
    length: 255,
    default: '/project-images/unknown.jpg',
  })
  imageUrl!: string;

  @CreateDateColumn()
  createdAt!: Date;

  @DeleteDateColumn()
  deletedAt!: Date;

  @Column({ name: 'branch_id', nullable: true })
  branchId!: number | null;

  @ManyToOne(() => Branch, { nullable: true })
  @JoinColumn({ name: 'branch_id' })
  branch!: Branch | null;

  @Column({ name: 'team_id', nullable: true })
  teamId!: number | null;

  @Index()
  @ManyToOne(() => Team, { nullable: true })
  @JoinColumn({ name: 'team_id' })
  team!: Team | null;
}
