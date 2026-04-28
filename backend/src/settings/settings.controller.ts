import { Controller, Get, Post, Body, Param, Delete, Put, Query, ParseIntPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiParam, ApiQuery, ApiResponse } from '@nestjs/swagger';
import { SettingsService } from './settings.service';
import { CreateSettingDto } from './dto/create-setting.dto';
import { UpdateSettingDto } from './dto/update-setting.dto';
import { Setting } from './entities/setting.entity';

@ApiTags('Settings')
@ApiBearerAuth()
@Controller('settings')
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  @Post()
  @ApiOperation({ summary: 'Create or update setting' })
  @ApiResponse({ type: Setting, description: 'Created or updated setting' })
  async create(@Body() createSettingDto: CreateSettingDto): Promise<Setting> {
    return this.settingsService.create(createSettingDto);
  }

  @Get()
  @ApiOperation({ summary: 'List all settings' })
  @ApiQuery({ name: 'companyId', required: false, type: Number })
  @ApiResponse({ type: [Setting], description: 'List of settings' })
  async findAll(@Query('companyId') companyId?: number): Promise<Setting[]> {
    return this.settingsService.findAll(companyId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get setting by ID' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({ type: Setting, description: 'Setting details' })
  async findOne(@Param('id', ParseIntPipe) id: number): Promise<Setting | null> {
    return this.settingsService.findOne(id);
  }

  @Get('key/:key')
  @ApiOperation({ summary: 'Get setting by key' })
  @ApiParam({ name: 'key', type: String })
  @ApiQuery({ name: 'companyId', required: false, type: Number })
  @ApiResponse({ type: Setting, description: 'Setting details' })
  async findByKey(
    @Param('key') key: string,
    @Query('companyId') companyId?: number,
  ): Promise<Setting | null> {
    return this.settingsService.findByKey(key, companyId);
  }

  @Get('value/:key')
  @ApiOperation({ summary: 'Get setting value by key' })
  @ApiParam({ name: 'key', type: String })
  @ApiQuery({ name: 'companyId', required: false, type: Number })
  @ApiQuery({ name: 'defaultValue', required: false, description: 'Default value if not found' })
  @ApiResponse({ description: 'Setting value' })
  async getValue(
    @Param('key') key: string,
    @Query('companyId') companyId?: number,
    @Query('defaultValue') defaultValue?: any,
  ): Promise<any> {
    const parsedDefault = defaultValue ? JSON.parse(defaultValue) : null;
    return this.settingsService.getValue(key, companyId, parsedDefault);
  }

  @Get('all/:companyId')
  @ApiOperation({ summary: 'Get all settings as key-value pairs' })
  @ApiParam({ name: 'companyId', type: Number })
  @ApiResponse({ description: 'All settings as key-value object' })
  async getAllValues(@Param('companyId', ParseIntPipe) companyId: number): Promise<Record<string, any>> {
    return this.settingsService.getAllValues(companyId);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update setting' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({ type: Setting, description: 'Updated setting' })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateSettingDto: UpdateSettingDto,
  ): Promise<Setting> {
    return this.settingsService.update(id, updateSettingDto);
  }

  @Put('key/:key')
  @ApiOperation({ summary: 'Update setting by key' })
  @ApiParam({ name: 'key', type: String })
  @ApiQuery({ name: 'companyId', required: false, type: Number })
  @ApiResponse({ type: Setting, description: 'Updated setting' })
  async updateByKey(
    @Param('key') key: string,
    @Body('value') value: any,
    @Query('companyId') companyId?: number,
  ): Promise<Setting | null> {
    return this.settingsService.updateByKey(key, value, companyId);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete setting' })
  @ApiParam({ name: 'id', type: Number })
  async remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
    return this.settingsService.remove(id);
  }

  @Delete('key/:key')
  @ApiOperation({ summary: 'Delete setting by key' })
  @ApiParam({ name: 'key', type: String })
  @ApiQuery({ name: 'companyId', required: false, type: Number })
  async removeByKey(
    @Param('key') key: string,
    @Query('companyId') companyId?: number,
  ): Promise<void> {
    return this.settingsService.removeByKey(key, companyId);
  }

  @Get('system')
  @ApiOperation({ summary: 'Get system-wide settings' })
  @ApiResponse({ description: 'System settings' })
  async getSystemSettings(): Promise<Record<string, any>> {
    return this.settingsService.getSystemSettings();
  }
}
