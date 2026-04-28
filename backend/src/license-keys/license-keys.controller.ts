import { Controller, Get, Post, Body, Param, Delete, Put, Query, ParseIntPipe, NotFoundException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiParam, ApiQuery, ApiResponse } from '@nestjs/swagger';
import { LicenseKeysService } from './license-keys.service';
import { CreateLicenseKeyDto } from './dto/create-license-key.dto';
import { UpdateLicenseKeyDto } from './dto/update-license-key.dto';
import { LicenseKey } from './entities/license-key.entity';
import { LicenseType } from '../companies/entities/license-type.enum';

@ApiTags('License Keys')
@ApiBearerAuth()
@Controller('license-keys')
export class LicenseKeysController {
  constructor(private readonly licenseKeysService: LicenseKeysService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new license key' })
  @ApiResponse({ status: 201, description: 'License key created', type: LicenseKey })
  @ApiResponse({ status: 400, description: 'Bad request' })
  async create(@Body() createLicenseKeyDto: CreateLicenseKeyDto): Promise<LicenseKey> {
    return this.licenseKeysService.create(createLicenseKeyDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all license keys' })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 10 })
  @ApiQuery({ name: 'type', required: false, enum: LicenseType })
  @ApiQuery({ name: 'isActive', required: false, type: Boolean })
  @ApiQuery({ name: 'companyId', required: false, type: Number })
  async findAll(
    @Query('page', new ParseIntPipe({ optional: true })) page?: number,
    @Query('limit', new ParseIntPipe({ optional: true })) limit?: number,
    @Query('type') type?: LicenseType,
    @Query('isActive') isActive?: boolean,
    @Query('companyId', new ParseIntPipe({ optional: true })) companyId?: number,
  ): Promise<{ data: LicenseKey[]; total: number; page: number; limit: number }> {
    return this.licenseKeysService.findAll(page, limit, type, isActive, companyId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a license key by ID' })
  @ApiParam({ name: 'id', type: Number })
  async findOne(@Param('id', ParseIntPipe) id: number): Promise<LicenseKey> {
    const licenseKey = await this.licenseKeysService.findOne(id);
    if (!licenseKey) {
      throw new NotFoundException(`License key #${id} not found`);
    }
    return licenseKey;
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update a license key' })
  @ApiParam({ name: 'id', type: Number })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateLicenseKeyDto: UpdateLicenseKeyDto,
  ): Promise<LicenseKey> {
    return this.licenseKeysService.update(id, updateLicenseKeyDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a license key' })
  @ApiParam({ name: 'id', type: Number })
  async remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
    return this.licenseKeysService.remove(id);
  }

  @Post('validate')
  @ApiOperation({ summary: 'Validate a license key' })
  @ApiResponse({ status: 200, description: 'License key validation result' })
  async validateKey(@Body('key') key: string): Promise<{ valid: boolean; message?: string }> {
    return this.licenseKeysService.validateKey(key);
  }

  @Post(':id/activate')
  @ApiOperation({ summary: 'Activate a license key' })
  @ApiParam({ name: 'id', type: Number })
  async activate(@Param('id', ParseIntPipe) id: number): Promise<LicenseKey> {
    return this.licenseKeysService.activate(id);
  }

  @Post(':id/deactivate')
  @ApiOperation({ summary: 'Deactivate a license key' })
  @ApiParam({ name: 'id', type: Number })
  async deactivate(@Param('id', ParseIntPipe) id: number): Promise<LicenseKey> {
    return this.licenseKeysService.deactivate(id);
  }

  @Post('generate')
  @ApiOperation({ summary: 'Generate a new license key' })
  @ApiQuery({ name: 'type', required: true, enum: LicenseType })
  @ApiQuery({ name: 'maxDevices', type: Number, example: 10 })
  @ApiQuery({ name: 'maxCustomers', type: Number, example: 1000 })
  @ApiQuery({ name: 'expiresInDays', type: Number, required: false, example: 30 })
  async generateKey(
    @Query('type') type: LicenseType,
    @Query('maxDevices', ParseIntPipe) maxDevices: number,
    @Query('maxCustomers', ParseIntPipe) maxCustomers: number,
    @Query('expiresInDays', new ParseIntPipe({ optional: true })) expiresInDays?: number,
  ): Promise<{ key: string; license: LicenseKey }> {
    return this.licenseKeysService.generateKey(type, maxDevices, maxCustomers, expiresInDays);
  }
}
