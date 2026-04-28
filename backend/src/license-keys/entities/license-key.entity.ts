import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, BeforeInsert, Index } from 'typeorm';
import { Company } from '../../companies/entities/company.entity';
import { LicenseType } from '../../companies/entities/license-type.enum';
import { v4 as uuidv4 } from 'uuid';

@Entity('license_keys')
@Index(['companyId'])
@Index(['key'], { unique: true })
@Index(['type'])
export class LicenseKey {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  uuid: string;

  @Column({ nullable: true })
  companyId: number;

  @ManyToOne(() => Company, (company) => company.licenseKeys, { onDelete: 'CASCADE' })
  company: Company;

  @Column({ unique: true })
  key: string; // License key string

  @Column({ type: 'enum', enum: LicenseType })
  type: LicenseType;

  @Column()
  maxDevices: number;

  @Column()
  maxCustomers: number;

  @Column({ nullable: true })
  expiresAt: Date;

  @Column({ default: true })
  isActive: boolean;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;

  @BeforeInsert()
  generateUuid() {
    if (!this.uuid) this.uuid = uuidv4();
  }
}
