import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class Room {
  @PrimaryGeneratedColumn()
  roomId!: number;

  @Column({ type: 'varchar', length: 255 })
  roomName!: string;
}
