import { Controller, Get, Post, Body, Param, Put, Delete, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery, ApiParam } from '@nestjs/swagger';
import { SessionsService } from './sessions.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { SessionStatus } from './entities/session.entity';

@ApiTags('Sessions')
@Controller('sessions')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class SessionsController {
  constructor(private readonly sessionsService: SessionsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new session (used by RADIUS accounting)' })
  create(@Body() createSessionDto: {
    companyId: number;
    radiusUserId: number;
    customerId?: number;
    deviceId?: number;
    acctSessionId?: string;
    framedIpAddress?: string;
    callingStationId?: string;
    nasPortId?: string;
    dataUp?: number;
    dataDown?: number;
  }) {
    return this.sessionsService.create(createSessionDto);
  }

  @Get()
  @ApiOperation({ summary: 'List all sessions' })
  @ApiQuery({ name: 'companyId', required: false, type: Number })
  @ApiQuery({ name: 'radiusUserId', required: false, type: Number })
  @ApiQuery({ name: 'customerId', required: false, type: Number })
  @ApiQuery({ name: 'status', required: false, enum: SessionStatus })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async findAll(
    @Query('companyId') companyId?: number,
    @Query('radiusUserId') radiusUserId?: number,
    @Query('customerId') customerId?: number,
    @Query('status') status?: SessionStatus,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    const sessions = await this.sessionsService.findAll(companyId, radiusUserId, customerId, status);
    
    const pageNum = page || 1;
    const limitNum = limit || 100;
    const start = (pageNum - 1) * limitNum;
    const end = start + limitNum;
    const paginated = sessions.slice(start, end);

    return {
      data: paginated,
      total: sessions.length,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(sessions.length / limitNum),
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a session by ID' })
  @ApiParam({ name: 'id', type: Number })
  findOne(@Param('id') id: string) {
    return this.sessionsService.findOne(+id);
  }

  @Get('active/radius-user/:radiusUserId')
  @ApiOperation({ summary: 'Get active sessions for a RADIUS user' })
  @ApiParam({ name: 'radiusUserId', type: Number })
  findActiveByRadiusUser(@Param('radiusUserId') radiusUserId: string) {
    return this.sessionsService.findActiveByRadiusUser(+radiusUserId);
  }

  @Get('active/company/:companyId')
  @ApiOperation({ summary: 'Get all active sessions for a company' })
  @ApiParam({ name: 'companyId', type: Number })
  findActiveByCompany(@Param('companyId') companyId: string) {
    return this.sessionsService.findActiveByCompany(+companyId);
  }

  @Get('active/device/:deviceId')
  @ApiOperation({ summary: 'Get all active sessions for a device' })
  @ApiParam({ name: 'deviceId', type: Number })
  findActiveByDevice(@Param('deviceId') deviceId: string) {
    return this.sessionsService.findActiveByDevice(+deviceId);
  }

  @Put(':id/end')
  @ApiOperation({ summary: 'End a session' })
  @ApiParam({ name: 'id', type: Number })
  @ApiQuery({ name: 'cause', required: false, type: String })
  endSession(@Param('id') id: string, @Query('cause') cause?: string) {
    return this.sessionsService.endSession(+id, cause);
  }

  @Put(':id/kill')
  @ApiOperation({ summary: 'Kill a session (admin forced disconnect)' })
  @ApiParam({ name: 'id', type: Number })
  killSession(@Param('id') id: string, @Body() body: { reason: string }) {
    return this.sessionsService.killSession(+id, body.reason);
  }

  @Get('count/active/:companyId')
  @ApiOperation({ summary: 'Get count of active sessions for a company' })
  @ApiParam({ name: 'companyId', type: Number })
  getActiveCount(@Param('companyId') companyId: string) {
    return this.sessionsService.getActiveSessionsCount(+companyId);
  }

  @Get('stats/:companyId')
  @ApiOperation({ summary: 'Get session statistics for a company' })
  @ApiParam({ name: 'companyId', type: Number })
  getStats(@Param('companyId') companyId: string) {
    return this.sessionsService.getStats(+companyId);
  }

  @Get('usage/:radiusUserId')
  @ApiOperation({ summary: 'Get data usage for a RADIUS user (time period)' })
  @ApiParam({ name: 'radiusUserId', type: Number })
  @ApiQuery({ name: 'startDate', type: String, description: 'ISO date string' })
  @ApiQuery({ name: 'endDate', type: String, description: 'ISO date string' })
  getUserUsage(
    @Param('radiusUserId') radiusUserId: string,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    return this.sessionsService.getUserUsage(
      +radiusUserId,
      new Date(startDate),
      new Date(endDate),
    );
  }

  @Delete('cleanup')
  @ApiOperation({ summary: 'Cleanup expired session records' })
  @ApiQuery({ name: 'days', required: false, type: Number, description: 'Delete sessions older than N days (default: 30)' })
  cleanupExpired(@Query('days') days?: number) {
    return this.sessionsService.cleanupExpiredSessions(days || 30);
  }
}
