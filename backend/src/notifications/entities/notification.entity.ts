import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, BeforeInsert, Index } from 'typeorm';
import { Company } from '../../companies/entities/company.entity';
import { User } from '../../auth/entities/user.entity';
import { Customer } from '../../customers/entities/customer.entity';
import { v4 as uuidv4 } from 'uuid';

export enum NotificationType {
  INVOICE = 'invoice',
  PAYMENT = 'payment',
  SUSPENSION = 'suspension',
  EXPIRY = 'expiry',
  WELCOME = 'welcome',
  LOW_BALANCE = 'low_balance',
}

export enum NotificationChannel {
  EMAIL = 'email',
  SMS = 'sms',
  APP = 'app',
}

@Entity()
@Index(['companyId', 'isRead'])
@Index(['userId'])
@Index(['customerId'])
export class Notification {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  uuid: string;

  @Column()
  companyId: number;

  @ManyToOne(() => Company, (company) => company.notifications, { onDelete: 'CASCADE' })
  company: Company;

  @Column({ nullable: true })
  userId: number;

  @ManyToOne(() => User, (user) => user.notifications, { onDelete: 'SET NULL' })
  user: User;

  @Column({ nullable: true })
  customerId: number;

  @ManyToOne(() => Customer, (customer) => customer.notifications, { onDelete: 'SET NULL' })
  customer: Customer;

  @Column({ type: 'enum', enum: NotificationType })
  type: NotificationType;

  @Column()
  title: string;

  @Column({ type: 'text' })
  message: string;

  @Column({ type: 'jsonb', nullable: true })
  data: any; // e.g., { invoice_id: 123 }

  @Column({ default: false })
  isRead: boolean;

  @Column({ nullable: true })
  readAt: Date;

  @Column({ type: 'enum', enum: NotificationChannel, array: true, default: [] })
  sentVia: NotificationChannel[];

  @Column({ nullable: true })
  sentAt: Date;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;

  @BeforeInsert()
  generateUuid() {
    if (!this.uuid) this.uuid = uuidv4();
  }
}
