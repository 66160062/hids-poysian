import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity('branch')
export class Branch {
  @PrimaryGeneratedColumn()
  branchId!: number;

  @Column({ type: 'varchar', length: 255, nullable: true })
  branchName!: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  logoUrl!: string | null;

  @Column({ type: 'varchar', length: 50, default: 'active' })
  status!: string;

  @CreateDateColumn()
  createdAt!: Date;

  @DeleteDateColumn()
  deletedAt!: Date;
}
