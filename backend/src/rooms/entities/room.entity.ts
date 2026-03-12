import { Entity, Column, PrimaryGeneratedColumn, ManyToOne } from 'typeorm';
import { Category } from '../../categories/entities/category.entity';

@Entity()
export class Room {

    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    roomNumber: string;

    @Column()
    roomType: string;

    @Column()
    floor: number;

    @Column({ default: 'available' })
    status: string;

    @ManyToOne(() => Category, (category) => category.rooms)
    category: Category;

}