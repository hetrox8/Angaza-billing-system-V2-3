import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, Index, BeforeInsert } from 'typeorm';
import { Company } from '../../companies/entities/company.entity';
import { Device } from '../../devices/entities/device.entity';
import { RadiusUser } from '../../radius-users/entities/radius-user.entity';
import { v4 as uuidv4 } from 'uuid';

@Entity()
@Index(['deviceId', 'timestamp'])
@Index(['companyId', 'timestamp'])
export class Monitoring {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  uuid: string;

  @Column()
  companyId: number;

  @ManyToOne(() => Company, (company) => company.monitoringData, { onDelete: 'CASCADE' })
  company: Company;

  @Column({ nullable: true })
  deviceId: number;

  @ManyToOne(() => Device, (device) => device.monitoringData, { nullable: true, onDelete: 'SET NULL' })
  device: Device;

  @Column({ nullable: true })
  radiusUserId: number;

  @ManyToOne(() => RadiusUser, (radiusUser) => radiusUser.monitoringSessions, { nullable: true, onDelete: 'SET NULL' })
  radiusUser: RadiusUser;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  timestamp: Date;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  uploadSpeed: number; // Mbps

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  downloadSpeed: number; // Mbps

  @Column({ nullable: true })
  latency: number; // ms

  @Column({ nullable: true })
  packetLoss: number; // percentage

  @Column({ type: 'bigint', nullable: true })
  bytesUploaded: number;

  @Column({ type: 'bigint', nullable: true })
  bytesDownloaded: number;

  @Column({ nullable: true })
  signalStrength: number; // dBm (for wireless)

  @Column({ nullable: true })
  cpuUsage: number; // percentage

  @Column({ nullable: true })
  memoryUsage: number; // percentage

  @Column({ nullable: true })
  uptime: number; // seconds

  @Column({ nullable: true })
  connectedClients: number; // For access points

  @Column({ nullable: true })
  status: string; // online, offline, degraded, etc.

  @Column({ nullable: true, type: 'jsonb' })
  metadata: any; // Additional monitoring data

  @BeforeInsert()
  generateUuid() {
    if (!this.uuid) this.uuid = uuidv4();
    if (!this.timestamp) this.timestamp = new Date();
  }
}
