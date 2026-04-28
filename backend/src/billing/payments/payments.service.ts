import { Injectable, NotFoundException, Logger, forwardRef, Inject } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThan } from 'typeorm';
import { Payment, PaymentStatus, PaymentMethod } from './entities/payment.entity';
import { CompaniesService } from '../../companies/companies.service';
import { CustomersService } from '../../customers/customers.service';
import { InvoicesService } from '../invoices/invoices.service';
import { MpesaService } from '../../mpesa/mpesa.service';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { UpdatePaymentDto } from './dto/update-payment.dto';

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);

  constructor(
    @InjectRepository(Payment)
    private paymentsRepository: Repository<Payment>,
    private readonly companiesService: CompaniesService,
    private readonly customersService: CustomersService,
    @Inject(forwardRef(() => InvoicesService))
    private readonly invoicesService: InvoicesService,
    private readonly mpesaService: MpesaService,
  ) {}

  private generateTransactionId(): string {
    return `PAY-${Date.now().toString(36).toUpperCase()}`;
  }

  async create(createPaymentDto: CreatePaymentDto): Promise<Payment> {
    const company = await this.companiesService.findOne(createPaymentDto.companyId);
    if (!company) {
      throw new NotFoundException(`Company #${createPaymentDto.companyId} not found`);
    }

    const customer = await this.customersService.findOne(createPaymentDto.customerId);
    if (!customer) {
      throw new NotFoundException(`Customer #${createPaymentDto.customerId} not found`);
    }

    let invoice: any = null;
    if (createPaymentDto.invoiceId) {
      invoice = await this.invoicesService.findOne(createPaymentDto.invoiceId);
      if (!invoice) {
        throw new NotFoundException(`Invoice #${createPaymentDto.invoiceId} not found`);
      }
    }

    const payment = new Payment();
    payment.companyId = createPaymentDto.companyId;
    payment.company = company;
    payment.customerId = createPaymentDto.customerId;
    payment.customer = customer;
    payment.invoiceId = createPaymentDto.invoiceId as any;
    payment.invoice = invoice as any;
    payment.amount = createPaymentDto.amount;
    payment.method = createPaymentDto.method;
    payment.transactionId = createPaymentDto.transactionId || this.generateTransactionId();
    payment.externalId = createPaymentDto.externalId as any;
    payment.mpesaPhone = createPaymentDto.mpesaPhone as any;
    payment.mpesaRequestId = null as any;
    payment.mpesaResultCode = null as any;
    payment.mpesaResultDesc = null as any;
    payment.gatewayResponse = null as any;
    payment.status = createPaymentDto.status || PaymentStatus.PENDING;
    payment.notes = createPaymentDto.notes as any;

    const savedPayment = await this.paymentsRepository.save(payment);

    // Update customer balance if payment is completed
    if (savedPayment.status === PaymentStatus.COMPLETED && savedPayment.customer) {
      await this.customersService.updateBalance(
        savedPayment.customer.id,
        savedPayment.amount,
        true,
      );
    }

    // If invoice is provided and payment is completed, mark invoice as paid
    if (invoice && savedPayment.status === PaymentStatus.COMPLETED) {
      await this.invoicesService.markAsPaid(invoice.id, PaymentMethod[createPaymentDto.method], savedPayment.amount);
    }

    this.logger.log(`Payment created: ${savedPayment.transactionId} (ID: ${savedPayment.id}) for customer ${customer.id}, amount: ${createPaymentDto.amount}`);

    return savedPayment;
  }

  async createMpesaPayment(
    customerId: number,
    phone: string,
    amount: number,
    invoiceId?: number,
    accountReference?: string,
  ): Promise<{ payment: Payment; mpesaRequest: any }> {
    const customer = await this.customersService.findOne(customerId);
    if (!customer) {
      throw new NotFoundException(`Customer #${customerId} not found`);
    }

    const invoice = invoiceId ? await this.invoicesService.findOne(invoiceId) : null;

    // Create pending payment
    const payment = new Payment();
    payment.companyId = customer.company.id;
    payment.company = customer.company;
    payment.customerId = customer.id;
    payment.customer = customer;
    payment.invoiceId = invoiceId as any;
    payment.invoice = invoice as any;
    payment.amount = amount;
    payment.method = PaymentMethod.MPESA;
    payment.transactionId = this.generateTransactionId();
    payment.externalId = null as any;
    payment.mpesaPhone = phone;
    payment.status = PaymentStatus.PENDING;
    payment.notes = `M-Pesa STK Push initiated` as any;

    const savedPayment = await this.paymentsRepository.save(payment);

    // Call M-Pesa STK Push
    const mpesaRequest = await this.mpesaService.stkPush(
      phone,
      amount,
      accountReference || `Payment for ${customer.uuid}`,
      savedPayment.transactionId,
    );

    // Update payment with M-Pesa request details
    savedPayment.mpesaRequestId = mpesaRequest.requestId as any;
    await this.paymentsRepository.save(savedPayment);

    this.logger.log(`M-Pesa STK Push initiated: ${mpesaRequest.requestId} for payment ${savedPayment.transactionId}`);

    return { payment: savedPayment, mpesaRequest };
  }

  async findAll(
    companyId?: number,
    customerId?: number,
    invoiceId?: number,
    method?: PaymentMethod,
    status?: PaymentStatus,
  ): Promise<Payment[]> {
    const options: any = {
      relations: ['company', 'customer', 'invoice'],
      order: { createdAt: 'DESC' },
    };

    const where: any[] = [];
    if (companyId) where.push({ companyId });
    if (customerId) where.push({ customerId });
    if (invoiceId) where.push({ invoiceId });
    if (method) where.push({ method });
    if (status) where.push({ status });

    if (where.length > 0) {
      options.where = where.length === 1 ? where[0] : { AND: where };
    }

    return this.paymentsRepository.find(options);
  }

  async findOne(id: number): Promise<Payment | null> {
    return this.paymentsRepository.findOne({
      where: { id },
      relations: ['company', 'customer', 'invoice'],
    });
  }

  async findByTransactionId(transactionId: string): Promise<Payment | null> {
    return this.paymentsRepository.findOne({
      where: { transactionId },
      relations: ['company', 'customer', 'invoice'],
    });
  }

  async findByExternalId(externalId: string): Promise<Payment | null> {
    return this.paymentsRepository.findOne({
      where: { externalId },
      relations: ['company', 'customer', 'invoice'],
    });
  }

  async findByInvoice(invoiceId: number): Promise<Payment[]> {
    return this.paymentsRepository.find({
      where: { invoiceId },
      relations: ['company', 'customer', 'invoice'],
      order: { createdAt: 'DESC' },
    });
  }

  async findByCustomer(customerId: number): Promise<Payment[]> {
    return this.paymentsRepository.find({
      where: { customerId },
      relations: ['company', 'customer', 'invoice'],
      order: { createdAt: 'DESC' },
    });
  }

  async update(id: number, updatePaymentDto: UpdatePaymentDto): Promise<Payment> {
    const payment = await this.findOne(id);
    if (!payment) {
      throw new NotFoundException(`Payment #${id} not found`);
    }

    const dto = updatePaymentDto as any;

    if (dto.invoiceId !== undefined) {
      const invoice = await this.invoicesService.findOne(dto.invoiceId);
      if (invoice) {
        payment.invoiceId = dto.invoiceId;
        payment.invoice = invoice as any;
      }
      delete dto.invoiceId;
    }

    delete dto.companyId;
    delete dto.customerId;

    Object.assign(payment, dto);

    await this.paymentsRepository.save(payment);
    return payment;
  }

  async remove(id: number): Promise<void> {
    const payment = await this.findOne(id);
    if (!payment) {
      throw new NotFoundException(`Payment #${id} not found`);
    }

    await this.paymentsRepository.delete(id);
    this.logger.log(`Payment deleted: ${payment.transactionId} (ID: ${id})`);
  }

  async markAsCompleted(id: number, externalId?: string, gatewayResponse?: any): Promise<Payment> {
    const payment = await this.findOne(id);
    if (!payment) {
      throw new NotFoundException(`Payment #${id} not found`);
    }

    payment.status = PaymentStatus.COMPLETED;
    payment.externalId = externalId as any;
    payment.gatewayResponse = gatewayResponse as any;
    payment.updatedAt = new Date() as any;

    await this.paymentsRepository.save(payment);

    // Update customer balance
    if (payment.customer) {
      await this.customersService.updateBalance(
        payment.customer.id,
        payment.amount,
        true,
      );
    }

    // Mark invoice as paid if fully paid
    if (payment.invoiceId && payment.invoice) {
      const invoice = await this.invoicesService.findOne(payment.invoiceId);
      if (invoice) {
        const totalPaid = (await this.findByInvoice(invoice.id)).reduce(
          (sum, p) => sum + p.amount,
          0,
        );
        if (totalPaid >= invoice.amountDue) {
          await this.invoicesService.markAsPaid(invoice.id, PaymentMethod[payment.method]);
        }
      }
    }

    this.logger.log(`Payment marked as completed: ${payment.transactionId} (ID: ${id})`);
    return payment;
  }

  async markAsFailed(id: number, errorMessage?: string, gatewayResponse?: any): Promise<Payment> {
    const payment = await this.findOne(id);
    if (!payment) {
      throw new NotFoundException(`Payment #${id} not found`);
    }

    payment.status = PaymentStatus.FAILED;
    payment.mpesaResultCode = '1' as any;
    payment.mpesaResultDesc = errorMessage as any;
    payment.gatewayResponse = gatewayResponse as any;
    payment.updatedAt = new Date() as any;

    await this.paymentsRepository.save(payment);

    this.logger.warn(`Payment marked as failed: ${payment.transactionId} (ID: ${id}) - ${errorMessage}`);
    return payment;
  }

  async reverse(id: number, reason?: string): Promise<Payment> {
    const payment = await this.findOne(id);
    if (!payment) {
      throw new NotFoundException(`Payment #${id} not found`);
    }

    payment.status = PaymentStatus.REVERSED;
    payment.notes = payment.notes
      ? `${payment.notes}\nReversed: ${reason || 'No reason provided'}`
      : `Reversed: ${reason || 'No reason provided'}` as any;
    payment.updatedAt = new Date() as any;

    // Refund customer balance
    if (payment.customer) {
      await this.customersService.updateBalance(
        payment.customer.id,
        -payment.amount,
        true,
      );
    }

    await this.paymentsRepository.save(payment);

    this.logger.warn(`Payment reversed: ${payment.transactionId} (ID: ${id}) - Reason: ${reason}`);
    return payment;
  }

  async confirmMpesaPayment(externalId: string, requestId: string): Promise<Payment> {
    const payment = await this.findByExternalId(externalId);
    if (!payment) {
      throw new NotFoundException(`Payment with external ID ${externalId} not found`);
    }

    // Verify with M-Pesa API
    const verification = await this.mpesaService.verifyPayment(requestId);

    if (verification.success) {
      return this.markAsCompleted(
        payment.id,
        externalId,
        verification.gatewayResponse,
      );
    } else {
      return this.markAsFailed(
        payment.id,
        verification.errorMessage,
        verification.gatewayResponse,
      );
    }
  }

  async getCustomerPaymentHistory(customerId: number): Promise<Payment[]> {
    return this.paymentsRepository.find({
      where: { customerId },
      relations: ['company', 'customer', 'invoice'],
      order: { createdAt: 'DESC' },
    });
  }

  async getStats(companyId: number): Promise<{
    total: number;
    pending: number;
    completed: number;
    failed: number;
    reversed: number;
    totalAmount: number;
    mpesaCount: number;
    mpesaAmount: number;
    cashCount: number;
    cashAmount: number;
  }> {
    const [total, pending, completed, failed, reversed, allPayments, mpesaPayments, cashPayments] = await Promise.all([
      this.paymentsRepository.count({ where: { companyId } }),
      this.paymentsRepository.count({ where: { companyId, status: PaymentStatus.PENDING } }),
      this.paymentsRepository.count({ where: { companyId, status: PaymentStatus.COMPLETED } }),
      this.paymentsRepository.count({ where: { companyId, status: PaymentStatus.FAILED } }),
      this.paymentsRepository.count({ where: { companyId, status: PaymentStatus.REVERSED } }),
      this.paymentsRepository.find({
        where: { companyId },
        select: ['amount', 'method'],
      }),
      this.paymentsRepository.find({
        where: { companyId, method: PaymentMethod.MPESA, status: PaymentStatus.COMPLETED },
        select: ['amount'],
      }),
      this.paymentsRepository.find({
        where: { companyId, method: PaymentMethod.CASH, status: PaymentStatus.COMPLETED },
        select: ['amount'],
      }),
    ]);

    const totalAmount = allPayments.reduce((sum: any, p: any) => sum + (p.amount || 0), 0);
    const mpesaAmount = mpesaPayments.reduce((sum: any, p: any) => sum + (p.amount || 0), 0);
    const cashAmount = cashPayments.reduce((sum: any, p: any) => sum + (p.amount || 0), 0);

    return {
      total,
      pending,
      completed,
      failed,
      reversed,
      totalAmount,
      mpesaCount: mpesaPayments.length,
      mpesaAmount,
      cashCount: cashPayments.length,
      cashAmount,
    };
  }

  async reconicileMpesa(days: number = 7): Promise<{ matched: number; unmatched: number; discrepancies: any[] }> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    const mpesaPayments = await this.paymentsRepository.find({
      where: {
        method: PaymentMethod.MPESA,
        createdAt: MoreThan(cutoffDate),
      },
    });

    const matched: any[] = [];
    const unmatched: any[] = [];
    const discrepancies: any[] = [];

    for (const payment of mpesaPayments) {
      try {
        const verification = await this.mpesaService.verifyPayment(payment.mpesaRequestId as any);
        
        if (verification.success) {
          if (payment.status === PaymentStatus.COMPLETED && verification.gatewayResponse?.Amount === payment.amount) {
            matched.push(payment);
          } else if (payment.status !== PaymentStatus.COMPLETED) {
            // Auto-complete if M-Pesa confirms but we haven't marked it
            await this.markAsCompleted(payment.id, payment.externalId, verification.gatewayResponse);
            matched.push(payment);
          } else {
            discrepancies.push({
              paymentId: payment.id,
              transactionId: payment.transactionId,
              expectedAmount: payment.amount,
              mpesaAmount: verification.gatewayResponse?.Amount,
            });
          }
        } else {
          unmatched.push(payment);
        }
      } catch (error) {
        unmatched.push(payment);
      }
    }

    return {
      matched: matched.length,
      unmatched: unmatched.length,
      discrepancies,
    };
  }
}
