import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany, BeforeInsert } from 'typeorm';
import { Company } from '../../companies/entities/company.entity';
import { RadiusUser } from '../../radius-users/entities/radius-user.entity';
import { Voucher } from '../../vouchers/entities/voucher.entity';
import { Invoice } from '../../billing/invoices/entities/invoice.entity';
import { v4 as uuidv4 } from 'uuid';

export enum PlanBillingCycle {
  DAILY = 'daily',
  WEEKLY = 'weekly',
  MONTHLY = 'monthly',
  YEARLY = 'yearly',
}

export enum PlanType {
  PREPAID = 'prepaid',
  POSTPAID = 'postpaid',
}

@Entity()
export class Plan {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  uuid: string;

  @ManyToOne(() => Company, (company) => company.plans, { nullable: false, onDelete: 'CASCADE' })
  company: Company;

  @Column()
  name: string;

  @Column({ nullable: true })
  description: string;

  @Column()
  speedUp: number; // in Kbps

  @Column()
  speedDown: number; // in Kbps

  @Column({ nullable: true })
  burstUp: number;

  @Column({ nullable: true })
  burstDown: number;

  @Column({ nullable: true })
  dataCap: number; // in bytes (NULL = unlimited)

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  price: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0.00 })
  setupFee: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0.00 })
  taxRate: number;

  @Column({ type: 'enum', enum: PlanBillingCycle, default: PlanBillingCycle.MONTHLY })
  billingCycle: PlanBillingCycle;

  @Column({ type: 'enum', enum: PlanType, default: PlanType.POSTPAID })
  type: PlanType;

  @Column({ default: true })
  isRecurring: boolean;

  @Column({ default: true })
  isActive: boolean;

  @Column({ default: 0 })
  sortOrder: number;

  @OneToMany(() => RadiusUser, (radiusUser) => radiusUser.plan)
  radiusUsers: RadiusUser[];

  @OneToMany(() => Voucher, (voucher) => voucher.plan)
  vouchers: Voucher[];

  @OneToMany(() => Invoice, (invoice) => invoice.plan)
  invoices: Invoice[];

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
