import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class Room {
  @PrimaryGeneratedColumn()
  roomId!: number;

  @Column({ type: 'varchar', length: 255 })
  roomName!: string;

  // ชื่อภาษาอังกฤษ (optional) — `roomName` ภาษาไทยยังเป็นค่าหลัก
  @Column({ type: 'varchar', length: 255, nullable: true })
  roomNameEn!: string | null;
}
