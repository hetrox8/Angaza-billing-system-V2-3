import { Controller, Get, Post, Body, Param, Put, Delete, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery, ApiParam } from '@nestjs/swagger';
import { PaymentsService } from './payments.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { PaymentStatus, PaymentMethod } from './entities/payment.entity';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { UpdatePaymentDto } from './dto/update-payment.dto';

@ApiTags('Payments')
@Controller('payments')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new payment' })
  create(@Body() createPaymentDto: CreatePaymentDto) {
    return this.paymentsService.create(createPaymentDto);
  }

  @Post('mpesa')
  @ApiOperation({ summary: 'Initiate M-Pesa STK Push payment' })
  @ApiQuery({ name: 'customerId', type: Number })
  @ApiQuery({ name: 'phone', type: String })
  @ApiQuery({ name: 'amount', type: Number })
  @ApiQuery({ name: 'invoiceId', required: false, type: Number })
  @ApiQuery({ name: 'accountReference', required: false, type: String })
  async initiateMpesa(
    @Query('customerId') customerId: number,
    @Query('phone') phone: string,
    @Query('amount') amount: number,
    @Query('invoiceId') invoiceId?: number,
    @Query('accountReference') accountReference?: string,
  ) {
    return this.paymentsService.createMpesaPayment(
      customerId,
      phone,
      amount,
      invoiceId,
      accountReference,
    );
  }

  @Get()
  @ApiOperation({ summary: 'List all payments' })
  @ApiQuery({ name: 'companyId', required: false, type: Number })
  @ApiQuery({ name: 'customerId', required: false, type: Number })
  @ApiQuery({ name: 'invoiceId', required: false, type: Number })
  @ApiQuery({ name: 'method', required: false, enum: PaymentMethod })
  @ApiQuery({ name: 'status', required: false, enum: PaymentStatus })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async findAll(
    @Query('companyId') companyId?: number,
    @Query('customerId') customerId?: number,
    @Query('invoiceId') invoiceId?: number,
    @Query('method') method?: PaymentMethod,
    @Query('status') status?: PaymentStatus,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    const payments = await this.paymentsService.findAll(
      companyId,
      customerId,
      invoiceId,
      method,
      status,
    );

    const pageNum = page || 1;
    const limitNum = limit || 100;
    const start = (pageNum - 1) * limitNum;
    const end = start + limitNum;
    const paginated = payments.slice(start, end);

    return {
      data: paginated,
      total: payments.length,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(payments.length / limitNum),
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a payment by ID' })
  @ApiParam({ name: 'id', type: Number })
  findOne(@Param('id') id: string) {
    return this.paymentsService.findOne(+id);
  }

  @Get('transaction/:transactionId')
  @ApiOperation({ summary: 'Get a payment by transaction ID' })
  @ApiParam({ name: 'transactionId', type: String })
  findByTransactionId(@Param('transactionId') transactionId: string) {
    return this.paymentsService.findByTransactionId(transactionId);
  }

  @Get('external/:externalId')
  @ApiOperation({ summary: 'Get a payment by external ID (M-Pesa receipt)' })
  @ApiParam({ name: 'externalId', type: String })
  findByExternalId(@Param('externalId') externalId: string) {
    return this.paymentsService.findByExternalId(externalId);
  }

  @Get('invoice/:invoiceId')
  @ApiOperation({ summary: 'Get payments for an invoice' })
  @ApiParam({ name: 'invoiceId', type: Number })
  findByInvoice(@Param('invoiceId') invoiceId: string) {
    return this.paymentsService.findByInvoice(+invoiceId);
  }

  @Get('customer/:customerId')
  @ApiOperation({ summary: 'Get all payments for a customer' })
  @ApiParam({ name: 'customerId', type: Number })
  findByCustomer(@Param('customerId') customerId: string) {
    return this.paymentsService.findByCustomer(+customerId);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update a payment' })
  @ApiParam({ name: 'id', type: Number })
  update(@Param('id') id: string, @Body() updatePaymentDto: UpdatePaymentDto) {
    return this.paymentsService.update(+id, updatePaymentDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a payment' })
  @ApiParam({ name: 'id', type: Number })
  remove(@Param('id') id: string) {
    return this.paymentsService.remove(+id);
  }

  @Post(':id/complete')
  @ApiOperation({ summary: 'Mark a payment as completed' })
  @ApiParam({ name: 'id', type: Number })
  @ApiQuery({ name: 'externalId', required: false, type: String })
  markAsCompleted(
    @Param('id') id: string,
    @Query('externalId') externalId?: string,
    @Body() body?: { gatewayResponse: any },
  ) {
    return this.paymentsService.markAsCompleted(+id, externalId, body?.gatewayResponse);
  }

  @Post(':id/fail')
  @ApiOperation({ summary: 'Mark a payment as failed' })
  @ApiParam({ name: 'id', type: Number })
  @ApiQuery({ name: 'errorMessage', required: false, type: String })
  markAsFailed(
    @Param('id') id: string,
    @Query('errorMessage') errorMessage?: string,
    @Body() body?: { gatewayResponse: any },
  ) {
    return this.paymentsService.markAsFailed(+id, errorMessage, body?.gatewayResponse);
  }

  @Post(':id/reverse')
  @ApiOperation({ summary: 'Reverse a payment' })
  @ApiParam({ name: 'id', type: Number })
  @ApiQuery({ name: 'reason', required: false, type: String })
  reverse(@Param('id') id: string, @Query('reason') reason?: string) {
    return this.paymentsService.reverse(+id, reason);
  }

  @Post('confirm-mpesa')
  @ApiOperation({ summary: 'Confirm M-Pesa payment via callback' })
  @ApiQuery({ name: 'externalId', type: String })
  @ApiQuery({ name: 'requestId', type: String })
  confirmMpesa(
    @Query('externalId') externalId: string,
    @Query('requestId') requestId: string,
  ) {
    return this.paymentsService.confirmMpesaPayment(externalId, requestId);
  }

  @Get('customer/:customerId/history')
  @ApiOperation({ summary: 'Get payment history for a customer' })
  @ApiParam({ name: 'customerId', type: Number })
  getCustomerHistory(@Param('customerId') customerId: string) {
    return this.paymentsService.getCustomerPaymentHistory(+customerId);
  }

  @Get('stats/:companyId')
  @ApiOperation({ summary: 'Get payment statistics for a company' })
  @ApiParam({ name: 'companyId', type: Number })
  getStats(@Param('companyId') companyId: string) {
    return this.paymentsService.getStats(+companyId);
  }

  @Post('reconcile-mpesa')
  @ApiOperation({ summary: 'Reconcile M-Pesa payments' })
  @ApiQuery({ name: 'days', required: false, type: Number, description: 'Lookback days (default: 7)' })
  reconcileMpesa(@Query('days') days?: number) {
    return this.paymentsService.reconicileMpesa(days || 7);
  }
}
