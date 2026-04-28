import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, BeforeInsert, BeforeUpdate, Index } from 'typeorm';
import { Company } from '../../companies/entities/company.entity';
import { RadiusUser } from '../../radius-users/entities/radius-user.entity';
import { Device } from '../../devices/entities/device.entity';
import { Customer } from '../../customers/entities/customer.entity';
import { v4 as uuidv4 } from 'uuid';

export enum SessionStatus {
  ACTIVE = 'active',
  ENDED = 'ended',
  KILLED = 'killed',
}

@Entity()
@Index(['radiusUserId', 'status'])
@Index(['companyId', 'status'])
@Index(['deviceId'])
export class Session {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  uuid: string;

  @Column()
  companyId: number;

  @ManyToOne(() => Company, (company) => company.sessions, { onDelete: 'CASCADE' })
  company: Company;

  @Column()
  radiusUserId: number;

  @ManyToOne(() => RadiusUser, (radiusUser) => radiusUser.sessions, { onDelete: 'CASCADE' })
  radiusUser: RadiusUser;

  @Column({ nullable: true })
  customerId: number;

  @ManyToOne(() => Customer, (customer) => customer.sessions, { nullable: true, onDelete: 'SET NULL' })
  customer: Customer | null;

  @Column({ nullable: true })
  deviceId: number;

  @ManyToOne(() => Device, (device) => device.sessions, { nullable: true, onDelete: 'SET NULL' })
  device: Device | null;

  @Column({ nullable: true })
  acctSessionId: string;

  @Column({ nullable: true })
  framedIpAddress: string;

  @Column({ nullable: true })
  callingStationId: string;

  @Column({ nullable: true })
  nasPortId: string;

  @Column({ type: 'timestamp' })
  startTime: Date;

  @Column({ nullable: true })
  endTime: Date;

  @Column({ type: 'bigint', default: 0 })
  dataUp: number;

  @Column({ type: 'bigint', default: 0 })
  dataDown: number;

  @Column({ type: 'bigint' })
  dataTotal: number;

  @Column({ nullable: true })
  duration: number;

  @Column({ type: 'enum', enum: SessionStatus, default: SessionStatus.ACTIVE })
  status: SessionStatus;

  @Column({ nullable: true })
  terminatedCause: string;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;

  @BeforeInsert()
  generateUuid() {
    if (!this.uuid) this.uuid = uuidv4();
  }

  @BeforeInsert()
  @BeforeUpdate()
  updateDataTotal() {
    if (this.dataUp !== undefined && this.dataDown !== undefined) {
      this.dataTotal = this.dataUp + this.dataDown;
    }
  }
}
