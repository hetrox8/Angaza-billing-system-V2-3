import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThan, LessThan, FindOptionsWhere } from 'typeorm';
import { Voucher } from './entities/voucher.entity';
import { CompaniesService } from '../companies/companies.service';
import { PlansService } from '../plans/plans.service';
import { CustomersService } from '../customers/customers.service';
import { RadiusUsersService } from '../radius-users/radius-users.service';
import { CreateVoucherDto } from './dto/create-voucher.dto';
import { UpdateVoucherDto } from './dto/update-voucher.dto';

@Injectable()
export class VouchersService {
  private readonly logger = new Logger(VouchersService.name);

  constructor(
    @InjectRepository(Voucher)
    private vouchersRepository: Repository<Voucher>,
    private readonly companiesService: CompaniesService,
    private readonly plansService: PlansService,
    private readonly customersService: CustomersService,
    private readonly radiusUsersService: RadiusUsersService,
  ) {}

  async create(createVoucherDto: CreateVoucherDto): Promise<Voucher[]> {
    const company = await this.companiesService.findOne(createVoucherDto.companyId);
    if (!company) {
      throw new NotFoundException(`Company #${createVoucherDto.companyId} not found`);
    }

    const plan = await this.plansService.findOne(createVoucherDto.planId);
    if (!plan) {
      throw new NotFoundException(`Plan #${createVoucherDto.planId} not found`);
    }

    const count = createVoucherDto.count || 1;
    const expiryDate = createVoucherDto.expiryDate
      ? new Date(createVoucherDto.expiryDate)
      : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // Default: 30 days

    const vouchers: Voucher[] = [];
    for (let i = 0; i < count; i++) {
      const voucher = new Voucher();
      voucher.companyId = createVoucherDto.companyId;
      voucher.company = company;
      voucher.planId = createVoucherDto.planId;
      voucher.plan = plan as any;
      voucher.batchName = createVoucherDto.batchName || `BATCH-${Date.now()}`;
      voucher.expiryDate = expiryDate as any;
      voucher.createdById = createVoucherDto.createdById as any;

      const savedVoucher = await this.vouchersRepository.save(voucher);
      vouchers.push(savedVoucher);
    }

    this.logger.log(`Created ${count} voucher(s) for plan ${plan.id}, batch: ${createVoucherDto.batchName || 'default'}`);

    return vouchers;
  }

  async findAll(
    companyId?: number,
    planId?: number,
    batchName?: string,
    isUsed?: boolean,
    expiryFrom?: Date,
    expiryTo?: Date,
  ): Promise<Voucher[]> {
    const options: any = {
      relations: ['company', 'plan', 'usedBy', 'usedByRadiusUser', 'createdBy'],
      order: { createdAt: 'DESC' },
    };

    const where: any[] = [];
    if (companyId) where.push({ companyId });
    if (planId) where.push({ planId });
    if (batchName) where.push({ batchName });
    if (isUsed !== undefined) where.push({ isUsed });
    if (expiryFrom) where.push({ expiryDate: MoreThan(expiryFrom) });
    if (expiryTo) where.push({ expiryDate: LessThan(expiryTo) });

    if (where.length > 0) {
      options.where = where.length === 1 ? where[0] : where;
    }

    return this.vouchersRepository.find(options);
  }

  async findOne(id: number): Promise<Voucher | null> {
    return this.vouchersRepository.findOne({
      where: { id },
      relations: ['company', 'plan', 'usedBy', 'usedByRadiusUser', 'createdBy'],
    });
  }

  async findByCode(code: string): Promise<Voucher | null> {
    return this.vouchersRepository.findOne({
      where: { code },
      relations: ['company', 'plan', 'usedBy', 'usedByRadiusUser', 'createdBy'],
    });
  }

  async findBySerialNumber(serialNumber: string): Promise<Voucher | null> {
    return this.vouchersRepository.findOne({
      where: { serialNumber },
      relations: ['company', 'plan', 'usedBy', 'usedByRadiusUser', 'createdBy'],
    });
  }

  async findByBatch(batchName: string, companyId?: number): Promise<Voucher[]> {
    const options: any = {
      where: { batchName },
      relations: ['company', 'plan', 'usedBy', 'usedByRadiusUser', 'createdBy'],
      order: { createdAt: 'DESC' },
    };
    if (companyId) {
      options.where.companyId = companyId;
    }
    return this.vouchersRepository.find(options);
  }

  async findUnused(companyId?: number, planId?: number): Promise<Voucher[]> {
    const options: any = {
      where: { isUsed: false },
      relations: ['company', 'plan'],
      order: { createdAt: 'DESC' },
    };
    if (companyId) options.where.companyId = companyId;
    if (planId) options.where.planId = planId;
    return this.vouchersRepository.find(options);
  }

  async findExpiringSoon(days: number = 7, companyId?: number): Promise<Voucher[]> {
    const now = new Date();
    const soon = new Date();
    soon.setDate(soon.getDate() + days);

    const where: any[] = [
      { expiryDate: MoreThan(now) },
      { expiryDate: LessThan(soon) },
    ];
    if (companyId) {
      where.push({ companyId });
    }

    return this.vouchersRepository.find({
      where: where.length === 1 ? where[0] : where,
      relations: ['company', 'plan'],
      order: { expiryDate: 'ASC' },
    });
  }

  async findExpired(companyId?: number): Promise<Voucher[]> {
    const where: any[] = [
      { expiryDate: LessThan(new Date()) },
    ];
    if (companyId) {
      where.push({ companyId });
    }

    return this.vouchersRepository.find({
      where: where.length === 1 ? where[0] : where,
      relations: ['company', 'plan'],
      order: { expiryDate: 'ASC' },
    });
  }

  async update(id: number, updateVoucherDto: UpdateVoucherDto): Promise<Voucher> {
    const voucher = await this.findOne(id);
    if (!voucher) {
      throw new NotFoundException(`Voucher #${id} not found`);
    }

    const dto = updateVoucherDto as any;

    if (dto.planId !== undefined) {
      const plan = await this.plansService.findOne(dto.planId);
      if (plan) {
        voucher.planId = dto.planId;
        voucher.plan = plan as any;
      }
      delete dto.planId;
    }

    delete dto.companyId;
    delete dto.createdById;

    Object.assign(voucher, dto);

    await this.vouchersRepository.save(voucher);
    return voucher;
  }

  async remove(id: number): Promise<void> {
    const voucher = await this.findOne(id);
    if (!voucher) {
      throw new NotFoundException(`Voucher #${id} not found`);
    }
    if (voucher.isUsed) {
      throw new BadRequestException(`Cannot delete used voucher: ${voucher.code}`);
    }

    await this.vouchersRepository.delete(id);
    this.logger.log(`Voucher deleted: ${voucher.code} (ID: ${id})`);
  }

  async redeem(code: string, customerId: number, radiusUserId?: number): Promise<{ success: boolean; voucher?: Voucher; error?: string }> {
    const voucher = await this.findByCode(code);
    if (!voucher) {
      return { success: false, error: 'Voucher not found' };
    }

    if (voucher.isUsed) {
      return { success: false, error: 'Voucher already used' };
    }

    if (voucher.expiryDate < new Date()) {
      return { success: false, error: 'Voucher expired' };
    }

    const customer = await this.customersService.findOne(customerId);
    if (!customer) {
      return { success: false, error: 'Customer not found' };
    }

    // Mark voucher as used
    voucher.isUsed = true;
    voucher.usedById = customerId;
    voucher.usedBy = customer as any;
    voucher.usedAt = new Date() as any;

    if (radiusUserId) {
      const radiusUser = await this.radiusUsersService.findOne(radiusUserId);
      if (radiusUser) {
        voucher.usedByRadiusUserId = radiusUserId;
        voucher.usedByRadiusUser = radiusUser as any;
      }
    }

    await this.vouchersRepository.save(voucher);

    this.logger.log(`Voucher redeemed: ${voucher.code} by customer ${customerId}`);

    return { success: true, voucher };
  }

  async bulkGenerate(
    companyId: number,
    planId: number,
    count: number,
    batchName?: string,
    expiryDays?: number,
    createdById?: number,
  ): Promise<{ generated: number; vouchers: Voucher[] }> {
    const company = await this.companiesService.findOne(companyId);
    if (!company) {
      throw new NotFoundException(`Company #${companyId} not found`);
    }

    const plan = await this.plansService.findOne(planId);
    if (!plan) {
      throw new NotFoundException(`Plan #${planId} not found`);
    }

    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + (expiryDays || 30));

    const batch = batchName || `BATCH-${companyId}-${Date.now()}`;

    const vouchers: Voucher[] = [];
    for (let i = 0; i < count; i++) {
      const voucher = new Voucher();
      voucher.companyId = companyId;
      voucher.company = company;
      voucher.planId = planId;
      voucher.plan = plan as any;
      voucher.batchName = batch;
      voucher.expiryDate = expiryDate as any;
      voucher.createdById = createdById as any;

      const savedVoucher = await this.vouchersRepository.save(voucher);
      vouchers.push(savedVoucher);
    }

    this.logger.log(`Bulk generated ${count} vouchers for company ${companyId}, plan ${planId}, batch: ${batch}`);

    return { generated: count, vouchers };
  }

  async getStats(companyId: number): Promise<{
    total: number;
    unused: number;
    used: number;
    expired: number;
    expiringSoon: number;
    byBatch: { batchName: string; count: number; used: number }[];
  }> {
    const soon = new Date();
    soon.setDate(soon.getDate() + 7);

    const [total, unused, used, allVouchers] = await Promise.all([
      this.vouchersRepository.count({ where: { companyId } }),
      this.vouchersRepository.count({ where: { companyId, isUsed: false } }),
      this.vouchersRepository.count({ where: { companyId, isUsed: true } }),
      this.vouchersRepository.find({
        where: { companyId },
        select: ['batchName', 'isUsed', 'expiryDate'],
      }),
    ]);

    // Calculate expired and expiringSoon from query results
    let expired = 0;
    let expiringSoon = 0;
    const byBatchMap = new Map<string, { count: number; used: number }>();
    const now = new Date();

    for (const v of allVouchers) {
      const batchName = v.batchName || 'Unbatched';
      const existing = byBatchMap.get(batchName) || { count: 0, used: 0 };
      existing.count++;
      if (v.isUsed) existing.used++;
      
      // Check expiry
      if (v.expiryDate && v.expiryDate < now) {
        expired++;
      } else if (v.expiryDate && v.expiryDate >= now && v.expiryDate <= soon) {
        expiringSoon++;
      }
      
      byBatchMap.set(batchName, existing);
    }

    return {
      total,
      unused,
      used,
      expired,
      expiringSoon,
      byBatch: Array.from(byBatchMap.entries()).map(([batchName, data]) => ({
        batchName,
        count: data.count,
        used: data.used,
      })),
    };
  }

  async validate(code: string): Promise<{ valid: boolean; voucher?: Voucher; error?: string }> {
    const voucher = await this.findByCode(code);
    if (!voucher) {
      return { valid: false, error: 'Voucher not found' };
    }

    if (voucher.isUsed) {
      return { valid: false, error: 'Voucher already used', voucher };
    }

    if (voucher.expiryDate < new Date()) {
      return { valid: false, error: 'Voucher expired', voucher };
    }

    return { valid: true, voucher };
  }
}
