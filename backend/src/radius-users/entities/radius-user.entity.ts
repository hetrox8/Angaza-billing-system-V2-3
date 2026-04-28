import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany, BeforeInsert } from 'typeorm';
import { Company } from '../../companies/entities/company.entity';
import { Customer } from '../../customers/entities/customer.entity';
import { Device } from '../../devices/entities/device.entity';
import { Plan } from '../../plans/entities/plan.entity';
import { Session } from '../../sessions/entities/session.entity';
import { Voucher } from '../../vouchers/entities/voucher.entity';
import { Monitoring } from '../../monitoring/entities/monitoring.entity';
import { v4 as uuidv4 } from 'uuid';

@Entity()
export class RadiusUser {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  uuid: string;

  @ManyToOne(() => Company, (company) => company.radiusUsers, { nullable: false, onDelete: 'CASCADE' })
  company: Company;

  @Column()
  customerId: number;

  @ManyToOne(() => Customer, (customer) => customer.radiusUsers, { nullable: false, onDelete: 'CASCADE' })
  customer: Customer;

  @ManyToOne(() => Device, (device) => device.radiusUsers, { nullable: true, onDelete: 'SET NULL' })
  device: Device;

  @Column({ unique: true })
  username: string;

  @Column()
  password: string;

  @ManyToOne(() => Plan, (plan) => plan.radiusUsers, { nullable: true, onDelete: 'SET NULL' })
  plan: Plan;

  @Column({ nullable: true })
  ipPool: string;

  @Column({ nullable: true })
  macAddress: string;

  @Column({ default: 'Wireless-802.11' })
  nasPortType: string;

  @Column({ default: true })
  isActive: boolean;

  @Column({ default: false })
  isLocked: boolean;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  startDate: Date;

  @Column({ nullable: true })
  expiryDate: Date;

  @OneToMany(() => Session, (session) => session.radiusUser)
  sessions: Session[];

  @OneToMany(() => Voucher, (voucher) => voucher.usedByRadiusUser)
  redeemedVouchers: Voucher[];

  @OneToMany(() => Monitoring, (monitoring) => monitoring.radiusUser)
  monitoringSessions: Monitoring[];

  @Column({ nullable: true })
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
