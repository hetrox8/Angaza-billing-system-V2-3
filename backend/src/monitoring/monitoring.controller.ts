import { Controller, Get, Post, Body, Param, Delete, Query, ParseIntPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiParam, ApiQuery, ApiResponse } from '@nestjs/swagger';
import { MonitoringService } from './monitoring.service';
import { CreateMonitoringDto } from './dto/create-monitoring.dto';
import { Monitoring } from './entities/monitoring.entity';

@ApiTags('Monitoring')
@ApiBearerAuth()
@Controller('monitoring')
export class MonitoringController {
  constructor(private readonly monitoringService: MonitoringService) {}

  @Post()
  @ApiOperation({ summary: 'Create monitoring data' })
  @ApiResponse({ type: Monitoring, description: 'Created monitoring record' })
  async create(@Body() createMonitoringDto: CreateMonitoringDto): Promise<Monitoring> {
    return this.monitoringService.create(createMonitoringDto);
  }

  @Post('bulk')
  @ApiOperation({ summary: 'Create bulk monitoring data' })
  @ApiResponse({ type: [Monitoring], description: 'Created monitoring records' })
  async createBulk(@Body() createMonitoringDtos: CreateMonitoringDto[]): Promise<Monitoring[]> {
    return this.monitoringService.createBulk(createMonitoringDtos);
  }

  @Get()
  @ApiOperation({ summary: 'List all monitoring data' })
  @ApiQuery({ name: 'companyId', required: false, type: Number })
  @ApiQuery({ name: 'deviceId', required: false, type: Number })
  @ApiQuery({ name: 'radiusUserId', required: false, type: Number })
  @ApiQuery({ name: 'status', required: false, type: String })
  @ApiQuery({ name: 'from', required: false, type: String, description: 'From date (ISO)' })
  @ApiQuery({ name: 'to', required: false, type: String, description: 'To date (ISO)' })
  @ApiResponse({ type: [Monitoring], description: 'List of monitoring records' })
  async findAll(
    @Query('companyId') companyId?: number,
    @Query('deviceId') deviceId?: number,
    @Query('radiusUserId') radiusUserId?: number,
    @Query('status') status?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ): Promise<Monitoring[]> {
    const fromDate = from ? new Date(from) : undefined;
    const toDate = to ? new Date(to) : undefined;
    return this.monitoringService.findAll(companyId, deviceId, radiusUserId, status, fromDate, toDate);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get monitoring record by ID' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({ type: Monitoring, description: 'Monitoring record details' })
  async findOne(@Param('id', ParseIntPipe) id: number): Promise<Monitoring | null> {
    return this.monitoringService.findOne(id);
  }

  @Get('device/:deviceId')
  @ApiOperation({ summary: 'Get monitoring data by device' })
  @ApiParam({ name: 'deviceId', type: Number })
  @ApiQuery({ name: 'from', required: false, type: String, description: 'From date (ISO)' })
  @ApiQuery({ name: 'to', required: false, type: String, description: 'To date (ISO)' })
  @ApiResponse({ type: [Monitoring], description: 'Device monitoring data' })
  async findByDevice(
    @Param('deviceId', ParseIntPipe) deviceId: number,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ): Promise<Monitoring[]> {
    const fromDate = from ? new Date(from) : undefined;
    const toDate = to ? new Date(to) : undefined;
    return this.monitoringService.findByDevice(deviceId, fromDate, toDate);
  }

  @Get('radius-user/:radiusUserId')
  @ApiOperation({ summary: 'Get monitoring data by radius user' })
  @ApiParam({ name: 'radiusUserId', type: Number })
  @ApiQuery({ name: 'from', required: false, type: String, description: 'From date (ISO)' })
  @ApiQuery({ name: 'to', required: false, type: String, description: 'To date (ISO)' })
  @ApiResponse({ type: [Monitoring], description: 'Radius user monitoring data' })
  async findByRadiusUser(
    @Param('radiusUserId', ParseIntPipe) radiusUserId: number,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ): Promise<Monitoring[]> {
    const fromDate = from ? new Date(from) : undefined;
    const toDate = to ? new Date(to) : undefined;
    return this.monitoringService.findByRadiusUser(radiusUserId, fromDate, toDate);
  }

  @Get('device-status/:deviceId')
  @ApiOperation({ summary: 'Get latest device status' })
  @ApiParam({ name: 'deviceId', type: Number })
  @ApiResponse({ type: Monitoring, description: 'Latest device status' })
  async getDeviceStatus(@Param('deviceId', ParseIntPipe) deviceId: number): Promise<Monitoring | null> {
    return this.monitoringService.getDeviceStatus(deviceId);
  }

  @Get('stats/:companyId')
  @ApiOperation({ summary: 'Get monitoring statistics' })
  @ApiParam({ name: 'companyId', type: Number })
  @ApiQuery({ name: 'days', required: false, type: Number, description: 'Days of data to analyze' })
  @ApiResponse({ description: 'Monitoring statistics' })
  async getStats(
    @Param('companyId', ParseIntPipe) companyId: number,
    @Query('days') days: number = 7,
  ): Promise<any> {
    return this.monitoringService.getStats(companyId, days);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete monitoring record' })
  @ApiParam({ name: 'id', type: Number })
  async remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
    return this.monitoringService.remove(id);
  }

  @Post('cleanup')
  @ApiOperation({ summary: 'Cleanup old monitoring data' })
  @ApiQuery({ name: 'days', required: false, type: Number, description: 'Days to keep' })
  @ApiResponse({ description: 'Cleanup result' })
  async cleanupOldData(@Query('days') days: number = 90): Promise<{ deleted: number }> {
    return this.monitoringService.cleanupOldData(days);
  }
}
