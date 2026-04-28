import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany, BeforeInsert } from 'typeorm';
import { Company } from '../../companies/entities/company.entity';
import { RadiusUser } from '../../radius-users/entities/radius-user.entity';
import { Invoice } from '../../billing/invoices/entities/invoice.entity';
import { Payment } from '../../billing/payments/entities/payment.entity';
import { Voucher } from '../../vouchers/entities/voucher.entity';
import { Session } from '../../sessions/entities/session.entity';
import { Notification } from '../../notifications/entities/notification.entity';
import { v4 as uuidv4 } from 'uuid';

export enum CustomerStatus {
  ACTIVE = 'active',
  SUSPENDED = 'suspended',
  EXPIRED = 'expired',
  LOCKED = 'locked',
}

@Entity()
export class Customer {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  uuid: string;

  @ManyToOne(() => Company, (company) => company.customers, { nullable: false, onDelete: 'CASCADE' })
  company: Company;

  @Column()
  firstName: string;

  @Column({ nullable: true })
  lastName: string;

  @Column({ nullable: true })
  email: string;

  @Column()
  phone: string;

  @Column({ nullable: true })
  address: string;

  @Column({ nullable: true })
  city: string;

  @Column({ default: 'Kenya' })
  country: string;

  @Column({ type: 'enum', enum: CustomerStatus, default: CustomerStatus.ACTIVE })
  status: CustomerStatus;

  @Column({ nullable: true })
  notes: string;

  @ManyToOne(() => Customer, (customer) => customer.referredCustomers, { nullable: true, onDelete: 'SET NULL' })
  referredBy: Customer;

  @OneToMany(() => Customer, (customer) => customer.referredBy)
  referredCustomers: Customer[];

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0.00 })
  balance: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0.00 })
  creditLimit: number;

  @OneToMany(() => RadiusUser, (radiusUser) => radiusUser.customer)
  radiusUsers: RadiusUser[];

  @OneToMany(() => Invoice, (invoice) => invoice.customer)
  invoices: Invoice[];

  @OneToMany(() => Payment, (payment) => payment.customer)
  payments: Payment[];

  @OneToMany(() => Voucher, (voucher) => voucher.usedBy)
  usedVouchers: Voucher[];

  @OneToMany(() => Session, (session) => session.customer)
  sessions: Session[];

  @OneToMany(() => Notification, (notification) => notification.customer)
  notifications: Notification[];

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
