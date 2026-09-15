import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  DeleteDateColumn,
} from 'typeorm';

@Entity('customer')
export class Customer {
  @PrimaryGeneratedColumn()
  customerId!: number;

  @Column({ type: 'varchar', length: 255 })
  fullName!: string;

  @Column({ type: 'varchar', length: 255 })
  phoneNumber!: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  phoneNumber2?: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  phoneNumber3?: string;

  @Column({ type: 'varchar', length: 255 })
  email!: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  email2?: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  email3?: string;

  @Column({ type: 'varchar', length: 255 })
  lineId!: string;

  // ภาษาที่ลูกค้าอยากได้รับเอกสาร (อีเมลอนุมัติ/PDF แนบ) — แอดมินตั้งให้เท่านั้น ไม่ได้ sync
  // จากปุ่มสลับภาษาบนหน้าลูกค้าเอง (กันกดพลาดแล้วเปลี่ยนถาวรโดยไม่ตั้งใจ)
  @Column({ type: 'varchar', length: 10, default: 'th-TH' })
  preferredLocale!: string;

  @CreateDateColumn()
  createdAt!: Date;

  @DeleteDateColumn()
  deletedAt!: Date;
}
