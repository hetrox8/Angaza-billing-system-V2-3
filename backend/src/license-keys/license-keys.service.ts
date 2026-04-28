import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThan, LessThan } from 'typeorm';
import { LicenseKey } from './entities/license-key.entity';
import { CompaniesService } from '../companies/companies.service';
import { CreateLicenseKeyDto } from './dto/create-license-key.dto';
import { UpdateLicenseKeyDto } from './dto/update-license-key.dto';
import { LicenseType } from '../companies/entities/license-type.enum';

@Injectable()
export class LicenseKeysService {
  private readonly logger = new Logger(LicenseKeysService.name);

  constructor(
    @InjectRepository(LicenseKey)
    private licenseKeysRepository: Repository<LicenseKey>,
    private readonly companiesService: CompaniesService,
  ) {}

  async create(createLicenseKeyDto: CreateLicenseKeyDto): Promise<LicenseKey> {
    if (createLicenseKeyDto.companyId) {
      const company = await this.companiesService.findOne(createLicenseKeyDto.companyId);
      if (!company) {
        throw new NotFoundException(`Company #${createLicenseKeyDto.companyId} not found`);
      }
    }

    // Check if license key already exists
    const existing = await this.findByKey(createLicenseKeyDto.key);
    if (existing) {
      throw new BadRequestException(`License key ${createLicenseKeyDto.key} already exists`);
    }

    const licenseKey = new LicenseKey();
    licenseKey.companyId = createLicenseKeyDto.companyId as any;
    licenseKey.company = createLicenseKeyDto.companyId ? { id: createLicenseKeyDto.companyId } as any : null as any;
    licenseKey.key = createLicenseKeyDto.key;
    licenseKey.type = createLicenseKeyDto.type;
    licenseKey.maxDevices = createLicenseKeyDto.maxDevices;
    licenseKey.maxCustomers = createLicenseKeyDto.maxCustomers;
    licenseKey.expiresAt = createLicenseKeyDto.expiresAt as any;
    licenseKey.isActive = createLicenseKeyDto.isActive !== undefined ? createLicenseKeyDto.isActive : true;

    const savedLicenseKey = await this.licenseKeysRepository.save(licenseKey);

    this.logger.log(`License key created: ${licenseKey.key} (Type: ${licenseKey.type})`);

    return savedLicenseKey;
  }

  async findAll(
    page?: number,
    limit?: number,
    type?: LicenseType,
    isActive?: boolean,
    companyId?: number,
  ): Promise<{ data: LicenseKey[]; total: number; page: number; limit: number }> {
    const options: any = {
      relations: ['company'],
      order: { createdAt: 'DESC' },
    };

    const where: any[] = [];
    const queryOptions: any = {};

    if (page && limit) {
      queryOptions.skip = (page - 1) * limit;
      queryOptions.take = limit;
    }

    if (companyId) where.push({ companyId });
    if (type) where.push({ type });
    if (isActive !== undefined) where.push({ isActive });

    if (where.length > 0) {
      options.where = where.length === 1 ? where[0] : where;
    }

    const [data, total] = await this.licenseKeysRepository.findAndCount({
      ...options,
      ...queryOptions,
    });

    return {
      data,
      total,
      page: page || 1,
      limit: limit || total,
    };
  }

  async findOne(id: number): Promise<LicenseKey | null> {
    return this.licenseKeysRepository.findOne({
      where: { id },
      relations: ['company'],
    });
  }

  async findByKey(key: string): Promise<LicenseKey | null> {
    return this.licenseKeysRepository.findOne({
      where: { key },
      relations: ['company'],
    });
  }

  async findByCompany(companyId: number): Promise<LicenseKey[]> {
    return this.licenseKeysRepository.find({
      where: { companyId },
      relations: ['company'],
      order: { createdAt: 'DESC' },
    });
  }

  async validateKey(key: string): Promise<{ valid: boolean; licenseKey?: LicenseKey; error?: string }> {
    const licenseKey = await this.findByKey(key);
    if (!licenseKey) {
      return { valid: false, error: 'License key not found' };
    }

    if (!licenseKey.isActive) {
      return { valid: false, error: 'License key is inactive', licenseKey };
    }

    if (licenseKey.expiresAt && licenseKey.expiresAt < new Date()) {
      return { valid: false, error: 'License key has expired', licenseKey };
    }

    return { valid: true, licenseKey };
  }

  async canActivateDevice(licenseKey: string, currentCount: number): Promise<{ allowed: boolean; error?: string }> {
    const validation = await this.validateKey(licenseKey);
    if (!validation.valid) {
      return { allowed: false, error: validation.error };
    }

    const lic = validation.licenseKey!;
    if (currentCount >= lic.maxDevices) {
      return { allowed: false, error: `Maximum devices (${lic.maxDevices}) reached` };
    }

    return { allowed: true };
  }

  async canAddCustomer(licenseKey: string, currentCount: number): Promise<{ allowed: boolean; error?: string }> {
    const validation = await this.validateKey(licenseKey);
    if (!validation.valid) {
      return { allowed: false, error: validation.error };
    }

    const lic = validation.licenseKey!;
    if (currentCount >= lic.maxCustomers) {
      return { allowed: false, error: `Maximum customers (${lic.maxCustomers}) reached` };
    }

    return { allowed: true };
  }

  async update(id: number, updateLicenseKeyDto: UpdateLicenseKeyDto): Promise<LicenseKey> {
    const licenseKey = await this.findOne(id);
    if (!licenseKey) {
      throw new NotFoundException(`License key #${id} not found`);
    }

    const dto = updateLicenseKeyDto as any;
    delete dto.companyId;
    delete dto.key;
    delete dto.type;

    Object.assign(licenseKey, dto);

    await this.licenseKeysRepository.save(licenseKey);

    this.logger.log(`License key updated: ${licenseKey.key} (ID: ${id})`);

    return licenseKey;
  }

  async activate(id: number): Promise<LicenseKey> {
    const licenseKey = await this.findOne(id);
    if (!licenseKey) {
      throw new NotFoundException(`License key #${id} not found`);
    }

    licenseKey.isActive = true;
    await this.licenseKeysRepository.save(licenseKey);

    this.logger.log(`License key activated: ${licenseKey.key} (ID: ${id})`);

    return licenseKey;
  }

  async deactivate(id: number): Promise<LicenseKey> {
    const licenseKey = await this.findOne(id);
    if (!licenseKey) {
      throw new NotFoundException(`License key #${id} not found`);
    }

    licenseKey.isActive = false;
    await this.licenseKeysRepository.save(licenseKey);

    this.logger.log(`License key deactivated: ${licenseKey.key} (ID: ${id})`);

    return licenseKey;
  }

  async remove(id: number): Promise<void> {
    const licenseKey = await this.findOne(id);
    if (!licenseKey) {
      throw new NotFoundException(`License key #${id} not found`);
    }

    await this.licenseKeysRepository.delete(id);

    this.logger.log(`License key deleted: ${licenseKey.key} (ID: ${id})`);
  }

  async getStats(): Promise<{
    total: number;
    active: number;
    inactive: number;
    expired: number;
    byType: { type: string; count: number }[];
  }> {
    const [total, active, inactive, expired, allKeys] = await Promise.all([
      this.licenseKeysRepository.count(),
      this.licenseKeysRepository.count({ where: { isActive: true } }),
      this.licenseKeysRepository.count({ where: { isActive: false } }),
      this.licenseKeysRepository.count({ where: { expiresAt: LessThan(new Date()) } }),
      this.licenseKeysRepository.find({ select: ['type'] }),
    ]);

    const byType = new Map<string, number>();
    for (const key of allKeys) {
      byType.set(key.type, (byType.get(key.type) || 0) + 1);
    }

    return {
      total,
      active,
      inactive,
      expired,
      byType: Array.from(byType.entries()).map(([type, count]) => ({ type, count })),
    };
  }

  async generateKey(type: LicenseType, maxDevices: number, maxCustomers: number, expiresInDays?: number): Promise<{ key: string; license: LicenseKey }> {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let key = '';
    for (let i = 0; i < 19; i++) {
      if (i > 0 && i % 4 === 0) key += '-';
      key += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    const licenseKeyString = `ANGAZA-${type.toUpperCase()}-${key}`;

    const licenseKey = new LicenseKey();
    licenseKey.key = licenseKeyString;
    licenseKey.type = type;
    licenseKey.maxDevices = maxDevices;
    licenseKey.maxCustomers = maxCustomers;
    licenseKey.isActive = true;
    if (expiresInDays) {
      licenseKey.expiresAt = new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000) as any;
    }

    const savedLicenseKey = await this.licenseKeysRepository.save(licenseKey);

    return { key: licenseKeyString, license: savedLicenseKey };
  }
}
