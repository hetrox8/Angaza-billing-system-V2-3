import { Entity, PrimaryGeneratedColumn, Column, OneToMany, BeforeInsert } from 'typeorm';
import { User } from '../../auth/entities/user.entity';
import { v4 as uuidv4 } from 'uuid';

export enum LicenseType {
  TRIAL = 'trial',
  MONTHLY = 'monthly',
  ANNUAL = 'annual',
  LIFETIME = 'lifetime',
}

@Entity()
export class Company {
  @PrimaryGeneratedColumn()
  id: number;

  // FIX: auto-generate uuid before insert
  @Column({ unique: true })
  uuid: string;

  @Column()
  name: string;

  @Column({ nullable: true })
  domain: string;

  @Column({ nullable: true })
  email: string;

  @Column({ nullable: true })
  phone: string;

  @Column({ nullable: true })
  address: string;

  @Column({ nullable: true })
  logoUrl: string;

  @Column({ type: 'jsonb', default: {} })
  settings: any;

  // FIX: auto-generate licenseKey before insert
  @Column({ unique: true })
  licenseKey: string;

  @Column({ type: 'enum', enum: LicenseType, default: LicenseType.TRIAL })
  licenseType: LicenseType;

  @Column({ nullable: true })
  licenseExpiresAt: Date;

  @Column({ default: 1 })
  maxDevices: number;

  @Column({ default: 100 })
  maxCustomers: number;

  @Column({ default: true })
  isActive: boolean;

  @OneToMany(() => User, (user) => user.company)
  users: User[];

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;

  @Column({
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP',
    onUpdate: 'CURRENT_TIMESTAMP',
  })
  updatedAt: Date;

  @BeforeInsert()
  generateDefaults() {
    if (!this.uuid) this.uuid = uuidv4();
    if (!this.licenseKey) this.licenseKey = `LK-${uuidv4().toUpperCase().replace(/-/g, '').slice(0, 16)}`;
  }
}
