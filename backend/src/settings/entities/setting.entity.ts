import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, BeforeInsert, Index } from 'typeorm';
import { Company } from '../../companies/entities/company.entity';
import { v4 as uuidv4 } from 'uuid';

@Entity()
@Index(['companyId', 'key'], { unique: true })
export class Setting {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  uuid: string;

  @Column()
  companyId: number;

  @ManyToOne(() => Company, (company) => company.settings, { onDelete: 'CASCADE' })
  company: Company;

  @Column()
  key: string; // e.g., "mpesa_consumer_key", "sms_provider"

  @Column({ type: 'jsonb' })
  value: any; // Can store any type of setting value

  @Column({ nullable: true, type: 'text' })
  description: string;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;

  @Column({
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP',
    onUpdate: 'CURRENT_TIMESTAMP',
  })
  updatedAt: Date;

  @BeforeInsert()
  generateUuid() {
    if (!this.uuid) this.uuid = uuidv4();
  }
}
