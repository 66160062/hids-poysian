import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  DeleteDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { ConstructionDailyReport } from './construction-daily-report.entity';

export enum PersonnelType {
  PERSONNEL = 'PERSONNEL',
  WORKER = 'WORKER',
}

@Entity('daily_personnel')
export class DailyPersonnel {
  @PrimaryGeneratedColumn()
  personnelId!: number;

  @Column({ type: 'varchar', length: 100, nullable: true })
  name!: string;

  @Column({
    type: 'varchar',
    length: 20,
    enum: PersonnelType,
    default: PersonnelType.PERSONNEL,
  })
  type!: PersonnelType;

  @Column({ type: 'int', nullable: true })
  count!: number;

  @Column({ type: 'real', nullable: true })
  hours!: number;

  @DeleteDateColumn()
  deletedAt!: Date;

  @ManyToOne(() => ConstructionDailyReport, (report) => report.personnels)
  @JoinColumn({ name: 'daily_report_id' })
  dailyReport!: ConstructionDailyReport;
}
