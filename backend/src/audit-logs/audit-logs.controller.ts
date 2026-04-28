import { Controller, Get, Post, Body, Param, Query, ParseIntPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiParam, ApiQuery, ApiResponse } from '@nestjs/swagger';
import { AuditLogsService } from './audit-logs.service';
import { CreateAuditLogDto } from './dto/create-audit-log.dto';
import { AuditLog } from './entities/audit-log.entity';

@ApiTags('Audit Logs')
@ApiBearerAuth()
@Controller('audit-logs')
export class AuditLogsController {
  constructor(private readonly auditLogsService: AuditLogsService) {}

  @Post()
  @ApiOperation({ summary: 'Create audit log entry' })
  @ApiResponse({ type: AuditLog, description: 'Created audit log' })
  async create(@Body() createAuditLogDto: CreateAuditLogDto): Promise<AuditLog> {
    return this.auditLogsService.create(createAuditLogDto);
  }

  @Post('log')
  @ApiOperation({ summary: 'Log an action (shorthand)' })
  @ApiResponse({ type: AuditLog, description: 'Created audit log' })
  async logAction(
    @Body('action') action: string,
    @Body('entityType') entityType: string,
    @Body('entityId') entityId?: number,
    @Body('companyId') companyId?: number,
    @Body('userId') userId?: number,
    @Body('oldValues') oldValues?: any,
    @Body('newValues') newValues?: any,
    @Body('ipAddress') ipAddress?: string,
    @Body('userAgent') userAgent?: string,
  ): Promise<AuditLog> {
    return this.auditLogsService.logAction(
      action,
      entityType,
      entityId,
      companyId,
      userId,
      oldValues,
      newValues,
      ipAddress,
      userAgent,
    );
  }

  @Get()
  @ApiOperation({ summary: 'List all audit logs' })
  @ApiQuery({ name: 'companyId', required: false, type: Number })
  @ApiQuery({ name: 'userId', required: false, type: Number })
  @ApiQuery({ name: 'action', required: false, type: String })
  @ApiQuery({ name: 'entityType', required: false, type: String })
  @ApiQuery({ name: 'entityId', required: false, type: Number })
  @ApiQuery({ name: 'from', required: false, type: String, description: 'From date (ISO)' })
  @ApiQuery({ name: 'to', required: false, type: String, description: 'To date (ISO)' })
  @ApiResponse({ type: [AuditLog], description: 'List of audit logs' })
  async findAll(
    @Query('companyId') companyId?: number,
    @Query('userId') userId?: number,
    @Query('action') action?: string,
    @Query('entityType') entityType?: string,
    @Query('entityId') entityId?: number,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ): Promise<AuditLog[]> {
    const fromDate = from ? new Date(from) : undefined;
    const toDate = to ? new Date(to) : undefined;
    return this.auditLogsService.findAll(companyId, userId, action, entityType, entityId, fromDate, toDate);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get audit log by ID' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({ type: AuditLog, description: 'Audit log details' })
  async findOne(@Param('id', ParseIntPipe) id: number): Promise<AuditLog | null> {
    return this.auditLogsService.findOne(id);
  }

  @Get('entity/:entityType/:entityId')
  @ApiOperation({ summary: 'Get audit logs for an entity' })
  @ApiParam({ name: 'entityType', type: String })
  @ApiParam({ name: 'entityId', type: Number })
  @ApiResponse({ type: [AuditLog], description: 'Audit logs for entity' })
  async findByEntity(
    @Param('entityType') entityType: string,
    @Param('entityId', ParseIntPipe) entityId: number,
  ): Promise<AuditLog[]> {
    return this.auditLogsService.findByEntity(entityType, entityId);
  }

  @Get('stats/:companyId')
  @ApiOperation({ summary: 'Get audit log statistics' })
  @ApiParam({ name: 'companyId', type: Number })
  @ApiQuery({ name: 'days', required: false, type: Number, description: 'Days of data to analyze' })
  @ApiResponse({ description: 'Audit log statistics' })
  async getStats(
    @Param('companyId', ParseIntPipe) companyId: number,
    @Query('days') days: number = 30,
  ): Promise<any> {
    return this.auditLogsService.getStats(companyId, days);
  }

  @Post('cleanup')
  @ApiOperation({ summary: 'Cleanup old audit logs' })
  @ApiQuery({ name: 'days', required: false, type: Number, description: 'Days to keep' })
  @ApiResponse({ description: 'Cleanup result' })
  async cleanupOldData(@Query('days') days: number = 90): Promise<{ deleted: number }> {
    return this.auditLogsService.cleanupOldData(days);
  }
}
