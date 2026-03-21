import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class SubRoom {
  @PrimaryGeneratedColumn()
  subRoomId: number;

  @Column()
  room_name: string;
}
