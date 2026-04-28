import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Setting } from './entities/setting.entity';
import { CompaniesService } from '../companies/companies.service';
import { CreateSettingDto } from './dto/create-setting.dto';
import { UpdateSettingDto } from './dto/update-setting.dto';

@Injectable()
export class SettingsService {
  private readonly logger = new Logger(SettingsService.name);

  constructor(
    @InjectRepository(Setting)
    private settingsRepository: Repository<Setting>,
    private readonly companiesService: CompaniesService,
  ) {}

  async create(createSettingDto: CreateSettingDto): Promise<Setting> {
    const company = await this.companiesService.findOne(createSettingDto.companyId);
    if (!company) {
      throw new NotFoundException(`Company #${createSettingDto.companyId} not found`);
    }

    // Check if setting with same key already exists
    const existing = await this.settingsRepository.findOne({
      where: { companyId: createSettingDto.companyId, key: createSettingDto.key },
    });

    if (existing) {
      // Update existing setting
      return this.update(existing.id, { value: createSettingDto.value, description: createSettingDto.description } as UpdateSettingDto);
    }

    const setting = new Setting();
    setting.companyId = createSettingDto.companyId;
    setting.company = company;
    setting.key = createSettingDto.key;
    setting.value = createSettingDto.value;
    setting.description = createSettingDto.description as any;

    const savedSetting = await this.settingsRepository.save(setting);

    this.logger.log(`Setting created: ${setting.key} for company ${company.id}`);

    return savedSetting;
  }

  async findAll(companyId?: number): Promise<Setting[]> {
    const options: any = {
      relations: ['company'],
      order: { key: 'ASC' },
    };

    if (companyId) {
      options.where = { companyId };
    }

    return this.settingsRepository.find(options);
  }

  async findOne(id: number): Promise<Setting | null> {
    return this.settingsRepository.findOne({
      where: { id },
      relations: ['company'],
    });
  }

  async findByKey(key: string, companyId?: number): Promise<Setting | null> {
    const options: any = { where: { key } };
    if (companyId) {
      options.where.companyId = companyId;
    }
    return this.settingsRepository.findOne(options);
  }

  async getValue(key: string, companyId?: number, defaultValue: any = null): Promise<any> {
    const setting = await this.findByKey(key, companyId);
    if (setting) {
      return setting.value;
    }
    return defaultValue;
  }

  async getAllValues(companyId: number): Promise<Record<string, any>> {
    const settings = await this.findAll(companyId);
    const result: Record<string, any> = {};
    for (const setting of settings) {
      result[setting.key] = setting.value;
    }
    return result;
  }

  async update(id: number, updateSettingDto: UpdateSettingDto): Promise<Setting> {
    const setting = await this.findOne(id);
    if (!setting) {
      throw new NotFoundException(`Setting #${id} not found`);
    }

    const dto = updateSettingDto as any;
    delete dto.companyId;
    delete dto.key;

    Object.assign(setting, dto);

    await this.settingsRepository.save(setting);

    this.logger.log(`Setting updated: ${setting.key} (ID: ${id})`);

    return setting;
  }

  async updateByKey(key: string, value: any, companyId?: number): Promise<Setting | null> {
    const setting = await this.findByKey(key, companyId);
    if (!setting) {
      return null;
    }

    setting.value = value;
    await this.settingsRepository.save(setting);

    this.logger.log(`Setting updated by key: ${key} for company ${companyId || 'global'}`);

    return setting;
  }

  async remove(id: number): Promise<void> {
    const setting = await this.findOne(id);
    if (!setting) {
      throw new NotFoundException(`Setting #${id} not found`);
    }

    await this.settingsRepository.delete(id);

    this.logger.log(`Setting deleted: ${setting.key} (ID: ${id})`);
  }

  async removeByKey(key: string, companyId?: number): Promise<void> {
    const options: any = { where: { key } };
    if (companyId) {
      options.where.companyId = companyId;
    }
    await this.settingsRepository.delete(options.where);

    this.logger.log(`Setting deleted by key: ${key} for company ${companyId || 'global'}`);
  }

  async getSystemSettings(): Promise<Record<string, any>> {
    // Get settings that are not tied to any company (companyId is null)
    const settings = await this.settingsRepository.find({
      where: { companyId: null as any },
      select: ['key', 'value'],
    });
    const result: Record<string, any> = {};
    for (const setting of settings) {
      result[setting.key] = setting.value;
    }
    return result;
  }
}
