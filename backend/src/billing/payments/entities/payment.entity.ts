import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, BeforeInsert } from 'typeorm';
import { Company } from '../../../companies/entities/company.entity';
import { Customer } from '../../../customers/entities/customer.entity';
import { Invoice } from '../../invoices/entities/invoice.entity';
import { v4 as uuidv4 } from 'uuid';

export enum PaymentStatus {
  PENDING = 'pending',
  COMPLETED = 'completed',
  FAILED = 'failed',
  REVERSED = 'reversed',
}

export enum PaymentMethod {
  MPESA = 'mpesa',
  CASH = 'cash',
  BANK_TRANSFER = 'bank_transfer',
  CARD = 'card',
}

@Entity()
export class Payment {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  uuid: string;

  @Column()
  companyId: number;

  @ManyToOne(() => Company, (company) => company.payments, { onDelete: 'CASCADE' })
  company: Company;

  @Column({ nullable: true })
  invoiceId: number;

  @ManyToOne(() => Invoice, (invoice) => invoice.payments, { nullable: true, onDelete: 'SET NULL' })
  invoice: Invoice;

  @Column()
  customerId: number;

  @ManyToOne(() => Customer, (customer) => customer.payments, { nullable: false, onDelete: 'CASCADE' })
  customer: Customer;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  amount: number;

  @Column({ type: 'enum', enum: PaymentMethod })
  method: PaymentMethod;

  @Column({ nullable: true })
  transactionId: string; // Internal reference

  @Column({ nullable: true })
  externalId: string; // M-Pesa Receipt Number

  @Column({ nullable: true })
  mpesaRequestId: string; // From Daraja API

  @Column({ nullable: true })
  mpesaResultCode: string;

  @Column({ nullable: true, type: 'text' })
  mpesaResultDesc: string;

  @Column({ nullable: true })
  mpesaPhone: string; // Payer's phone

  @Column({ type: 'jsonb', nullable: true })
  gatewayResponse: any; // Raw response from payment gateway

  @Column({ type: 'enum', enum: PaymentStatus, default: PaymentStatus.PENDING })
  status: PaymentStatus;

  @Column({ nullable: true, type: 'text' })
  notes: string;

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
