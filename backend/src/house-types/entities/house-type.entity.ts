import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  DeleteDateColumn,
} from 'typeorm';

@Entity('house_type')
export class HouseType {
  @PrimaryGeneratedColumn()
  house_type_id!: number;

  @Column({ type: 'varchar', length: 255 })
  name!: string;

  // ชื่อภาษาอังกฤษ (optional) — ตารางนี้เป็น lookup ปิดตายตัว (ไม่กี่แถว) ไม่มี admin UI แก้ชื่อ
  @Column({ type: 'varchar', length: 255, nullable: true })
  nameEn!: string | null;

  @DeleteDateColumn()
  deleted_at!: Date;
}
