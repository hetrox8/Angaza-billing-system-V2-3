import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Company } from './entities/company.entity';

@Injectable()
export class CompaniesService {
  constructor(
    @InjectRepository(Company)
    private companiesRepository: Repository<Company>,
  ) {}

  async create(createCompanyDto: any): Promise<Company> {
    const company = this.companiesRepository.create(createCompanyDto as Partial<Company>);
    return this.companiesRepository.save(company);
  }

  async findAll(): Promise<Company[]> {
    return this.companiesRepository.find({ relations: ['users'] });
  }

  async findOne(id: number): Promise<Company | null> {
    return this.companiesRepository.findOne({ where: { id }, relations: ['users'] });
  }

  async findByDomain(domain: string): Promise<Company | null> {
    return this.companiesRepository.findOne({ where: { domain } });
  }

  async update(id: number, updateCompanyDto: Partial<Company>): Promise<Company> {
    const company = await this.findOne(id);
    if (!company) throw new NotFoundException(`Company #${id} not found`);
    await this.companiesRepository.update(id, updateCompanyDto);
    return this.findOne(id) as Promise<Company>;
  }

  async remove(id: number): Promise<void> {
    await this.companiesRepository.delete(id);
  }
}
