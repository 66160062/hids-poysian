import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { InspectionRound } from 'src/inspection-rounds/entities/inspection-round.entity';
import { User } from 'src/users/entities/user.entity';
import { DailyWorkItem } from './daily-work-item.entity';
import { DailyPersonnel } from './daily-personnel.entity';
import { DailyIssue } from './daily-issue.entity';
import { AccidentReport } from './accident-report.entity';
import { DailyMachine } from './daily-machine.entity';

@Entity('daily_report')
export class ConstructionDailyReport {
  @PrimaryGeneratedColumn()
  dailyReportId!: number;

  @Column({ type: 'varchar', length: 50 })
  reportDate!: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  contractorName!: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  reporterName!: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  position!: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  weather!: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  workingPeriod!: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  contractorSignatureUrl!: string;

  @Column({ type: 'timestamp', nullable: true })
  contractorSignedAt!: Date;

  @Column({ type: 'varchar', length: 100, nullable: true })
  inspectorSignatureUrl!: string;

  @Column({ type: 'timestamp', nullable: true })
  inspectorSignedAt!: Date;

  @CreateDateColumn()
  createdAt!: Date;

  @DeleteDateColumn()
  deletedAt!: Date;

  // --- ส่วนที่เพิ่มเข้ามาสำหรับการเก็บ PDF Report ---
  @Column({ type: 'varchar', length: 255, nullable: true })
  pdfUrl!: string; // เก็บ URL หรือ Path ของไฟล์ PDF

  @Column({ type: 'timestamp', nullable: true })
  generatedAt!: Date; // บันทึกเวลาที่ทำการ Generate PDF ล่าสุด
  // ----------------------------------------------

  @ManyToOne(() => InspectionRound)
  @JoinColumn({ name: 'round_id' })
  round!: InspectionRound;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'created_by' })
  createdBy!: User;

  @OneToMany(() => DailyWorkItem, (item) => item.dailyReport, { cascade: true })
  workItems!: DailyWorkItem[];

  @OneToMany(() => DailyPersonnel, (p) => p.dailyReport, { cascade: true })
  personnels!: DailyPersonnel[];

  @OneToMany(() => DailyIssue, (i) => i.dailyReport, { cascade: true })
  issues!: DailyIssue[];

  @OneToMany(() => AccidentReport, (a) => a.dailyReport, { cascade: true })
  accidents!: AccidentReport[];

  @OneToMany(() => DailyMachine, (m) => m.dailyReport, { cascade: true })
  machines!: DailyMachine[];
}
