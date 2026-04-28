import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany, BeforeInsert, BeforeUpdate } from 'typeorm';
import { Company } from '../../../companies/entities/company.entity';
import { Customer } from '../../../customers/entities/customer.entity';
import { Plan } from '../../../plans/entities/plan.entity';
import { Payment } from '../../payments/entities/payment.entity';
import { v4 as uuidv4 } from 'uuid';

export enum InvoiceStatus {
  DRAFT = 'draft',
  SENT = 'sent',
  PAID = 'paid',
  OVERDUE = 'overdue',
  CANCELLED = 'cancelled',
}

@Entity()
export class Invoice {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  uuid: string;

  @Column()
  companyId: number;

  @ManyToOne(() => Company, (company) => company.invoices, { onDelete: 'CASCADE' })
  company: Company;

  @Column()
  customerId: number;

  @ManyToOne(() => Customer, (customer) => customer.invoices, { nullable: false, onDelete: 'CASCADE' })
  customer: Customer;

  @Column({ unique: true })
  number: string; // e.g., INV-ANAGAZA-2024-0001

  @ManyToOne(() => Plan, (plan) => plan.invoices, { nullable: true, onDelete: 'SET NULL' })
  plan: Plan;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  subtotal: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0.00 })
  tax: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  total: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0.00 })
  discount: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  amountDue: number;

  @Column({ type: 'enum', enum: InvoiceStatus, default: InvoiceStatus.DRAFT })
  status: InvoiceStatus;

  @Column({ type: 'timestamp' })
  dueDate: Date;

  @Column({ nullable: true })
  paidAt: Date;

  @Column({ nullable: true })
  paymentMethod: string;

  @Column({ nullable: true, type: 'text' })
  notes: string;

  @OneToMany(() => Payment, (payment) => payment.invoice)
  payments: Payment[];

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

  @BeforeInsert()
  @BeforeUpdate()
  calculateAmountDue() {
    if (this.total !== undefined && this.discount !== undefined) {
      this.amountDue = this.total - this.discount;
    }
  }
}
