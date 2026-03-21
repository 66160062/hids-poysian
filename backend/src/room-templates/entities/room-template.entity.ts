import { Floor } from 'src/floor/entities/floor.entity';
import { SubRoom } from 'src/sub-rooms/entities/sub-room.entity';
import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity()
export class RoomTemplate {
  @PrimaryGeneratedColumn()
  templateId: number;

  @Column()
  roomName: string;

  @Column({ length: 50 })
  roomType: string;

  @ManyToOne(() => Floor)
  @JoinColumn({ name: 'floor_id' })
  floor: Floor;

  @ManyToOne(() => SubRoom)
  @JoinColumn({ name: 'sub_room_id' })
  subRoom: SubRoom;
}
