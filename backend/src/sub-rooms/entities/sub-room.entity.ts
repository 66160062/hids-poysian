import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class SubRoom {
  @PrimaryGeneratedColumn()
  subRoomId!: number;

  @Column()
  roomName!: string;

  // ชื่อภาษาอังกฤษ (optional) — `roomName` ภาษาไทยยังเป็นค่าหลัก
  @Column({ type: 'varchar', length: 255, nullable: true })
  roomNameEn!: string | null;
}
