import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany, BeforeInsert } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { Company } from '../../companies/entities/company.entity';
import { RadiusUser } from '../../radius-users/entities/radius-user.entity';
import { Session } from '../../sessions/entities/session.entity';
import { Monitoring } from '../../monitoring/entities/monitoring.entity';
import { v4 as uuidv4 } from 'uuid';


export enum DeviceType {
  PPPOE = 'PPPoE',
  HOTSPOT = 'Hotspot',
  BOTH = 'Both',
}


export enum DeviceStatus {
  ONLINE = 'online',
  OFFLINE = 'offline',
}


@Entity()
export class Device {
  @PrimaryGeneratedColumn()
  id: number;


  @Column({ unique: true })
  uuid: string;


  @ManyToOne(() => Company, (company) => company.devices, { nullable: false, onDelete: 'CASCADE' })
  company: Company;


  @Column()
  name: string;


  @Column()
  ipAddress: string;


  @Column({ default: 22 })
  sshPort: number;


  @Column()
  username: string;


  @Column()
  passwordEncrypted: string;

  private _password?: string;

  async setPassword(password: string): Promise<void> {
    const salt = await bcrypt.genSalt(12);
    this.passwordEncrypted = await bcrypt.hash(password, salt);
    this._password = password;
  }

  async validatePassword(password: string): Promise<boolean> {
    return bcrypt.compare(password, this.passwordEncrypted);
  }


  @Column({ type: 'enum', enum: DeviceType, default: DeviceType.BOTH })
  type: DeviceType;


  @Column({ nullable: true })
  location: string;


  @Column({ type: 'decimal', precision: 10, scale: 8, nullable: true })
  latitude: number;


  @Column({ type: 'decimal', precision: 11, scale: 8, nullable: true })
  longitude: number;


  @Column({ default: 'mikrotik' })
  nasIdentifier: string;


  @Column({ nullable: true })
  nasIpAddress: string;


  @Column()
  sharedSecret: string;


  @Column({ nullable: true })
  lastSeenAt: Date;


  @Column({ type: 'enum', enum: DeviceStatus, default: DeviceStatus.OFFLINE })
  status: DeviceStatus;


  @Column({ nullable: true })
  notes: string;


  @OneToMany(() => RadiusUser, (radiusUser) => radiusUser.device)
  radiusUsers: RadiusUser[];


  @OneToMany(() => Session, (session) => session.device)
  sessions: Session[];


  @OneToMany(() => Monitoring, (monitoring) => monitoring.device)
  monitoringData: Monitoring[];


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
