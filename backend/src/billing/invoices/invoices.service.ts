import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThan, LessThan } from 'typeorm';
import { Invoice, InvoiceStatus } from './entities/invoice.entity';
import { CompaniesService } from '../../companies/companies.service';
import { CustomersService } from '../../customers/customers.service';
import { PlansService } from '../../plans/plans.service';
import { PaymentsService } from '../payments/payments.service';
import { CreateInvoiceDto } from './dto/create-invoice.dto';
import { UpdateInvoiceDto } from './dto/update-invoice.dto';

@Injectable()
export class InvoicesService {
  private readonly logger = new Logger(InvoicesService.name);

  constructor(
    @InjectRepository(Invoice)
    private invoicesRepository: Repository<Invoice>,
    private readonly companiesService: CompaniesService,
    private readonly customersService: CustomersService,
    private readonly plansService: PlansService,
    private readonly paymentsService: PaymentsService,
  ) {}

  private generateInvoiceNumber(companyId: number): string {
    return `INV-${companyId}-${Date.now().toString(36).toUpperCase()}`;
  }

  async create(createInvoiceDto: CreateInvoiceDto): Promise<Invoice> {
    const company = await this.companiesService.findOne(createInvoiceDto.companyId);
    if (!company) {
      throw new NotFoundException(`Company #${createInvoiceDto.companyId} not found`);
    }

    const customer = await this.customersService.findOne(createInvoiceDto.customerId);
    if (!customer) {
      throw new NotFoundException(`Customer #${createInvoiceDto.customerId} not found`);
    }

    let plan: any = null;
    if (createInvoiceDto.planId) {
      plan = await this.plansService.findOne(createInvoiceDto.planId);
      if (!plan) {
        throw new NotFoundException(`Plan #${createInvoiceDto.planId} not found`);
      }
    }

    const invoice = new Invoice();
    invoice.companyId = createInvoiceDto.companyId;
    invoice.company = company;
    invoice.customerId = createInvoiceDto.customerId;
    invoice.customer = customer;
    invoice.plan = plan as any;
    invoice.number = createInvoiceDto.number || this.generateInvoiceNumber(createInvoiceDto.companyId);
    invoice.subtotal = createInvoiceDto.subtotal;
    invoice.tax = createInvoiceDto.tax || 0;
    invoice.discount = createInvoiceDto.discount || 0;
    invoice.dueDate = new Date(createInvoiceDto.dueDate) as any;
    invoice.notes = createInvoiceDto.notes as any;
    invoice.status = createInvoiceDto.status || InvoiceStatus.DRAFT;
    invoice.total = invoice.subtotal + invoice.tax;
    invoice.amountDue = invoice.subtotal + invoice.tax - invoice.discount;

    const savedInvoice = await this.invoicesRepository.save(invoice);

    this.logger.log(`Invoice created: ${savedInvoice.number} (ID: ${savedInvoice.id}) for customer ${customer.id}`);

    return savedInvoice;
  }

  async findAll(companyId?: number, customerId?: number, status?: InvoiceStatus): Promise<Invoice[]> {
    const options: any = {
      relations: ['company', 'customer', 'plan', 'payments'],
      order: { createdAt: 'DESC', number: 'ASC' },
    };

    const where: any[] = [];
    if (companyId) where.push({ companyId });
    if (customerId) where.push({ customerId });
    if (status) where.push({ status });

    if (where.length > 0) {
      options.where = where.length === 1 ? where[0] : { AND: where };
    }

    return this.invoicesRepository.find(options);
  }

  async findOne(id: number): Promise<Invoice | null> {
    return this.invoicesRepository.findOne({
      where: { id },
      relations: ['company', 'customer', 'plan', 'payments'],
    });
  }

  async findByNumber(number: string): Promise<Invoice | null> {
    return this.invoicesRepository.findOne({
      where: { number },
      relations: ['company', 'customer', 'plan', 'payments'],
    });
  }

  async findByCustomer(customerId: number): Promise<Invoice[]> {
    return this.invoicesRepository.find({
      where: { customerId },
      relations: ['company', 'customer', 'plan', 'payments'],
      order: { createdAt: 'DESC' },
    });
  }

  async findOverdue(companyId: number): Promise<Invoice[]> {
    const now = new Date();
    return this.invoicesRepository.find({
      where: {
        companyId,
        dueDate: LessThan(now),
        status: InvoiceStatus.SENT,
      },
      relations: ['company', 'customer', 'plan'],
      order: { dueDate: 'ASC' },
    });
  }

  async findUnpaid(companyId: number): Promise<Invoice[]> {
    return this.invoicesRepository.find({
      where: {
        companyId,
        status: InvoiceStatus.SENT,
      },
      relations: ['company', 'customer', 'plan'],
      order: { dueDate: 'ASC' },
    });
  }

  async update(id: number, updateInvoiceDto: UpdateInvoiceDto): Promise<Invoice> {
    const invoice = await this.findOne(id);
    if (!invoice) {
      throw new NotFoundException(`Invoice #${id} not found`);
    }

    const dto = updateInvoiceDto as any;

    if (dto.planId !== undefined) {
      const plan = await this.plansService.findOne(dto.planId);
      if (plan) {
        invoice.plan = plan as any;
      }
      delete dto.planId;
    }

    delete dto.companyId;
    delete dto.customerId;

    Object.assign(invoice, dto);

    if (dto.subtotal !== undefined || dto.tax !== undefined || dto.discount !== undefined) {
      invoice.amountDue = (invoice.subtotal || 0) + (invoice.tax || 0) - (invoice.discount || 0);
    }

    await this.invoicesRepository.save(invoice);
    return invoice;
  }

  async remove(id: number): Promise<void> {
    const invoice = await this.findOne(id);
    if (!invoice) {
      throw new NotFoundException(`Invoice #${id} not found`);
    }

    await this.invoicesRepository.delete(id);
    this.logger.log(`Invoice deleted: ${invoice.number} (ID: ${id})`);
  }

  async send(id: number): Promise<Invoice> {
    const invoice = await this.findOne(id);
    if (!invoice) {
      throw new NotFoundException(`Invoice #${id} not found`);
    }

    invoice.status = InvoiceStatus.SENT;
    await this.invoicesRepository.save(invoice);

    this.logger.log(`Invoice sent: ${invoice.number} (ID: ${id})`);
    return invoice;
  }

  async markAsPaid(id: number, paymentMethod?: string, amount?: number): Promise<Invoice> {
    const invoice = await this.findOne(id);
    if (!invoice) {
      throw new NotFoundException(`Invoice #${id} not found`);
    }

    invoice.status = InvoiceStatus.PAID;
    invoice.paidAt = new Date() as any;
    invoice.paymentMethod = paymentMethod as any;

    if (amount && amount > 0) {
      invoice.amountDue = invoice.amountDue - amount;
      if (invoice.amountDue <= 0) {
        invoice.amountDue = 0;
      }
    }

    await this.invoicesRepository.save(invoice);

    this.logger.log(`Invoice marked as paid: ${invoice.number} (ID: ${id})`);
    return invoice;
  }

  async cancel(id: number, reason?: string): Promise<Invoice> {
    const invoice = await this.findOne(id);
    if (!invoice) {
      throw new NotFoundException(`Invoice #${id} not found`);
    }

    invoice.status = InvoiceStatus.CANCELLED;
    invoice.notes = invoice.notes
      ? `${invoice.notes}\nCancelled: ${reason || 'No reason provided'}`
      : `Cancelled: ${reason || 'No reason provided'}`;

    await this.invoicesRepository.save(invoice);

    this.logger.warn(`Invoice cancelled: ${invoice.number} (ID: ${id}) - Reason: ${reason}`);
    return invoice;
  }

  async getCustomerBalance(customerId: number): Promise<{ totalDue: number; overdueAmount: number; invoiceCount: number }> {
    const now = new Date();
    const [unpaid, overdue] = await Promise.all([
      this.invoicesRepository.find({
        where: {
          customerId,
          status: InvoiceStatus.SENT,
        },
        select: ['amountDue'],
      }),
      this.invoicesRepository.find({
        where: {
          customerId,
          dueDate: LessThan(now),
          status: InvoiceStatus.SENT,
        },
        select: ['amountDue'],
      }),
    ]);

    const totalDue = unpaid.reduce((sum: any, inv: any) => sum + (inv.amountDue || 0), 0);
    const overdueAmount = overdue.reduce((sum: any, inv: any) => sum + (inv.amountDue || 0), 0);

    return {
      totalDue,
      overdueAmount,
      invoiceCount: unpaid.length,
    };
  }

  async getStats(companyId: number): Promise<{
    total: number;
    draft: number;
    sent: number;
    paid: number;
    overdue: number;
    cancelled: number;
    totalAmount: number;
    totalPaid: number;
    totalDue: number;
  }> {
    const now = new Date();
    const [total, draft, sent, paid, cancelled, overdue, invoices] = await Promise.all([
      this.invoicesRepository.count({ where: { companyId } }),
      this.invoicesRepository.count({ where: { companyId, status: InvoiceStatus.DRAFT } }),
      this.invoicesRepository.count({ where: { companyId, status: InvoiceStatus.SENT } }),
      this.invoicesRepository.count({ where: { companyId, status: InvoiceStatus.PAID } }),
      this.invoicesRepository.count({ where: { companyId, status: InvoiceStatus.CANCELLED } }),
      this.invoicesRepository.count({
        where: {
          companyId,
          dueDate: LessThan(now),
          status: InvoiceStatus.SENT,
        },
      }),
      this.invoicesRepository.find({
        where: { companyId },
        select: ['total', 'amountDue', 'status'],
      }),
    ]);

    const totalAmount = invoices.reduce((sum: any, inv: any) => sum + (inv.total || 0), 0);
    const totalPaid = invoices
      .filter((inv: any) => inv.status === InvoiceStatus.PAID)
      .reduce((sum: any, inv: any) => sum + (inv.total || 0), 0);
    const totalDue = invoices
      .filter((inv: any) => inv.status === InvoiceStatus.SENT)
      .reduce((sum: any, inv: any) => sum + (inv.amountDue || 0), 0);

    return {
      total,
      draft,
      sent,
      paid,
      overdue,
      cancelled,
      totalAmount,
      totalPaid,
      totalDue,
    };
  }

  async generateForCustomer(
    customerId: number,
    planId: number,
    periodStart: Date,
    periodEnd: Date,
  ): Promise<Invoice> {
    const customer = await this.customersService.findOne(customerId);
    if (!customer) {
      throw new NotFoundException(`Customer #${customerId} not found`);
    }

    const plan = await this.plansService.findOne(planId);
    if (!plan) {
      throw new NotFoundException(`Plan #${planId} not found`);
    }

    const daysInPeriod = Math.ceil((periodEnd.getTime() - periodStart.getTime()) / (1000 * 60 * 60 * 24));
    const subtotal = plan.price * daysInPeriod;
    const tax = subtotal * (plan.taxRate / 100);

    const invoice = new Invoice();
    invoice.companyId = customer.company.id;
    invoice.company = customer.company;
    invoice.customerId = customer.id;
    invoice.customer = customer;
    invoice.plan = plan as any;
    invoice.number = this.generateInvoiceNumber(customer.company.id);
    invoice.subtotal = subtotal;
    invoice.tax = tax;
    invoice.discount = 0;
    invoice.dueDate = new Date(periodEnd.getTime() + 7 * 24 * 60 * 60 * 1000) as any; // 7 days grace
    invoice.notes = `Auto-generated for period ${periodStart.toISOString().split('T')[0]} to ${periodEnd.toISOString().split('T')[0]}` as any;
    invoice.status = InvoiceStatus.DRAFT;
    invoice.total = subtotal + tax;
    invoice.amountDue = subtotal + tax;

    const savedInvoice = await this.invoicesRepository.save(invoice);

    this.logger.log(`Auto-invoice generated: ${savedInvoice.number} for customer ${customerId}, period ${periodStart.toISOString().split('T')[0]} to ${periodEnd.toISOString().split('T')[0]}, amount: ${subtotal + tax}`);

    return savedInvoice;
  }

  async bulkGenerate(companyId: number): Promise<{ generated: number; errors: number; details: any[] }> {
    const company = await this.companiesService.findOne(companyId);
    if (!company) {
      throw new NotFoundException(`Company #${companyId} not found`);
    }

    const activePlans = await this.plansService.findActiveByCompany(companyId);
    const generated: any[] = [];
    const errors: any[] = [];

    for (const plan of activePlans) {
      for (const radiusUser of plan.radiusUsers || []) {
        try {
          const now = new Date();
          const periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
          const periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);

          const invoice = await this.generateForCustomer(
            radiusUser.customerId,
            plan.id,
            periodStart,
            periodEnd,
          );
          generated.push({
            invoiceId: invoice.id,
            invoiceNumber: invoice.number,
            customerId: radiusUser.customerId,
            planId: plan.id,
            amount: invoice.total,
          });
        } catch (error: any) {
          errors.push({
            customerId: radiusUser.customerId,
            planId: plan.id,
            error: error.message,
          });
        }
      }
    }

    return {
      generated: generated.length,
      errors: errors.length,
      details: generated,
    };
  }
}
