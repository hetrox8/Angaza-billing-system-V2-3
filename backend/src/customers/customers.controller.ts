import { Controller, Get, Post, Body, Param, Put, Delete, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery, ApiParam } from '@nestjs/swagger';
import { CustomersService } from './customers.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CustomerStatus } from './entities/customer.entity';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';

@ApiTags('Customers')
@Controller('customers')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class CustomersController {
  constructor(private readonly customersService: CustomersService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new customer' })
  create(@Body() createCustomerDto: CreateCustomerDto) {
    return this.customersService.create(createCustomerDto);
  }

  @Get()
  @ApiOperation({ summary: 'List all customers' })
  @ApiQuery({ name: 'companyId', required: false, type: Number })
  @ApiQuery({ name: 'status', required: false, enum: CustomerStatus })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async findAll(
    @Query('companyId') companyId?: number,
    @Query('status') status?: CustomerStatus,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    let customers = await this.customersService.findAll(companyId);

    if (status) {
      customers = customers.filter((c) => c.status === status);
    }

    // Pagination
    const pageNum = page || 1;
    const limitNum = limit || 100;
    const start = (pageNum - 1) * limitNum;
    const end = start + limitNum;

    const paginated = customers.slice(start, end);

    return {
      data: paginated,
      total: customers.length,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(customers.length / limitNum),
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a customer by ID' })
  @ApiParam({ name: 'id', type: Number })
  findOne(@Param('id') id: string) {
    return this.customersService.findOne(+id);
  }

  @Get('phone/:phone')
  @ApiOperation({ summary: 'Get customer by phone number' })
  @ApiParam({ name: 'phone', type: String })
  @ApiQuery({ name: 'companyId', required: true, type: Number })
  findByPhone(@Param('phone') phone: string, @Query('companyId') companyId: number) {
    return this.customersService.findByPhone(phone, companyId);
  }

  @Get('email/:email')
  @ApiOperation({ summary: 'Get customer by email' })
  @ApiParam({ name: 'email', type: String })
  @ApiQuery({ name: 'companyId', required: true, type: Number })
  findByEmail(@Param('email') email: string, @Query('companyId') companyId: number) {
    return this.customersService.findByEmail(email, companyId);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update a customer' })
  @ApiParam({ name: 'id', type: Number })
  update(@Param('id') id: string, @Body() updateCustomerDto: UpdateCustomerDto) {
    return this.customersService.update(+id, updateCustomerDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a customer' })
  @ApiParam({ name: 'id', type: Number })
  remove(@Param('id') id: string) {
    return this.customersService.remove(+id);
  }

  @Post(':id/suspend')
  @ApiOperation({ summary: 'Suspend a customer' })
  @ApiParam({ name: 'id', type: Number })
  suspend(
    @Param('id') id: string,
    @Body() body: { reason: string },
  ) {
    return this.customersService.suspend(+id, body.reason);
  }

  @Post(':id/reactivate')
  @ApiOperation({ summary: 'Reactivate a customer' })
  @ApiParam({ name: 'id', type: Number })
  reactivate(@Param('id') id: string) {
    return this.customersService.reactivate(+id);
  }

  @Post(':id/balance')
  @ApiOperation({ summary: 'Update customer balance' })
  @ApiParam({ name: 'id', type: Number })
  updateBalance(
    @Param('id') id: string,
    @Body() body: { amount: number; increment?: boolean },
  ) {
    return this.customersService.updateBalance(
      +id,
      body.amount,
      body.increment !== false,
    );
  }

  @Get(':id/balance')
  @ApiOperation({ summary: 'Get customer balance and billing info' })
  @ApiParam({ name: 'id', type: Number })
  async getBalance(@Param('id') id: string) {
    const customer = await this.customersService.findOne(+id);
    if (!customer) {
      return { error: 'Customer not found' };
    }

    const invoices = customer.invoices || [];
    const payments = customer.payments || [];

    const totalInvoiced = invoices.reduce((sum, inv) => sum + (inv.total || 0), 0);
    const totalPaid = payments.reduce((sum, pay) => sum + (pay.amount || 0), 0);

    return {
      customerId: customer.id,
      balance: customer.balance,
      creditLimit: customer.creditLimit,
      totalInvoiced,
      totalPaid,
      outstanding: totalInvoiced - totalPaid,
      invoicesCount: invoices.length,
      paymentsCount: payments.length,
    };
  }
}
