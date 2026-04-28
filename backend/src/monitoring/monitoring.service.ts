import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThan, LessThan } from 'typeorm';
import { Monitoring } from './entities/monitoring.entity';
import { CompaniesService } from '../companies/companies.service';
import { DevicesService } from '../devices/devices.service';
import { RadiusUsersService } from '../radius-users/radius-users.service';
import { CreateMonitoringDto } from './dto/create-monitoring.dto';

@Injectable()
export class MonitoringService {
  private readonly logger = new Logger(MonitoringService.name);

  constructor(
    @InjectRepository(Monitoring)
    private monitoringRepository: Repository<Monitoring>,
    private readonly companiesService: CompaniesService,
    private readonly devicesService: DevicesService,
    private readonly radiusUsersService: RadiusUsersService,
  ) {}

  async create(createMonitoringDto: CreateMonitoringDto): Promise<Monitoring> {
    const company = await this.companiesService.findOne(createMonitoringDto.companyId);
    if (!company) {
      throw new NotFoundException(`Company #${createMonitoringDto.companyId} not found`);
    }

    let device: any = null;
    if (createMonitoringDto.deviceId) {
      device = await this.devicesService.findOne(createMonitoringDto.deviceId);
    }

    let radiusUser: any = null;
    if (createMonitoringDto.radiusUserId) {
      radiusUser = await this.radiusUsersService.findOne(createMonitoringDto.radiusUserId);
    }

    const monitoring = new Monitoring();
    monitoring.companyId = createMonitoringDto.companyId;
    monitoring.company = company;
    monitoring.deviceId = createMonitoringDto.deviceId as any;
    monitoring.device = device as any;
    monitoring.radiusUserId = createMonitoringDto.radiusUserId as any;
    monitoring.radiusUser = radiusUser as any;
    monitoring.timestamp = createMonitoringDto.timestamp ? new Date(createMonitoringDto.timestamp) as any : new Date() as any;
    monitoring.uploadSpeed = createMonitoringDto.uploadSpeed as any;
    monitoring.downloadSpeed = createMonitoringDto.downloadSpeed as any;
    monitoring.latency = createMonitoringDto.latency as any;
    monitoring.packetLoss = createMonitoringDto.packetLoss as any;
    monitoring.bytesUploaded = createMonitoringDto.bytesUploaded as any;
    monitoring.bytesDownloaded = createMonitoringDto.bytesDownloaded as any;
    monitoring.signalStrength = createMonitoringDto.signalStrength as any;
    monitoring.cpuUsage = createMonitoringDto.cpuUsage as any;
    monitoring.memoryUsage = createMonitoringDto.memoryUsage as any;
    monitoring.uptime = createMonitoringDto.uptime as any;
    monitoring.connectedClients = createMonitoringDto.connectedClients as any;
    monitoring.status = createMonitoringDto.status as any;
    monitoring.metadata = createMonitoringDto.metadata as any;

    const savedMonitoring = await this.monitoringRepository.save(monitoring);

    this.logger.log(`Monitoring data created for company ${company.id}, device ${device?.id || 'none'}, radiusUser ${radiusUser?.id || 'none'}`);

    return savedMonitoring;
  }

  async createBulk(createMonitoringDtos: CreateMonitoringDto[]): Promise<Monitoring[]> {
    const results: Monitoring[] = [];
    for (const dto of createMonitoringDtos) {
      try {
        const result = await this.create(dto);
        results.push(result);
      } catch (error) {
        this.logger.error(`Failed to create monitoring data: ${error.message}`);
      }
    }
    return results;
  }

  async findAll(
    companyId?: number,
    deviceId?: number,
    radiusUserId?: number,
    status?: string,
    from?: Date,
    to?: Date,
  ): Promise<Monitoring[]> {
    const options: any = {
      relations: ['company', 'device', 'radiusUser'],
      order: { timestamp: 'DESC' },
    };

    const where: any[] = [];
    if (companyId) where.push({ companyId });
    if (deviceId) where.push({ deviceId });
    if (radiusUserId) where.push({ radiusUserId });
    if (status) where.push({ status });
    if (from) where.push({ timestamp: MoreThan(from) });
    if (to) where.push({ timestamp: LessThan(to) });

    if (where.length > 0) {
      options.where = where.length === 1 ? where[0] : { AND: where };
    }

    return this.monitoringRepository.find(options);
  }

  async findOne(id: number): Promise<Monitoring | null> {
    return this.monitoringRepository.findOne({
      where: { id },
      relations: ['company', 'device', 'radiusUser'],
    });
  }

  async findByDevice(deviceId: number, from?: Date, to?: Date): Promise<Monitoring[]> {
    const options: any = {
      where: { deviceId },
      relations: ['company', 'device', 'radiusUser'],
      order: { timestamp: 'DESC' },
    };
    if (from) options.where.timestamp = MoreThan(from);
    if (to) options.where.timestamp = { ...options.where.timestamp, ...{ lte: to } };
    return this.monitoringRepository.find(options);
  }

  async findByRadiusUser(radiusUserId: number, from?: Date, to?: Date): Promise<Monitoring[]> {
    const options: any = {
      where: { radiusUserId },
      relations: ['company', 'device', 'radiusUser'],
      order: { timestamp: 'DESC' },
    };
    if (from) options.where.timestamp = MoreThan(from);
    if (to) options.where.timestamp = { ...options.where.timestamp, ...{ lte: to } };
    return this.monitoringRepository.find(options);
  }

  async getDeviceStatus(deviceId: number): Promise<Monitoring | null> {
    return this.monitoringRepository.findOne({
      where: { deviceId },
      order: { timestamp: 'DESC' },
      relations: ['company', 'device'],
    });
  }

  async getStats(companyId: number, days: number = 7): Promise<{
    totalRecords: number;
    avgUploadSpeed: number;
    avgDownloadSpeed: number;
    avgLatency: number;
    avgPacketLoss: number;
    totalBytesUploaded: number;
    totalBytesDownloaded: number;
    deviceStatus: { deviceId: number; status: string; lastSeen: Date }[];
    onlineCount: number;
    offlineCount: number;
  }> {
    const fromDate = new Date();
    fromDate.setDate(fromDate.getDate() - days);

    const [records, allMonitoring] = await Promise.all([
      this.monitoringRepository.count({ where: { companyId, timestamp: MoreThan(fromDate) } }),
      this.monitoringRepository.find({
        where: { companyId, timestamp: MoreThan(fromDate) },
        relations: ['device'],
        order: { timestamp: 'DESC', deviceId: 'ASC' },
      }),
    ]);

    let totalUploadSpeed = 0;
    let totalDownloadSpeed = 0;
    let totalLatency = 0;
    let totalPacketLoss = 0;
    let totalBytesUp = 0;
    let totalBytesDown = 0;
    let count = 0;

    for (const m of allMonitoring) {
      if (m.uploadSpeed) { totalUploadSpeed += Number(m.uploadSpeed); count++; }
      if (m.downloadSpeed) { totalDownloadSpeed += Number(m.downloadSpeed); }
      if (m.latency) { totalLatency += Number(m.latency); }
      if (m.packetLoss) { totalPacketLoss += Number(m.packetLoss); }
      if (m.bytesUploaded) { totalBytesUp += Number(m.bytesUploaded); }
      if (m.bytesDownloaded) { totalBytesDown += Number(m.bytesDownloaded); }
    }

    const deviceStatusMap = new Map<number, { status: string; lastSeen: Date }>();
    for (const m of allMonitoring) {
      const deviceId = m.deviceId || 0;
      const existing = deviceStatusMap.get(deviceId) || { status: m.status || 'unknown', lastSeen: m.timestamp || new Date() };
      if (m.timestamp && m.timestamp > existing.lastSeen) {
        existing.status = m.status || existing.status;
        existing.lastSeen = m.timestamp;
      }
      deviceStatusMap.set(deviceId, existing);
    }

    let onlineCount = 0, offlineCount = 0;
    for (const status of deviceStatusMap.values()) {
      if (status.status === 'online') onlineCount++;
      if (status.status === 'offline') offlineCount++;
    }

    return {
      totalRecords: records,
      avgUploadSpeed: count > 0 ? totalUploadSpeed / count : 0,
      avgDownloadSpeed: count > 0 ? totalDownloadSpeed / count : 0,
      avgLatency: allMonitoring.length > 0 ? totalLatency / allMonitoring.length : 0,
      avgPacketLoss: allMonitoring.length > 0 ? totalPacketLoss / allMonitoring.length : 0,
      totalBytesUploaded: totalBytesUp,
      totalBytesDownloaded: totalBytesDown,
      deviceStatus: Array.from(deviceStatusMap.entries()).map(([deviceId, data]) => ({
        deviceId,
        status: data.status,
        lastSeen: data.lastSeen,
      })),
      onlineCount,
      offlineCount,
    };
  }

  async remove(id: number): Promise<void> {
    const monitoring = await this.findOne(id);
    if (!monitoring) {
      throw new NotFoundException(`Monitoring record #${id} not found`);
    }

    await this.monitoringRepository.delete(id);
    this.logger.log(`Monitoring record deleted: ${id}`);
  }

  async cleanupOldData(days: number = 90): Promise<{ deleted: number }> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    const result = await this.monitoringRepository.delete({
      timestamp: LessThan(cutoffDate),
    });

    this.logger.log(`Cleaned up ${result.affected} old monitoring records`);
    return { deleted: result.affected || 0 };
  }
}
