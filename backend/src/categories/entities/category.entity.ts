import { Entity, Column, PrimaryGeneratedColumn, OneToMany } from 'typeorm';
import { Room } from '../../rooms/entities/room.entity';

@Entity()
export class Category {

    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    name: string;

    @OneToMany(() => Room, (room) => room.category)
    rooms: Room[];

}