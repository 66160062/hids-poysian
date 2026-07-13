import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class Floor {
  @PrimaryGeneratedColumn()
  floorId!: number;
  @Column()
  label!: string;

  @Column({ name: 'floor_order', type: 'int', nullable: true })
  floorOrder?: number;
}
