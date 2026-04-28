import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Device, DeviceType, DeviceStatus } from './entities/device.entity';
import { CompaniesService } from '../companies/companies.service';
import { MikroTikService } from '../mikrotik/mikrotik.service';
import { CreateDeviceDto } from './dto/create-device.dto';
import { UpdateDeviceDto } from './dto/update-device.dto';

@Injectable()
export class DevicesService {
  constructor(
    @InjectRepository(Device)
    private devicesRepository: Repository<Device>,
    private readonly companiesService: CompaniesService,
    private readonly mikrotikService: MikroTikService,
  ) {}

  async create(createDeviceDto: CreateDeviceDto): Promise<Device> {
    const company = await this.companiesService.findOne(createDeviceDto.companyId);
    if (!company) {
      throw new NotFoundException(`Company #${createDeviceDto.companyId} not found`);
    }

    const existingDevice = await this.devicesRepository.findOne({
      where: { ipAddress: createDeviceDto.ipAddress, company: { id: createDeviceDto.companyId } },
    });

    if (existingDevice) {
      throw new BadRequestException(`Device with IP ${createDeviceDto.ipAddress} already exists for this company`);
    }

    const { companyId, password, ...deviceData } = createDeviceDto;
    const device = this.devicesRepository.create({
      ...deviceData,
      company,
      type: deviceData.type || DeviceType.BOTH,
      nasIdentifier: deviceData.nasIdentifier || 'mikrotik',
      status: DeviceStatus.OFFLINE,
    });

    return this.devicesRepository.save(device);
  }

  async findAll(companyId?: number): Promise<Device[]> {
    const options: any = { 
      relations: ['company', 'radiusUsers', 'sessions'],
      order: { name: 'ASC' }
    };
    if (companyId) {
      options.where = { company: { id: companyId } };
    }
    return this.devicesRepository.find(options);
  }

  async findOne(id: number): Promise<Device | null> {
    return this.devicesRepository.findOne({
      where: { id },
      relations: ['company', 'radiusUsers', 'sessions'],
    });
  }

  async findByIp(ipAddress: string): Promise<Device | null> {
    return this.devicesRepository.findOne({
      where: { ipAddress },
      relations: ['company'],
    });
  }

  async findByCompany(companyId: number): Promise<Device[]> {
    return this.devicesRepository.find({
      where: { company: { id: companyId } },
      relations: ['company'],
      order: { name: 'ASC' },
    });
  }

  async update(id: number, updateDeviceDto: UpdateDeviceDto): Promise<Device> {
    const device = await this.findOne(id);
    if (!device) {
      throw new NotFoundException(`Device #${id} not found`);
    }

    await this.devicesRepository.update(id, updateDeviceDto);
    return this.findOne(id) as Promise<Device>;
  }

  async remove(id: number): Promise<void> {
    const device = await this.findOne(id);
    if (!device) {
      throw new NotFoundException(`Device #${id} not found`);
    }
    await this.devicesRepository.delete(id);
  }

  async updateStatus(id: number, status: DeviceStatus): Promise<Device> {
    const device = await this.findOne(id);
    if (!device) {
      throw new NotFoundException(`Device #${id} not found`);
    }

    await this.devicesRepository.update(id, { 
      status,
      lastSeenAt: status === DeviceStatus.ONLINE ? new Date() : null as any
    });

    return this.findOne(id) as Promise<Device>;
  }

  async testConnection(id: number): Promise<{ success: boolean; message: string; device?: Device }> {
    const device = await this.findOne(id);
    if (!device) {
      throw new NotFoundException(`Device #${id} not found`);
    }

    return this.mikrotikService.executeCommand(device, '/system identity print', 5000);
  }

  async testRadiusConfig(id: number): Promise<{ success: boolean; message: string; device?: Device }> {
    const device = await this.findOne(id);
    if (!device) {
      throw new NotFoundException(`Device #${id} not found`);
    }

    const radiusServerIp = process.env.RADIUS_SERVER_IP || 'localhost';
    const radiusSecret = process.env.RADIUS_SECRET || 'testing123';
    
    return this.mikrotikService.configureRadiusClient(device, radiusServerIp, radiusSecret);
  }

  async getTelemetry(id: number): Promise<{ 
    success: boolean; 
    message?: string; 
    telemetry?: any;
    device?: Device 
  }> {
    const device = await this.findOne(id);
    if (!device) {
      throw new NotFoundException(`Device #${id} not found`);
    }

    try {
      const deviceInfo = await this.mikrotikService.getDeviceInfo(device);
      const resources = await this.mikrotikService.getSystemResources(device);
      const connectionStats = await this.mikrotikService.getConnectionStats(device);

      return {
        success: true,
        telemetry: {
          ...deviceInfo,
          ...resources,
          connections: connectionStats,
        },
        device,
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.message,
        device,
      };
    }
  }

  async provision(id: number): Promise<{ success: boolean; message: string; device?: Device; script?: string }> {
    const device = await this.findOne(id);
    if (!device) {
      throw new NotFoundException(`Device #${id} not found`);
    }

    const radiusServerIp = process.env.RADIUS_SERVER_IP || 'localhost';
    const radiusSecret = process.env.RADIUS_SECRET || 'testing123';

    try {
      const result = await this.mikrotikService.provisionDevice(
        device,
        radiusServerIp,
        radiusSecret,
        'Anagaza'
      );

      const script = this.mikrotikService.generateProvisioningScript(radiusServerIp, radiusSecret);

      return {
        success: result.success,
        message: result.message,
        device,
        script,
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.message,
        device,
      };
    }
  }

  async generateScript(
    id: number,
    scriptType: 'full' | 'pppoe' | 'hotspot' = 'full',
  ): Promise<{ success: boolean; message: string; script: string }> {
    const device = await this.findOne(id);
    if (!device) {
      throw new NotFoundException(`Device #${id} not found`);
    }

    const radiusServerIp = process.env.RADIUS_SERVER_IP || 'localhost';
    const radiusSecret = process.env.RADIUS_SECRET || 'testing123';

    let script: string;

    switch (scriptType) {
      case 'full':
        script = this.mikrotikService.generateProvisioningScript(radiusServerIp, radiusSecret);
        break;
      case 'pppoe':
        script = this.mikrotikService.generatePPPoEScript(radiusServerIp, radiusSecret);
        break;
      case 'hotspot':
        script = this.mikrotikService.generateHotspotScript(radiusServerIp, radiusSecret);
        break;
      default:
        script = this.mikrotikService.generateProvisioningScript(radiusServerIp, radiusSecret);
    }

    return {
      success: true,
      message: `Generated ${scriptType} provisioning script`,
      script,
    };
  }

  async markOnline(id: number): Promise<Device> {
    return this.updateStatus(id, DeviceStatus.ONLINE);
  }

  async markOffline(id: number): Promise<Device> {
    return this.updateStatus(id, DeviceStatus.OFFLINE);
  }
}





