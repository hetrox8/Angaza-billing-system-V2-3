import { Controller, Get, Post, Body, Param, Delete, Put, Query, ParseIntPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiParam, ApiQuery, ApiResponse } from '@nestjs/swagger';
import { VouchersService } from './vouchers.service';
import { CreateVoucherDto } from './dto/create-voucher.dto';
import { UpdateVoucherDto } from './dto/update-voucher.dto';
import { Voucher } from './entities/voucher.entity';

@ApiTags('Vouchers')
@ApiBearerAuth()
@Controller('vouchers')
export class VouchersController {
  constructor(private readonly vouchersService: VouchersService) {}

  @Post()
  @ApiOperation({ summary: 'Create voucher(s)' })
  @ApiResponse({ type: [Voucher], description: 'Created vouchers' })
  async create(@Body() createVoucherDto: CreateVoucherDto): Promise<Voucher[]> {
    return this.vouchersService.create(createVoucherDto);
  }

  @Get()
  @ApiOperation({ summary: 'List all vouchers' })
  @ApiQuery({ name: 'companyId', required: false, type: Number })
  @ApiQuery({ name: 'planId', required: false, type: Number })
  @ApiQuery({ name: 'batchName', required: false, type: String })
  @ApiQuery({ name: 'isUsed', required: false, type: Boolean })
  @ApiResponse({ type: [Voucher], description: 'List of vouchers' })
  async findAll(
    @Query('companyId') companyId?: number,
    @Query('planId') planId?: number,
    @Query('batchName') batchName?: string,
    @Query('isUsed') isUsed?: boolean,
  ): Promise<Voucher[]> {
    return this.vouchersService.findAll(companyId, planId, batchName, isUsed);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get voucher by ID' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({ type: Voucher, description: 'Voucher details' })
  async findOne(@Param('id', ParseIntPipe) id: number): Promise<Voucher | null> {
    return this.vouchersService.findOne(id);
  }

  @Get('code/:code')
  @ApiOperation({ summary: 'Get voucher by code' })
  @ApiParam({ name: 'code', type: String })
  @ApiResponse({ type: Voucher, description: 'Voucher details' })
  async findByCode(@Param('code') code: string): Promise<Voucher | null> {
    return this.vouchersService.findByCode(code);
  }

  @Get('serial/:serialNumber')
  @ApiOperation({ summary: 'Get voucher by serial number' })
  @ApiParam({ name: 'serialNumber', type: String })
  @ApiResponse({ type: Voucher, description: 'Voucher details' })
  async findBySerialNumber(@Param('serialNumber') serialNumber: string): Promise<Voucher | null> {
    return this.vouchersService.findBySerialNumber(serialNumber);
  }

  @Get('batch/:batchName')
  @ApiOperation({ summary: 'Get vouchers by batch' })
  @ApiParam({ name: 'batchName', type: String })
  @ApiQuery({ name: 'companyId', required: false, type: Number })
  @ApiResponse({ type: [Voucher], description: 'List of vouchers in batch' })
  async findByBatch(
    @Param('batchName') batchName: string,
    @Query('companyId') companyId?: number,
  ): Promise<Voucher[]> {
    return this.vouchersService.findByBatch(batchName, companyId);
  }

  @Get('unused')
  @ApiOperation({ summary: 'Get unused vouchers' })
  @ApiQuery({ name: 'companyId', required: false, type: Number })
  @ApiQuery({ name: 'planId', required: false, type: Number })
  @ApiResponse({ type: [Voucher], description: 'List of unused vouchers' })
  async findUnused(
    @Query('companyId') companyId?: number,
    @Query('planId') planId?: number,
  ): Promise<Voucher[]> {
    return this.vouchersService.findUnused(companyId, planId);
  }

  @Get('expiring-soon')
  @ApiOperation({ summary: 'Get vouchers expiring soon' })
  @ApiQuery({ name: 'days', required: false, type: Number, description: 'Days until expiry' })
  @ApiQuery({ name: 'companyId', required: false, type: Number })
  @ApiResponse({ type: [Voucher], description: 'List of expiring vouchers' })
  async findExpiringSoon(
    @Query('days') days: number = 7,
    @Query('companyId') companyId?: number,
  ): Promise<Voucher[]> {
    return this.vouchersService.findExpiringSoon(days, companyId);
  }

  @Get('-expired')
  @ApiOperation({ summary: 'Get expired vouchers' })
  @ApiQuery({ name: 'companyId', required: false, type: Number })
  @ApiResponse({ type: [Voucher], description: 'List of expired vouchers' })
  async findExpired(@Query('companyId') companyId?: number): Promise<Voucher[]> {
    return this.vouchersService.findExpired(companyId);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update voucher' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({ type: Voucher, description: 'Updated voucher' })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateVoucherDto: UpdateVoucherDto,
  ): Promise<Voucher> {
    return this.vouchersService.update(id, updateVoucherDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete voucher' })
  @ApiParam({ name: 'id', type: Number })
  async remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
    return this.vouchersService.remove(id);
  }

  @Post('redeem')
  @ApiOperation({ summary: 'Redeem voucher' })
  @ApiResponse({ description: 'Redeem result' })
  async redeem(
    @Body('code') code: string,
    @Body('customerId') customerId: number,
    @Body('radiusUserId') radiusUserId?: number,
  ): Promise<{ success: boolean; voucher?: Voucher; error?: string }> {
    return this.vouchersService.redeem(code, customerId, radiusUserId);
  }

  @Post('bulk-generate')
  @ApiOperation({ summary: 'Bulk generate vouchers' })
  @ApiResponse({ description: 'Bulk generation result' })
  async bulkGenerate(
    @Body('companyId') companyId: number,
    @Body('planId') planId: number,
    @Body('count') count: number,
    @Body('batchName') batchName?: string,
    @Body('expiryDays') expiryDays?: number,
    @Body('createdById') createdById?: number,
  ): Promise<{ generated: number; vouchers: Voucher[] }> {
    return this.vouchersService.bulkGenerate(
      companyId,
      planId,
      count,
      batchName,
      expiryDays,
      createdById,
    );
  }

  @Post('validate')
  @ApiOperation({ summary: 'Validate voucher code' })
  @ApiResponse({ description: 'Validation result' })
  async validate(@Body('code') code: string): Promise<{ valid: boolean; voucher?: Voucher; error?: string }> {
    return this.vouchersService.validate(code);
  }

  @Get('stats/:companyId')
  @ApiOperation({ summary: 'Get voucher statistics' })
  @ApiParam({ name: 'companyId', type: Number })
  @ApiResponse({ description: 'Voucher statistics' })
  async getStats(@Param('companyId', ParseIntPipe) companyId: number): Promise<any> {
    return this.vouchersService.getStats(companyId);
  }
}
