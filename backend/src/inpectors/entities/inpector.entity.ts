import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';
// import { ManyToOne } from 'typeorm/browser';

@Entity()
export class Inpector {
  @PrimaryGeneratedColumn()
  id: number;

  //   @ManyToOne(() => Team, (team) => team.inpectors)
  //   team: Team;

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

  @CreateDateColumn()
  createdAt: Date;

  @DeleteDateColumn()
  deletedAt: Date;
}
