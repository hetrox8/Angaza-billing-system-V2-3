import { Controller, Get, Post, Body, Param, Put, Delete, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery, ApiParam } from '@nestjs/swagger';
import { InvoicesService } from './invoices.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { InvoiceStatus } from './entities/invoice.entity';
import { CreateInvoiceDto } from './dto/create-invoice.dto';
import { UpdateInvoiceDto } from './dto/update-invoice.dto';

@ApiTags('Invoices')
@Controller('invoices')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class InvoicesController {
  constructor(private readonly invoicesService: InvoicesService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new invoice' })
  create(@Body() createInvoiceDto: CreateInvoiceDto) {
    return this.invoicesService.create(createInvoiceDto);
  }

  @Get()
  @ApiOperation({ summary: 'List all invoices' })
  @ApiQuery({ name: 'companyId', required: false, type: Number })
  @ApiQuery({ name: 'customerId', required: false, type: Number })
  @ApiQuery({ name: 'status', required: false, enum: InvoiceStatus })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async findAll(
    @Query('companyId') companyId?: number,
    @Query('customerId') customerId?: number,
    @Query('status') status?: InvoiceStatus,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    const invoices = await this.invoicesService.findAll(companyId, customerId, status);
    
    const pageNum = page || 1;
    const limitNum = limit || 100;
    const start = (pageNum - 1) * limitNum;
    const end = start + limitNum;
    const paginated = invoices.slice(start, end);

    return {
      data: paginated,
      total: invoices.length,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(invoices.length / limitNum),
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get an invoice by ID' })
  @ApiParam({ name: 'id', type: Number })
  findOne(@Param('id') id: string) {
    return this.invoicesService.findOne(+id);
  }

  @Get('number/:number')
  @ApiOperation({ summary: 'Get an invoice by number' })
  @ApiParam({ name: 'number', type: String })
  findByNumber(@Param('number') number: string) {
    return this.invoicesService.findByNumber(number);
  }

  @Get('customer/:customerId')
  @ApiOperation({ summary: 'Get all invoices for a customer' })
  @ApiParam({ name: 'customerId', type: Number })
  findByCustomer(@Param('customerId') customerId: string) {
    return this.invoicesService.findByCustomer(+customerId);
  }

  @Get('overdue/:companyId')
  @ApiOperation({ summary: 'Get all overdue invoices for a company' })
  @ApiParam({ name: 'companyId', type: Number })
  findOverdue(@Param('companyId') companyId: string) {
    return this.invoicesService.findOverdue(+companyId);
  }

  @Get('unpaid/:companyId')
  @ApiOperation({ summary: 'Get all unpaid invoices for a company' })
  @ApiParam({ name: 'companyId', type: Number })
  findUnpaid(@Param('companyId') companyId: string) {
    return this.invoicesService.findUnpaid(+companyId);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update an invoice' })
  @ApiParam({ name: 'id', type: Number })
  update(@Param('id') id: string, @Body() updateInvoiceDto: UpdateInvoiceDto) {
    return this.invoicesService.update(+id, updateInvoiceDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete an invoice' })
  @ApiParam({ name: 'id', type: Number })
  remove(@Param('id') id: string) {
    return this.invoicesService.remove(+id);
  }

  @Post(':id/send')
  @ApiOperation({ summary: 'Mark an invoice as sent' })
  @ApiParam({ name: 'id', type: Number })
  send(@Param('id') id: string) {
    return this.invoicesService.send(+id);
  }

  @Post(':id/pay')
  @ApiOperation({ summary: 'Mark an invoice as paid' })
  @ApiParam({ name: 'id', type: Number })
  @ApiQuery({ name: 'paymentMethod', required: false, type: String })
  @ApiQuery({ name: 'amount', required: false, type: Number })
  markAsPaid(
    @Param('id') id: string,
    @Query('paymentMethod') paymentMethod?: string,
    @Query('amount') amount?: number,
  ) {
    return this.invoicesService.markAsPaid(+id, paymentMethod, amount);
  }

  @Post(':id/cancel')
  @ApiOperation({ summary: 'Cancel an invoice' })
  @ApiParam({ name: 'id', type: Number })
  @ApiQuery({ name: 'reason', required: false, type: String })
  cancel(@Param('id') id: string, @Query('reason') reason?: string) {
    return this.invoicesService.cancel(+id, reason);
  }

  @Get('customer/:customerId/balance')
  @ApiOperation({ summary: 'Get customer invoice balance' })
  @ApiParam({ name: 'customerId', type: Number })
  getCustomerBalance(@Param('customerId') customerId: string) {
    return this.invoicesService.getCustomerBalance(+customerId);
  }

  @Get('stats/:companyId')
  @ApiOperation({ summary: 'Get invoice statistics for a company' })
  @ApiParam({ name: 'companyId', type: Number })
  getStats(@Param('companyId') companyId: string) {
    return this.invoicesService.getStats(+companyId);
  }

  @Post('generate/:customerId/:planId')
  @ApiOperation({ summary: 'Generate invoice for customer and plan' })
  @ApiParam({ name: 'customerId', type: Number })
  @ApiParam({ name: 'planId', type: Number })
  @ApiQuery({ name: 'periodStart', type: String, description: 'ISO date' })
  @ApiQuery({ name: 'periodEnd', type: String, description: 'ISO date' })
  generateForCustomer(
    @Param('customerId') customerId: string,
    @Param('planId') planId: string,
    @Query('periodStart') periodStart: string,
    @Query('periodEnd') periodEnd: string,
  ) {
    return this.invoicesService.generateForCustomer(
      +customerId,
      +planId,
      new Date(periodStart),
      new Date(periodEnd),
    );
  }

  @Post('bulk-generate/:companyId')
  @ApiOperation({ summary: 'Bulk generate invoices for all active customers in a company' })
  @ApiParam({ name: 'companyId', type: Number })
  bulkGenerate(@Param('companyId') companyId: string) {
    return this.invoicesService.bulkGenerate(+companyId);
  }
}
