
import { Column, Entity, PrimaryGeneratedColumn,CreateDateColumn,DeleteDateColumn} from "typeorm";

@Entity('contractor')
export class Contractor {
 @PrimaryGeneratedColumn()
 contractor_id : number;

 @Column({type : 'varchar' , length: 255})
 full_name : string;

 @Column ({type : 'varchar' , length : 255})
 phone_number : string;

 @Column([type: 'varchar', length : 255])
 email : string;

 @Column({ type : 'varchar' ,length : 255})
 comapany_name : string;

 @CreateDateColumn()
 created_at : Date;

 @DeleteDateColumn()
 delete_at : Date;
}
