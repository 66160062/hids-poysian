import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { InspectionJob } from 'src/inspection-jobs/entities/inspection-job.entity';
import { Floor } from 'src/floor/entities/floor.entity';

@Entity('house_plans')
export class HousePlan {
  @PrimaryGeneratedColumn()
  planId!: number;

  @Column({ type: 'varchar', length: 255 })
  name!: string;

  // ชื่อภาษาอังกฤษ (optional) — เติมคู่กับ name เฉพาะตอนสร้างชื่อ default อัตโนมัติ (ดู
  // Frontend useDefaultPlanName.ts) ชื่อที่ผู้ใช้พิมพ์เองจะไม่มีคำแปลอัตโนมัติ ต้องกรอกเพิ่มเอง
  @Column({ type: 'varchar', length: 255, nullable: true })
  nameEn!: string | null;

  @Column({ type: 'varchar', length: 255 })
  imageUrl!: string;

  @Column({ type: 'int', default: 0 })
  orderIndex!: number;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  @ManyToOne(() => InspectionJob, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'job_id' })
  job!: InspectionJob;

  @ManyToOne(() => Floor, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'floor_id' })
  floor!: Floor | null;
}
