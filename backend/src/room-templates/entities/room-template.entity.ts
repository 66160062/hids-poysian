import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class RoomTemplate {
  @PrimaryGeneratedColumn()
  templateId: number;

  @Column()
  roomName: string;

  @Column()
  floor: string;

  @Column({ length: 50 })
  roomType: string;
}
