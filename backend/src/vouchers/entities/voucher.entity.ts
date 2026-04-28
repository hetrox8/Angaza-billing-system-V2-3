import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, BeforeInsert, Index } from 'typeorm';
import { Company } from '../../companies/entities/company.entity';
import { Plan } from '../../plans/entities/plan.entity';
import { Customer } from '../../customers/entities/customer.entity';
import { RadiusUser } from '../../radius-users/entities/radius-user.entity';
import { User } from '../../auth/entities/user.entity';
import { v4 as uuidv4 } from 'uuid';

@Index(['companyId', 'code'], { unique: true })
@Entity()
export class Voucher {
  @PrimaryGeneratedColumn()
  id: number;


  @Column({ unique: true })
  uuid: string;


  @Column()
  companyId: number;


  @ManyToOne(() => Company, (company) => company.vouchers, { onDelete: 'CASCADE' })
  company: Company;


  @Column()
  planId: number;


  @ManyToOne(() => Plan, (plan) => plan.vouchers, { nullable: false, onDelete: 'CASCADE' })
  plan: Plan;


  @Column()
  code: string; // Voucher code for redemption


  @Column({ unique: true })
  serialNumber: string; // For batch tracking


  @Column({ nullable: true })
  batchName: string;


  @Column({ type: 'timestamp' })
  expiryDate: Date;


  @Column({ default: false })
  isUsed: boolean;


  @Column({ nullable: true })
  usedById: number;


  @ManyToOne(() => Customer, (customer) => customer.usedVouchers, { nullable: true, onDelete: 'SET NULL' })
  usedBy: Customer;


  @Column({ nullable: true })
  usedByRadiusUserId: number;


  @ManyToOne(() => RadiusUser, (radiusUser) => radiusUser.redeemedVouchers, { nullable: true, onDelete: 'SET NULL' })
  usedByRadiusUser: RadiusUser;


  @Column({ nullable: true })
  usedAt: Date;


  @Column({ nullable: true })
  createdById: number;


  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  createdBy: User;


  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;


  @BeforeInsert()
  generateDefaults() {
    if (!this.uuid) this.uuid = uuidv4();
    if (!this.code) this.code = this.generateVoucherCode();
    if (!this.serialNumber) this.serialNumber = `SN-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
  }


  private generateVoucherCode(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < 12; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    // Format as XXXX-XXXX-XXXX
    return `${code.slice(0, 4)}-${code.slice(4, 8)}-${code.slice(8, 12)}`;
  }
}
