import { Entity, PrimaryGeneratedColumn, Column, OneToMany, BeforeInsert } from 'typeorm';
import { User } from '../../auth/entities/user.entity';
import { Customer } from '../../customers/entities/customer.entity';
import { Plan } from '../../plans/entities/plan.entity';
import { Device } from '../../devices/entities/device.entity';
import { RadiusUser } from '../../radius-users/entities/radius-user.entity';
import { Session } from '../../sessions/entities/session.entity';
import { Invoice } from '../../billing/invoices/entities/invoice.entity';
import { Payment } from '../../billing/payments/entities/payment.entity';
import { Voucher } from '../../vouchers/entities/voucher.entity';
import { Notification } from '../../notifications/entities/notification.entity';
import { AuditLog } from '../../audit-logs/entities/audit-log.entity';
import { Setting } from '../../settings/entities/setting.entity';
import { LicenseKey } from '../../license-keys/entities/license-key.entity';
import { Monitoring } from '../../monitoring/entities/monitoring.entity';
import { LicenseType } from './license-type.enum';
import { v4 as uuidv4 } from 'uuid';

@Entity()
export class Company {
  @PrimaryGeneratedColumn()
  id: number;

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
  settingsJson: any;

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

  // ============ RELATIONSHIPS ============

  @OneToMany(() => User, (user) => user.company)
  users: User[];

  @OneToMany(() => Customer, (customer) => customer.company)
  customers: Customer[];

  @OneToMany(() => Plan, (plan) => plan.company)
  plans: Plan[];

  @OneToMany(() => Device, (device) => device.company)
  devices: Device[];

  @OneToMany(() => RadiusUser, (radiusUser) => radiusUser.company)
  radiusUsers: RadiusUser[];

  @OneToMany(() => Session, (session) => session.company)
  sessions: Session[];

  @OneToMany(() => Invoice, (invoice) => invoice.company)
  invoices: Invoice[];

  @OneToMany(() => Payment, (payment) => payment.company)
  payments: Payment[];

  @OneToMany(() => Voucher, (voucher) => voucher.company)
  vouchers: Voucher[];

  @OneToMany(() => Notification, (notification) => notification.company)
  notifications: Notification[];

  @OneToMany(() => AuditLog, (auditLog) => auditLog.company)
  auditLogs: AuditLog[];

  @OneToMany(() => Setting, (setting) => setting.company)
  settings: Setting[];

  @OneToMany(() => LicenseKey, (licenseKey) => licenseKey.company)
  licenseKeys: LicenseKey[];

  @OneToMany(() => Monitoring, (monitoring) => monitoring.company)
  monitoringData: Monitoring[];

  // ============ TIMESTAMPS ============

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
