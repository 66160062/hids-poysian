import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class User {

    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    fullName: string;

    @Column()
    phoneNumber: string;

    @Column()
    email: string;

    @Column()
    lineId: string;

    @Column()
    password: string;

    @Column()
    role: string;
}