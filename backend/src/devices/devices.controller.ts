import { Controller, Get, Post, Body, Param, Put, Delete, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery, ApiParam } from '@nestjs/swagger';
import { DevicesService } from './devices.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { DeviceStatus, DeviceType } from './entities/device.entity';
import { CreateDeviceDto } from './dto/create-device.dto';
import { UpdateDeviceDto } from './dto/update-device.dto';

@ApiTags('Devices')
@Controller('devices')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class DevicesController {
  constructor(private readonly devicesService: DevicesService) {}

  @Post()
  @ApiOperation({ summary: 'Add a new MikroTik device' })
  create(@Body() createDeviceDto: CreateDeviceDto) {
    return this.devicesService.create(createDeviceDto);
  }

  @Get()
  @ApiOperation({ summary: 'List all devices' })
  @ApiQuery({ name: 'companyId', required: false, type: Number })
  @ApiQuery({ name: 'status', required: false, enum: DeviceStatus })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async findAll(
    @Query('companyId') companyId?: number,
    @Query('status') status?: DeviceStatus,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    let devices = await this.devicesService.findAll(companyId);

    if (status) {
      devices = devices.filter((d) => d.status === status);
    }

    const pageNum = page || 1;
    const limitNum = limit || 100;
    const start = (pageNum - 1) * limitNum;
    const end = start + limitNum;

    const paginated = devices.slice(start, end);

    return {
      data: paginated,
      total: devices.length,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(devices.length / limitNum),
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a device by ID' })
  @ApiParam({ name: 'id', type: Number })
  findOne(@Param('id') id: string) {
    return this.devicesService.findOne(+id);
  }

  @Get('ip/:ipAddress')
  @ApiOperation({ summary: 'Get device by IP address' })
  @ApiParam({ name: 'ipAddress', type: String })
  findByIp(@Param('ipAddress') ipAddress: string) {
    return this.devicesService.findByIp(ipAddress);
  }

  @Get('company/:companyId')
  @ApiOperation({ summary: 'Get all devices for a company' })
  @ApiParam({ name: 'companyId', type: Number })
  findByCompany(@Param('companyId') companyId: string) {
    return this.devicesService.findByCompany(+companyId);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update a device' })
  @ApiParam({ name: 'id', type: Number })
  update(@Param('id') id: string, @Body() updateDeviceDto: UpdateDeviceDto) {
    return this.devicesService.update(+id, updateDeviceDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Remove a device' })
  @ApiParam({ name: 'id', type: Number })
  remove(@Param('id') id: string) {
    return this.devicesService.remove(+id);
  }

  @Post(':id/test-connection')
  @ApiOperation({ summary: 'Test SSH connection to device' })
  @ApiParam({ name: 'id', type: Number })
  testConnection(@Param('id') id: string) {
    return this.devicesService.testConnection(+id);
  }

  @Post(':id/test-radius')
  @ApiOperation({ summary: 'Test RADIUS configuration on device' })
  @ApiParam({ name: 'id', type: Number })
  testRadiusConfig(@Param('id') id: string) {
    return this.devicesService.testRadiusConfig(+id);
  }

  @Get(':id/telemetry')
  @ApiOperation({ summary: 'Get live telemetry from device' })
  @ApiParam({ name: 'id', type: Number })
  getTelemetry(@Param('id') id: string) {
    return this.devicesService.getTelemetry(+id);
  }

  @Post(':id/provision')
  @ApiOperation({ summary: 'Provision device with Anagaza configuration' })
  @ApiParam({ name: 'id', type: Number })
  provision(@Param('id') id: string) {
    return this.devicesService.provision(+id);
  }

  @Post(':id/generate-script')
  @ApiOperation({ summary: 'Generate provisioning script for device' })
  @ApiParam({ name: 'id', type: Number })
  @ApiQuery({ name: 'type', required: false, enum: ['full', 'pppoe', 'hotspot'] })
  generateScript(
    @Param('id') id: string,
    @Query('type') type?: 'full' | 'pppoe' | 'hotspot',
  ) {
    return this.devicesService.generateScript(+id, type);
  }

  @Post(':id/mark-online')
  @ApiOperation({ summary: 'Mark device as online' })
  @ApiParam({ name: 'id', type: Number })
  markOnline(@Param('id') id: string) {
    return this.devicesService.markOnline(+id);
  }

  @Post(':id/mark-offline')
  @ApiOperation({ summary: 'Mark device as offline' })
  @ApiParam({ name: 'id', type: Number })
  markOffline(@Param('id') id: string) {
    return this.devicesService.markOffline(+id);
  }

  @Get(':id/stats')
  @ApiOperation({ summary: 'Get device statistics' })
  @ApiParam({ name: 'id', type: Number })
  async getStats(@Param('id') id: string) {
    const device = await this.devicesService.findOne(+id);
    if (!device) {
      return { error: 'Device not found' };
    }

    const radiusUsersCount = device.radiusUsers?.length || 0;
    const sessionsCount = device.sessions?.length || 0;

    return {
      deviceId: device.id,
      name: device.name,
      ipAddress: device.ipAddress,
      status: device.status,
      type: device.type,
      lastSeenAt: device.lastSeenAt,
      connectedUsers: radiusUsersCount,
      activeSessions: sessionsCount,
    };
  }
}
