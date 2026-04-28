import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Plan, PlanBillingCycle, PlanType } from './entities/plan.entity';
import { CompaniesService } from '../companies/companies.service';
import { CreatePlanDto } from './dto/create-plan.dto';
import { UpdatePlanDto } from './dto/update-plan.dto';

@Injectable()
export class PlansService {
  constructor(
    @InjectRepository(Plan)
    private plansRepository: Repository<Plan>,
    private readonly companiesService: CompaniesService,
  ) {}

  async create(createPlanDto: CreatePlanDto): Promise<Plan> {
    const company = await this.companiesService.findOne(createPlanDto.companyId);
    if (!company) {
      throw new NotFoundException(`Company #${createPlanDto.companyId} not found`);
    }

    const { companyId, ...planData } = createPlanDto;
    const plan = this.plansRepository.create({
      ...planData,
      company,
      setupFee: planData.setupFee || 0,
      taxRate: planData.taxRate || 0,
      billingCycle: planData.billingCycle || PlanBillingCycle.MONTHLY,
      type: planData.type || PlanType.POSTPAID,
      isRecurring: planData.isRecurring !== false,
      isActive: planData.isActive !== false,
      sortOrder: planData.sortOrder || 0,
    });

    return this.plansRepository.save(plan);
  }

  async findAll(companyId?: number): Promise<Plan[]> {
    const options: any = { 
      relations: ['company', 'radiusUsers', 'vouchers'],
      order: { sortOrder: 'ASC', name: 'ASC' }
    };
    if (companyId) {
      options.where = { company: { id: companyId } };
    }
    return this.plansRepository.find(options);
  }

  async findOne(id: number): Promise<Plan | null> {
    return this.plansRepository.findOne({
      where: { id },
      relations: ['company', 'radiusUsers', 'vouchers', 'invoices'],
    });
  }

  async findByCompany(companyId: number): Promise<Plan[]> {
    return this.plansRepository.find({
      where: { company: { id: companyId } },
      relations: ['company'],
      order: { sortOrder: 'ASC', name: 'ASC' },
    });
  }

  async findActiveByCompany(companyId: number): Promise<Plan[]> {
    return this.plansRepository.find({
      where: { company: { id: companyId }, isActive: true },
      relations: ['company'],
      order: { sortOrder: 'ASC', name: 'ASC' },
    });
  }

  async update(id: number, updatePlanDto: UpdatePlanDto): Promise<Plan> {
    const plan = await this.findOne(id);
    if (!plan) {
      throw new NotFoundException(`Plan #${id} not found`);
    }

    await this.plansRepository.update(id, updatePlanDto);
    return this.findOne(id) as Promise<Plan>;
  }

  async remove(id: number): Promise<void> {
    const plan = await this.findOne(id);
    if (!plan) {
      throw new NotFoundException(`Plan #${id} not found`);
    }
    await this.plansRepository.delete(id);
  }

  async activate(id: number): Promise<Plan> {
    const plan = await this.findOne(id);
    if (!plan) {
      throw new NotFoundException(`Plan #${id} not found`);
    }
    await this.plansRepository.update(id, { isActive: true });
    return this.findOne(id) as Promise<Plan>;
  }

  async deactivate(id: number): Promise<Plan> {
    const plan = await this.findOne(id);
    if (!plan) {
      throw new NotFoundException(`Plan #${id} not found`);
    }
    await this.plansRepository.update(id, { isActive: false });
    return this.findOne(id) as Promise<Plan>;
  }

  async reorder(planIds: number[]): Promise<Plan[]> {
    for (let i = 0; i < planIds.length; i++) {
      await this.plansRepository.update(planIds[i], { sortOrder: i });
    }

    return this.plansRepository.find({
      where: { id: In(planIds) },
      order: { sortOrder: 'ASC' },
    });
  }
}
