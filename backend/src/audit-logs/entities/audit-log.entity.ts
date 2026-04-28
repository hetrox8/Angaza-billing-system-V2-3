import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, BeforeInsert, Index } from 'typeorm';
import { Company } from '../../companies/entities/company.entity';
import { User } from '../../auth/entities/user.entity';
import { v4 as uuidv4 } from 'uuid';

@Entity('audit_logs')
@Index(['companyId'])
@Index(['userId'])
@Index(['action'])
@Index(['entityType'])
@Index(['createdAt'])
export class AuditLog {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  uuid: string;

  @Column({ nullable: true })
  companyId: number;

  @ManyToOne(() => Company, (company) => company.auditLogs, { onDelete: 'SET NULL' })
  company: Company;

  @Column({ nullable: true })
  userId: number;

  @ManyToOne(() => User, (user) => user.auditLogs, { onDelete: 'SET NULL' })
  user: User;

  @Column()
  action: string; // e.g., "created_customer"

  @Column()
  entityType: string; // e.g., "customer"

  @Column({ nullable: true })
  entityId: number; // ID of the record

  @Column({ nullable: true })
  ipAddress: string;

  @Column({ nullable: true, type: 'text' })
  userAgent: string;

  @Column({ type: 'jsonb', nullable: true })
  oldValues: any;

  @Column({ type: 'jsonb', nullable: true })
  newValues: any;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;

  @BeforeInsert()
  generateUuid() {
    if (!this.uuid) this.uuid = uuidv4();
  }
}
