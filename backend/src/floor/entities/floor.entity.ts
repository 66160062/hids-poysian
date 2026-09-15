import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class Floor {
  @PrimaryGeneratedColumn()
  floorId!: number;
  @Column()
  label!: string;

  // ชื่อภาษาอังกฤษ (optional) — ตารางนี้เป็น lookup ปิดตายตัว (ไม่กี่แถว) ไม่มี admin UI แก้ชื่อ
  @Column({ type: 'varchar', length: 255, nullable: true })
  labelEn!: string | null;

  @Column({ name: 'floor_order', type: 'int', nullable: true })
  floorOrder?: number;
}
