import { Controller, Get, Post, Body, Param, Put, Delete, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery, ApiParam } from '@nestjs/swagger';
import { RadiusUsersService } from './radius-users.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateRadiusUserDto } from './dto/create-radius-user.dto';
import { UpdateRadiusUserDto } from './dto/update-radius-user.dto';

@ApiTags('Radius Users')
@Controller('radius-users')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class RadiusUsersController {
  constructor(private readonly radiusUsersService: RadiusUsersService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new RADIUS user' })
  async create(@Body() createRadiusUserDto: CreateRadiusUserDto) {
    return this.radiusUsersService.create(createRadiusUserDto);
  }

  @Get()
  @ApiOperation({ summary: 'List all RADIUS users' })
  @ApiQuery({ name: 'companyId', required: false, type: Number })
  @ApiQuery({ name: 'customerId', required: false, type: Number })
  @ApiQuery({ name: 'deviceId', required: false, type: Number })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async findAll(
    @Query('companyId') companyId?: number,
    @Query('customerId') customerId?: number,
    @Query('deviceId') deviceId?: number,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    const radiusUsers = await this.radiusUsersService.findAll(companyId, customerId, deviceId);

    // Pagination
    const pageNum = page || 1;
    const limitNum = limit || 100;
    const start = (pageNum - 1) * limitNum;
    const end = start + limitNum;

    const paginated = radiusUsers.slice(start, end);

    return {
      data: paginated,
      total: radiusUsers.length,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(radiusUsers.length / limitNum),
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a RADIUS user by ID' })
  @ApiParam({ name: 'id', type: Number })
  findOne(@Param('id') id: string) {
    return this.radiusUsersService.findOne(+id);
  }

  @Get('username/:username')
  @ApiOperation({ summary: 'Get RADIUS user by username' })
  @ApiParam({ name: 'username', type: String })
  findByUsername(@Param('username') username: string) {
    return this.radiusUsersService.findByUsername(username);
  }

  @Get('customer/:customerId')
  @ApiOperation({ summary: 'Get all RADIUS users for a customer' })
  @ApiParam({ name: 'customerId', type: Number })
  findByCustomer(@Param('customerId') customerId: string) {
    return this.radiusUsersService.findByCustomer(+customerId);
  }

  @Get('device/:deviceId')
  @ApiOperation({ summary: 'Get all RADIUS users for a device' })
  @ApiParam({ name: 'deviceId', type: Number })
  findByDevice(@Param('deviceId') deviceId: string) {
    return this.radiusUsersService.findByDevice(+deviceId);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update a RADIUS user' })
  @ApiParam({ name: 'id', type: Number })
  update(@Param('id') id: string, @Body() updateRadiusUserDto: UpdateRadiusUserDto) {
    return this.radiusUsersService.update(+id, updateRadiusUserDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a RADIUS user' })
  @ApiParam({ name: 'id', type: Number })
  remove(@Param('id') id: string) {
    return this.radiusUsersService.remove(+id);
  }

  @Post(':id/lock')
  @ApiOperation({ summary: 'Lock a RADIUS user' })
  @ApiParam({ name: 'id', type: Number })
  lock(
    @Param('id') id: string,
    @Body() body: { reason?: string },
  ) {
    return this.radiusUsersService.lock(+id, body.reason);
  }

  @Post(':id/unlock')
  @ApiOperation({ summary: 'Unlock a RADIUS user' })
  @ApiParam({ name: 'id', type: Number })
  unlock(@Param('id') id: string) {
    return this.radiusUsersService.unlock(+id);
  }

  @Post(':id/activate')
  @ApiOperation({ summary: 'Activate a RADIUS user' })
  @ApiParam({ name: 'id', type: Number })
  activate(@Param('id') id: string) {
    return this.radiusUsersService.activate(+id);
  }

  @Post(':id/deactivate')
  @ApiOperation({ summary: 'Deactivate a RADIUS user' })
  @ApiParam({ name: 'id', type: Number })
  deactivate(@Param('id') id: string) {
    return this.radiusUsersService.deactivate(+id);
  }

  @Post(':id/change-password')
  @ApiOperation({ summary: 'Change RADIUS user password' })
  @ApiParam({ name: 'id', type: Number })
  changePassword(
    @Param('id') id: string,
    @Body() body: { newPassword: string },
  ) {
    return this.radiusUsersService.changePassword(+id, body.newPassword);
  }

  @Post(':id/reset-password')
  @ApiOperation({ summary: 'Reset RADIUS user password (generates new one)' })
  @ApiParam({ name: 'id', type: Number })
  resetPassword(@Param('id') id: string) {
    return this.radiusUsersService.resetPassword(+id);
  }

  @Post('bulk')
  @ApiOperation({ summary: 'Bulk create RADIUS users for multiple customers' })
  bulkCreate(
    @Body() body: { 
      customerIds: number[]; 
      deviceId: number; 
      planId?: number 
    },
  ) {
    return this.radiusUsersService.bulkCreate(
      body.customerIds,
      body.deviceId,
      body.planId,
    );
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get RADIUS users statistics' })
  getStats() {
    return this.radiusUsersService.getStats();
  }
}
