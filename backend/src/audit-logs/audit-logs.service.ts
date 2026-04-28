import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThan, LessThan } from 'typeorm';
import { AuditLog } from './entities/audit-log.entity';
import { CompaniesService } from '../companies/companies.service';
import { UsersService } from '../auth/users.service';
import { CreateAuditLogDto } from './dto/create-audit-log.dto';

@Injectable()
export class AuditLogsService {
  private readonly logger = new Logger(AuditLogsService.name);

  constructor(
    @InjectRepository(AuditLog)
    private auditLogsRepository: Repository<AuditLog>,
    private readonly companiesService: CompaniesService,
    private readonly usersService: UsersService,
  ) {}

  async create(createAuditLogDto: CreateAuditLogDto): Promise<AuditLog> {
    let company: any = null;
    let user: any = null;

    if (createAuditLogDto.companyId) {
      company = await this.companiesService.findOne(createAuditLogDto.companyId);
    }

    if (createAuditLogDto.userId) {
      user = await this.usersService.findOne(createAuditLogDto.userId);
    }

    const auditLog = new AuditLog();
    auditLog.companyId = createAuditLogDto.companyId as any;
    auditLog.company = company as any;
    auditLog.userId = createAuditLogDto.userId as any;
    auditLog.user = user as any;
    auditLog.action = createAuditLogDto.action;
    auditLog.entityType = createAuditLogDto.entityType;
    auditLog.entityId = createAuditLogDto.entityId as any;
    auditLog.ipAddress = createAuditLogDto.ipAddress as any;
    auditLog.userAgent = createAuditLogDto.userAgent as any;
    auditLog.oldValues = createAuditLogDto.oldValues as any;
    auditLog.newValues = createAuditLogDto.newValues as any;

    const savedAuditLog = await this.auditLogsRepository.save(auditLog);

    this.logger.log(`Audit log created: ${auditLog.action} on ${auditLog.entityType} by user ${user?.id || 'system'}`);

    return savedAuditLog;
  }

  async logAction(
    action: string,
    entityType: string,
    entityId?: number,
    companyId?: number,
    userId?: number,
    oldValues?: any,
    newValues?: any,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<AuditLog> {
    const dto = {
      action,
      entityType,
      entityId,
      companyId,
      userId,
      oldValues,
      newValues,
      ipAddress,
      userAgent,
    };
    return this.create(dto as CreateAuditLogDto);
  }

  async findAll(
    companyId?: number,
    userId?: number,
    action?: string,
    entityType?: string,
    entityId?: number,
    from?: Date,
    to?: Date,
  ): Promise<AuditLog[]> {
    const options: any = {
      relations: ['company', 'user'],
      order: { createdAt: 'DESC' },
    };

    const where: any[] = [];
    if (companyId) where.push({ companyId });
    if (userId) where.push({ userId });
    if (action) where.push({ action });
    if (entityType) where.push({ entityType });
    if (entityId) where.push({ entityId });
    if (from) where.push({ createdAt: MoreThan(from) });
    if (to) where.push({ createdAt: LessThan(to) });

    if (where.length > 0) {
      options.where = where.length === 1 ? where[0] : where;
    }

    return this.auditLogsRepository.find(options);
  }

  async findOne(id: number): Promise<AuditLog | null> {
    return this.auditLogsRepository.findOne({
      where: { id },
      relations: ['company', 'user'],
    });
  }

  async findByEntity(entityType: string, entityId: number): Promise<AuditLog[]> {
    return this.auditLogsRepository.find({
      where: { entityType, entityId },
      relations: ['company', 'user'],
      order: { createdAt: 'DESC' },
    });
  }

  async getStats(companyId: number, days: number = 30): Promise<{
    total: number;
    byAction: { action: string; count: number }[];
    byEntityType: { entityType: string; count: number }[];
    byUser: { userId: number; count: number }[];
  }> {
    const fromDate = new Date();
    fromDate.setDate(fromDate.getDate() - days);

    const [total, allLogs] = await Promise.all([
      this.auditLogsRepository.count({ where: { companyId, createdAt: MoreThan(fromDate) } }),
      this.auditLogsRepository.find({
        where: { companyId, createdAt: MoreThan(fromDate) },
        relations: ['user'],
        select: ['action', 'entityType', 'userId'],
        order: { createdAt: 'DESC' },
      }),
    ]);

    const byAction = new Map<string, number>();
    const byEntityType = new Map<string, number>();
    const byUser = new Map<number, number>();

    for (const log of allLogs) {
      byAction.set(log.action, (byAction.get(log.action) || 0) + 1);
      byEntityType.set(log.entityType, (byEntityType.get(log.entityType) || 0) + 1);
      if (log.userId) byUser.set(log.userId, (byUser.get(log.userId) || 0) + 1);
    }

    return {
      total,
      byAction: Array.from(byAction.entries()).map(([action, count]) => ({ action, count })),
      byEntityType: Array.from(byEntityType.entries()).map(([entityType, count]) => ({ entityType, count })),
      byUser: Array.from(byUser.entries()).map(([userId, count]) => ({ userId, count })),
    };
  }

  async cleanupOldData(days: number = 90): Promise<{ deleted: number }> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    const result = await this.auditLogsRepository.delete({
      createdAt: LessThan(cutoffDate),
    });

    this.logger.log(`Cleaned up ${result.affected} old audit log records`);
    return { deleted: result.affected || 0 };
  }
}
