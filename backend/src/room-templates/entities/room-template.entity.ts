import { Floor } from 'src/floor/entities/floor.entity';
import { Room } from 'src/rooms/entities/room.entity';
import { SubRoom } from 'src/sub-rooms/entities/sub-room.entity';
import { Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class RoomTemplate {
  @PrimaryGeneratedColumn()
  templateId: number;

  @ManyToOne(() => Room, { nullable: true })
  @JoinColumn({ name: 'room_id' })
  room: Room;

  @ManyToOne(() => SubRoom, { nullable: true })
  @JoinColumn({ name: 'sub_room_id' })
  subRoom: SubRoom | null;

  @ManyToOne(() => Floor)
  @JoinColumn({ name: 'floor_id' })
  floor: Floor;
}
