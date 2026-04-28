import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Customer, CustomerStatus } from './entities/customer.entity';
import { CompaniesService } from '../companies/companies.service';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';

@Injectable()
export class CustomersService {
  constructor(
    @InjectRepository(Customer)
    private customersRepository: Repository<Customer>,
    private readonly companiesService: CompaniesService,
  ) {}

  async create(createCustomerDto: CreateCustomerDto): Promise<Customer> {
    const company = await this.companiesService.findOne(createCustomerDto.companyId);
    if (!company) {
      throw new NotFoundException(`Company #${createCustomerDto.companyId} not found`);
    }

    const referredBy = createCustomerDto.referredById
      ? await this.findOne(createCustomerDto.referredById)
      : null;

    const customer = new Customer();
    customer.firstName = createCustomerDto.firstName;
    customer.lastName = createCustomerDto.lastName as any;
    customer.email = createCustomerDto.email as any;
    customer.phone = createCustomerDto.phone;
    customer.address = createCustomerDto.address as any;
    customer.city = createCustomerDto.city as any;
    customer.country = createCustomerDto.country || 'Kenya';
    customer.status = createCustomerDto.status || CustomerStatus.ACTIVE;
    customer.notes = createCustomerDto.notes as any;
    customer.balance = createCustomerDto.balance || 0;
    customer.creditLimit = createCustomerDto.creditLimit || 0;
    customer.company = company;
    customer.referredBy = referredBy as any;

    return this.customersRepository.save(customer);
  }

  async findAll(companyId?: number): Promise<Customer[]> {
    const options: any = { relations: ['company', 'referredBy', 'radiusUsers'] };
    if (companyId) {
      options.where = { company: { id: companyId } };
    }
    return this.customersRepository.find(options);
  }

  async findOne(id: number): Promise<Customer | null> {
    return this.customersRepository.findOne({
      where: { id },
      relations: ['company', 'referredBy', 'radiusUsers', 'invoices', 'payments', 'sessions'],
    });
  }

  async findByPhone(phone: string, companyId: number): Promise<Customer | null> {
    return this.customersRepository.findOne({
      where: { phone, company: { id: companyId } },
      relations: ['company'],
    });
  }

  async findByEmail(email: string, companyId: number): Promise<Customer | null> {
    return this.customersRepository.findOne({
      where: { email, company: { id: companyId } },
      relations: ['company'],
    });
  }

  async update(id: number, updateCustomerDto: UpdateCustomerDto): Promise<Customer> {
    const customer = await this.findOne(id);
    if (!customer) {
      throw new NotFoundException(`Customer #${id} not found`);
    }

    const dto = updateCustomerDto as any;
    
    if (dto.firstName !== undefined) customer.firstName = dto.firstName;
    if (dto.lastName !== undefined) customer.lastName = dto.lastName;
    if (dto.email !== undefined) customer.email = dto.email;
    if (dto.phone !== undefined) customer.phone = dto.phone;
    if (dto.address !== undefined) customer.address = dto.address;
    if (dto.city !== undefined) customer.city = dto.city;
    if (dto.country !== undefined) customer.country = dto.country;
    if (dto.status !== undefined) customer.status = dto.status;
    if (dto.notes !== undefined) customer.notes = dto.notes;
    if (dto.balance !== undefined) customer.balance = dto.balance;
    if (dto.creditLimit !== undefined) customer.creditLimit = dto.creditLimit;
    
    if (dto.referredById !== undefined && dto.referredById !== null) {
      const referredBy = await this.findOne(dto.referredById);
      if (referredBy) {
        customer.referredBy = referredBy as any;
      }
    }

    await this.customersRepository.save(customer);
    return customer;
  }

  async remove(id: number): Promise<void> {
    await this.customersRepository.delete(id);
  }

  async suspend(id: number, reason: string): Promise<Customer> {
    const customer = await this.findOne(id);
    if (!customer) {
      throw new NotFoundException(`Customer #${id} not found`);
    }

    customer.status = CustomerStatus.SUSPENDED;
    customer.notes = customer.notes ? `${customer.notes}\nSuspended: ${reason}` : `Suspended: ${reason}`;
    await this.customersRepository.save(customer);

    return customer;
  }

  async reactivate(id: number): Promise<Customer> {
    const customer = await this.findOne(id);
    if (!customer) {
      throw new NotFoundException(`Customer #${id} not found`);
    }

    customer.status = CustomerStatus.ACTIVE;
    await this.customersRepository.save(customer);

    return customer;
  }

  async updateBalance(id: number, amount: number, increment: boolean = true): Promise<Customer> {
    const customer = await this.findOne(id);
    if (!customer) {
      throw new NotFoundException(`Customer #${id} not found`);
    }

    const newBalance = increment ? customer.balance + amount : amount;
    customer.balance = newBalance;
    await this.customersRepository.save(customer);

    return customer;
  }
}
