import { Contractor } from 'src/contractor/entities/contractor.entity';
import { Defect } from 'src/defects/entities/defect.entity';
import {
  Column,
  DeleteDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
@Entity('repair_record')
export class RepairRecord {
  @PrimaryGeneratedColumn({ name: 'repair_id' })
  repairId!: number;

  @Column({ type: 'text' })
  description!: string;

  @Column({ name: 'image_url', length: 255 })
  imageUrl!: string;

  @Column({ name: 'file_size' })
  fileSize!: number;

  @Column({ name: 'repaired_at', type: 'timestamp' })
  repairedAt!: Date;

  @DeleteDateColumn({ name: 'deleted_at' })
  deletedAt!: Date;

  @OneToOne(() => Defect)
  @JoinColumn({ name: 'defect_id' })
  defect!: Defect;

  @ManyToOne(() => Contractor)
  @JoinColumn({ name: 'contractor_id' })
  contractor!: Contractor;
}
