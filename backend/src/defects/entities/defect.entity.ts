import { Column, Entity, PrimaryGeneratedColumn , CreateDateColumn , UpdateDateColumn , DeleteDateColumn, ManyToMany, ManyToOne } from "typeorm"

@Entity('defect')
export class Defect {
    @PrimaryGeneratedColumn()
    defect_id: number;
    
    @Column({ type: 'text'})
    description: string;

    @Column({ type: 'varchar', length: 50 })
    severity: string;

    @Column({ type: 'varchar', length: 255 , default: '/defect-images/unknown.jpg'  })
    image_url: string;

    @Column()
    image_file_size: number;

    @Column({ type: 'varchar', length: 50 , default: 'found' })
    status: string;

    @CreateDateColumn()
    created_at: Date;

    @UpdateDateColumn()
    updated_at: Date;

    @DeleteDateColumn()
    deleted_at: Date;
}
