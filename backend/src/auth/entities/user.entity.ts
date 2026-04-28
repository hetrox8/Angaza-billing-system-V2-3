import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany, BeforeInsert } from 'typeorm';
import { Company } from '../../companies/entities/company.entity';
import { Notification } from '../../notifications/entities/notification.entity';
import { AuditLog } from '../../audit-logs/entities/audit-log.entity';
import { Voucher } from '../../vouchers/entities/voucher.entity';
import { v4 as uuidv4 } from 'uuid';

export enum UserRole {
  SUPERADMIN = 'superadmin',
  ADMIN = 'admin',
  SUPPORT = 'support',
  ACCOUNTANT = 'accountant',
}

@Entity()
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  uuid: string;

  @ManyToOne(() => Company, (company) => company.users, { nullable: true, eager: false })
  company: Company;

  @Column()
  firstName: string;

  @Column()
  lastName: string;

  @Column({ unique: true })
  email: string;

  @Column({ nullable: true })
  phone: string;

  @Column()
  passwordHash: string;

  @Column({ type: 'enum', enum: UserRole, default: UserRole.ADMIN })
  role: UserRole;

  @Column({ nullable: true })
  avatarUrl: string;

  @Column({ nullable: true })
  lastLogin: Date;

  @Column({ default: true })
  isActive: boolean;

  @Column({ default: false })
  emailVerified: boolean;

  @Column({ default: false })
  phoneVerified: boolean;

  @OneToMany(() => Notification, (notification) => notification.user)
  notifications: Notification[];

  @OneToMany(() => AuditLog, (auditLog) => auditLog.user)
  auditLogs: AuditLog[];

  @OneToMany(() => Voucher, (voucher) => voucher.createdBy)
  createdVouchers: Voucher[];

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
