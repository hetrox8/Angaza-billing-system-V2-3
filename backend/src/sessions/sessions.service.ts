import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThan } from 'typeorm';
import { Session, SessionStatus } from './entities/session.entity';
import { CompaniesService } from '../companies/companies.service';
import { RadiusUsersService } from '../radius-users/radius-users.service';
import { CustomersService } from '../customers/customers.service';
import { DevicesService } from '../devices/devices.service';

@Injectable()
export class SessionsService {
  constructor(
    @InjectRepository(Session)
    private sessionsRepository: Repository<Session>,
    private readonly companiesService: CompaniesService,
    private readonly radiusUsersService: RadiusUsersService,
    private readonly customersService: CustomersService,
    private readonly devicesService: DevicesService,
  ) {}

  async create(sessionData: {
    companyId: number;
    radiusUserId: number;
    customerId?: number;
    deviceId?: number;
    acctSessionId?: string;
    framedIpAddress?: string;
    callingStationId?: string;
    nasPortId?: string;
    startTime?: Date;
    dataUp?: number;
    dataDown?: number;
  }): Promise<Session> {
    const company = await this.companiesService.findOne(sessionData.companyId);
    if (!company) {
      throw new NotFoundException(`Company #${sessionData.companyId} not found`);
    }

    const radiusUser = await this.radiusUsersService.findOne(sessionData.radiusUserId);
    if (!radiusUser) {
      throw new NotFoundException(`RADIUS user #${sessionData.radiusUserId} not found`);
    }

    let customer: any = null;
    if (sessionData.customerId) {
      customer = await this.customersService.findOne(sessionData.customerId);
      if (!customer) {
        throw new NotFoundException(`Customer #${sessionData.customerId} not found`);
      }
    }

    let device: any = null;
    if (sessionData.deviceId) {
      device = await this.devicesService.findOne(sessionData.deviceId);
      if (!device) {
        throw new NotFoundException(`Device #${sessionData.deviceId} not found`);
      }
    }

    const session = new Session();
    session.companyId = sessionData.companyId;
    session.company = company;
    session.radiusUserId = sessionData.radiusUserId;
    session.radiusUser = radiusUser;
    session.customerId = sessionData.customerId as any;
    session.customer = customer;
    session.deviceId = sessionData.deviceId as any;
    session.device = device;
    session.acctSessionId = sessionData.acctSessionId as any;
    session.framedIpAddress = sessionData.framedIpAddress as any;
    session.callingStationId = sessionData.callingStationId as any;
    session.nasPortId = sessionData.nasPortId as any;
    session.startTime = sessionData.startTime || new Date();
    session.dataUp = sessionData.dataUp || 0;
    session.dataDown = sessionData.dataDown || 0;
    session.dataTotal = (sessionData.dataUp || 0) + (sessionData.dataDown || 0);
    session.status = SessionStatus.ACTIVE;

    return this.sessionsRepository.save(session);
  }

  async findAll(companyId?: number, radiusUserId?: number, customerId?: number, status?: SessionStatus): Promise<Session[]> {
    const options: any = {
      relations: ['company', 'radiusUser', 'customer', 'device'],
      order: { startTime: 'DESC' },
    };

    const where: any[] = [];
    if (companyId) where.push({ companyId });
    if (radiusUserId) where.push({ radiusUserId });
    if (customerId) where.push({ customerId });
    if (status) where.push({ status });

    if (where.length > 0) {
      options.where = where.length === 1 ? where[0] : { AND: where };
    }

    return this.sessionsRepository.find(options);
  }

  async findOne(id: number): Promise<Session | null> {
    return this.sessionsRepository.findOne({
      where: { id },
      relations: ['company', 'radiusUser', 'customer', 'device'],
    });
  }

  async findActiveByRadiusUser(radiusUserId: number): Promise<Session[]> {
    return this.sessionsRepository.find({
      where: { radiusUserId, status: SessionStatus.ACTIVE },
      relations: ['company', 'radiusUser', 'customer', 'device'],
      order: { startTime: 'DESC' },
    });
  }

  async findActiveByCompany(companyId: number): Promise<Session[]> {
    return this.sessionsRepository.find({
      where: { companyId, status: SessionStatus.ACTIVE },
      relations: ['company', 'radiusUser', 'customer', 'device'],
      order: { startTime: 'DESC' },
    });
  }

  async findActiveByDevice(deviceId: number): Promise<Session[]> {
    return this.sessionsRepository.find({
      where: { deviceId, status: SessionStatus.ACTIVE },
      relations: ['company', 'radiusUser', 'customer', 'device'],
      order: { startTime: 'DESC' },
    });
  }

  async update(id: number, updateData: {
    endTime?: Date;
    dataUp?: number;
    dataDown?: number;
    status?: SessionStatus;
    terminatedCause?: string;
  }): Promise<Session> {
    const session = await this.findOne(id);
    if (!session) {
      throw new NotFoundException(`Session #${id} not found`);
    }

    if (updateData.endTime !== undefined) session.endTime = updateData.endTime as any;
    if (updateData.dataUp !== undefined) session.dataUp = updateData.dataUp;
    if (updateData.dataDown !== undefined) session.dataDown = updateData.dataDown;
    if (updateData.status !== undefined) session.status = updateData.status;
    if (updateData.terminatedCause !== undefined) session.terminatedCause = updateData.terminatedCause as any;

    session.duration = session.endTime && session.startTime
      ? Math.floor((session.endTime.getTime() - session.startTime.getTime()) / 1000)
      : null as any;

    await this.sessionsRepository.save(session);
    return session;
  }

  async endSession(id: number, terminatedCause?: string): Promise<Session> {
    const session = await this.findOne(id);
    if (!session) {
      throw new NotFoundException(`Session #${id} not found`);
    }

    session.endTime = new Date() as any;
    session.status = SessionStatus.ENDED;
    session.terminatedCause = terminatedCause || null as any;
    session.duration = session.startTime
      ? Math.floor((session.endTime.getTime() - session.startTime.getTime()) / 1000)
      : 0;

    await this.sessionsRepository.save(session);
    return session;
  }

  async killSession(id: number, reason: string): Promise<Session> {
    const session = await this.findOne(id);
    if (!session) {
      throw new NotFoundException(`Session #${id} not found`);
    }

    session.endTime = new Date() as any;
    session.status = SessionStatus.KILLED;
    session.terminatedCause = reason;
    session.duration = session.startTime
      ? Math.floor((session.endTime.getTime() - session.startTime.getTime()) / 1000)
      : 0;

    await this.sessionsRepository.save(session);
    return session;
  }

  async getActiveSessionsCount(companyId: number): Promise<number> {
    return this.sessionsRepository.count({
      where: { companyId, status: SessionStatus.ACTIVE },
    });
  }

  async getStats(companyId: number): Promise<{
    total: number;
    active: number;
    ended: number;
    killed: number;
    totalDataUp: number;
    totalDataDown: number;
    averageDuration: number;
  }> {
    const [total, active, ended, killed, sessions] = await Promise.all([
      this.sessionsRepository.count({ where: { companyId } }),
      this.sessionsRepository.count({ where: { companyId, status: SessionStatus.ACTIVE } }),
      this.sessionsRepository.count({ where: { companyId, status: SessionStatus.ENDED } }),
      this.sessionsRepository.count({ where: { companyId, status: SessionStatus.KILLED } }),
      this.sessionsRepository.find({
        where: { companyId, status: SessionStatus.ENDED },
        select: ['dataUp', 'dataDown', 'duration'],
      }),
    ]);

    const totalDataUp = sessions.reduce((sum: any, s: any) => sum + (s.dataUp || 0), 0);
    const totalDataDown = sessions.reduce((sum: any, s: any) => sum + (s.dataDown || 0), 0);
    const avgDuration = sessions.length > 0
      ? sessions.reduce((sum: any, s: any) => sum + (s.duration || 0), 0) / sessions.length
      : 0;

    return {
      total,
      active,
      ended,
      killed,
      totalDataUp,
      totalDataDown,
      averageDuration: Math.round(avgDuration),
    };
  }

  async cleanupExpiredSessions(days: number = 30): Promise<{ deletedCount: number }> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    const result = await this.sessionsRepository.delete({
      endTime: MoreThan(cutoffDate),
    });

    return { deletedCount: result.affected || 0 };
  }

  async getUserUsage(radiusUserId: number, startDate: Date, endDate: Date): Promise<{
    totalSessions: number;
    totalDataUp: number;
    totalDataDown: number;
    totalDuration: number;
    averageSpeedUp: number;
    averageSpeedDown: number;
  }> {
    const sessions = await this.sessionsRepository.find({
      where: {
        radiusUserId,
        startTime: MoreThan(startDate),
        endTime: MoreThan(endDate),
        status: SessionStatus.ENDED,
      },
    });

    const totalSessions = sessions.length;
    const totalDataUp = sessions.reduce((sum: any, s: any) => sum + (s.dataUp || 0), 0);
    const totalDataDown = sessions.reduce((sum: any, s: any) => sum + (s.dataDown || 0), 0);
    const totalDuration = sessions.reduce((sum: any, s: any) => sum + (s.duration || 0), 0);

    const averageSpeedUp = totalSessions > 0 && totalDuration > 0
      ? (totalDataUp * 8) / totalDuration
      : 0;
    const averageSpeedDown = totalSessions > 0 && totalDuration > 0
      ? (totalDataDown * 8) / totalDuration
      : 0;

    return {
      totalSessions,
      totalDataUp,
      totalDataDown,
      totalDuration,
      averageSpeedUp: Math.round(averageSpeedUp),
      averageSpeedDown: Math.round(averageSpeedDown),
    };
  }
}
