import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  ManyToOne,
  JoinColumn,
  OneToMany,
} from 'typeorm';
import { InspectionJob } from 'src/inspection-jobs/entities/inspection-job.entity';
import { InspectionTeamMember } from 'src/inspection-team-members/entities/inspection-team-member.entity';

@Entity('inspection_round')
export class InspectionRound {
  @PrimaryGeneratedColumn()
  roundId!: number;

  @Column()
  roundNumber!: number;

  @Column({ type: 'timestamp', nullable: true })
  scheduledDate!: Date;

  @Column({ type: 'varchar', length: 50, default: 'SCHEDULED' })
  status!: string;

  @Column({ name: 'inspected_at', type: 'timestamp', nullable: true })
  inspectedAt!: Date;

  @Column({ name: 'summary_completed_at', type: 'timestamp', nullable: true })
  summaryCompletedAt!: Date;

  @Column({ type: 'timestamp', nullable: true })
  submittedAt!: Date;

  @Column({ type: 'varchar', length: 255, nullable: true })
  signatureImageUrl!: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  customerToken!: string;

  @Column({ type: 'timestamp', nullable: true })
  customerTokenExpiredAt!: Date;

  @Column({ type: 'varchar', length: 255, nullable: true })
  contractorToken!: string;

  @Column({ type: 'timestamp', nullable: true })
  contractorTokenExpiredAt!: Date;

  @Column({ type: 'timestamp', nullable: true })
  approvedAt!: Date;

  @Column({ type: 'varchar', length: 64, nullable: true })
  lastPdfHash!: string | null;

  @Column({ type: 'varchar', length: 500, nullable: true })
  lastPdfUrl!: string | null;

  // เวลาที่ PDF ไฟล์ปัจจุบัน (lastPdfUrl) ถูก render จริง — โชว์ในตัว PDF/หน้าดาวน์โหลด
  // เพื่อให้ผู้ใช้เช็คได้ว่าไฟล์ที่กำลังดู/ดาวน์โหลดเป็นข้อมูล ณ เวลาไหน (PDF อาจ regenerate ช้ากว่าการแก้ defect ล่าสุดได้)
  @Column({ name: 'last_pdf_generated_at', type: 'timestamp', nullable: true })
  lastPdfGeneratedAt!: Date | null;

  // cache ภาษาอังกฤษแยกจากไทย (lastPdfHash/lastPdfUrl/lastPdfGeneratedAt ด้านบน) — render แบบ lazy
  // ตอนมีคนขอ PDF อังกฤษจริงๆ เท่านั้น ไม่ได้ regenerate พร้อมกันทุกครั้งที่ scheduleRegeneration ทำงาน
  // (ดู ReportsService) เพื่อไม่ให้ debounce ตอนแก้ defect ต้อง render ซ้ำสองภาษาทุกครั้ง
  @Column({
    name: 'last_pdf_hash_en',
    type: 'varchar',
    length: 64,
    nullable: true,
  })
  lastPdfHashEn!: string | null;

  @Column({
    name: 'last_pdf_url_en',
    type: 'varchar',
    length: 500,
    nullable: true,
  })
  lastPdfUrlEn!: string | null;

  @Column({
    name: 'last_pdf_generated_at_en',
    type: 'timestamp',
    nullable: true,
  })
  lastPdfGeneratedAtEn!: Date | null;

  // ตั้งเวลาไว้กันแจ้งเตือนซ้ำ — ยิงแค่ครั้งแรกที่ยอดซ่อมข้าม threshold (ดู REPAIR_ALERT_THRESHOLD ใน defects.service.ts)
  @Column({ name: 'repair_alert_sent_at', type: 'timestamp', nullable: true })
  repairAlertSentAt!: Date | null;

  // % ความสมบูรณ์ คำนวณด้วยสูตรตายตัวใน completion-score.util.ts (ไม่ใช่ตัวเลขที่ AI คิดเอง)
  @Column({ name: 'completion_percent', type: 'int', nullable: true })
  completionPercent!: number | null;

  // คะแนนย่อยสองส่วนที่ประกอบเป็น completionPercent — เก็บไว้โชว์ที่มาของคะแนนในรายงาน
  @Column({ name: 'completion_defect_score', type: 'int', nullable: true })
  completionDefectScore!: number | null;

  // null เมื่อรอบนั้นยังไม่ได้กรอกผลตรวจระบบท้ายเล่ม (คะแนนรวมจะมาจาก defect ล้วน)
  @Column({ name: 'completion_system_score', type: 'int', nullable: true })
  completionSystemScore!: number | null;

  @Column({ name: 'ai_summary_text', type: 'text', nullable: true })
  aiSummaryText!: string | null;

  // ชื่อโมเดลที่ใช้สร้างสรุปล่าสุด เช่น 'claude', 'gemini', 'groq', 'ollama'
  @Column({
    name: 'ai_summary_provider',
    type: 'varchar',
    length: 50,
    nullable: true,
  })
  aiSummaryProvider!: string | null;

  // hash ชุดข้อมูล defect ตอนที่สร้างสรุปล่าสุด ใช้เทียบเพื่อข้ามการเรียก LLM ซ้ำถ้าข้อมูลไม่เปลี่ยน
  @Column({
    name: 'ai_summary_data_hash',
    type: 'varchar',
    length: 64,
    nullable: true,
  })
  aiSummaryDataHash!: string | null;

  @Column({
    name: 'ai_summary_generated_at',
    type: 'timestamp',
    nullable: true,
  })
  aiSummaryGeneratedAt!: Date | null;

  @CreateDateColumn()
  createdAt!: Date;

  @DeleteDateColumn()
  deletedAt!: Date;

  @ManyToOne(() => InspectionJob)
  @JoinColumn({ name: 'job_id' })
  job!: InspectionJob;

  @OneToMany(() => InspectionTeamMember, (teamMember) => teamMember.round)
  teamMembers!: InspectionTeamMember[];
}
