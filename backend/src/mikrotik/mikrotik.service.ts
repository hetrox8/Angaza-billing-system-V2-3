import { Injectable, Logger } from '@nestjs/common';
import { Device, DeviceType } from '../devices/entities/device.entity';
import { NodeSSH } from 'node-ssh';

interface MikroTikCommandResult {
  success: boolean;
  message: string;
  output?: string;
  error?: string;
}

interface MikroTikDeviceInfo {
  identity: string;
  version: string;
  uptime: string;
  boardName: string;
  platform: string;
}

interface MikroTikInterfaceStats {
  name: string;
  rxBytes: number;
  txBytes: number;
  rxPackets: number;
  txPackets: number;
}

interface MikroTikConnectionStats {
  pppoe: number;
  hotspot: number;
  total: number;
}

@Injectable()
export class MikroTikService {
  private readonly logger = new Logger(MikroTikService.name);
  private sshConnections: Map<number, NodeSSH> = new Map();

  private async getSSHConnection(device: Device): Promise<NodeSSH> {
    const key = device.id;
    
    if (this.sshConnections.has(key)) {
      const existing = this.sshConnections.get(key)!;
      if (existing.isConnected()) {
        return existing;
      }
      existing.dispose();
      this.sshConnections.delete(key);
    }

    const ssh = new NodeSSH();
    
    try {
      const password = device.passwordEncrypted || (device as any).password;
      
      await ssh.connect({
        host: device.ipAddress,
        port: device.sshPort || 22,
        username: device.username,
        password: password,
        readyTimeout: 10000,
      });

      this.sshConnections.set(key, ssh);
      return ssh;
    } catch (error: any) {
      this.logger.error(`SSH connection failed to ${device.ipAddress}: ${error.message}`);
      ssh.dispose();
      this.sshConnections.delete(key);
      throw new Error(`Failed to connect to device ${device.ipAddress}: ${error.message}`);
    }
  }

  private async executeSSHCommand(ssh: NodeSSH, command: string): Promise<MikroTikCommandResult> {
    try {
      const result = await ssh.execCommand(command);
      
      if (result.code !== 0) {
        return {
          success: false,
          message: `Command failed with code ${result.code}`,
          output: result.stdout,
          error: result.stderr,
        };
      }

      return {
        success: true,
        message: `Command executed successfully`,
        output: result.stdout,
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.message,
        output: '',
        error: error.message,
      };
    }
  }

  async executeCommand(
    device: Device,
    command: string,
    timeout: number = 5000,
  ): Promise<MikroTikCommandResult> {
    this.logger.debug(`[MikroTik] ${device.ipAddress}: ${command}`);
    const ssh = await this.getSSHConnection(device);
    return this.executeSSHCommand(ssh, command);
  }

  async getDeviceInfo(device: Device): Promise<MikroTikDeviceInfo> {
    try {
      const result = await this.executeCommand(device, '/system identity print');
      if (!result.success) {
        throw new Error(result.error || result.message);
      }

      const identityMatch = result.output?.match(/name:\s*(\S+)/i);
      
      const versionResult = await this.executeCommand(device, '/system package update print');
      const versionMatch = versionResult.output?.match(/current-version:\s*(\S+)/i) || 
                          versionResult.output?.match(/version:\s*(\S+)/i);

      const uptimeResult = await this.executeCommand(device, '/system clock print');
      const uptimeMatch = uptimeResult.output?.match(/uptime:\s*(.+)/i);

      const boardResult = await this.executeCommand(device, '/system routerboard print');
      const boardMatch = boardResult.output?.match(/model:\s*(\S+)/i);
      const platformMatch = boardResult.output?.match(/routerboard:\s*(yes|no)/i);

      return {
        identity: identityMatch ? identityMatch[1] : `MikroTik-${device.ipAddress.replace(/\./g, '')}`,
        version: versionMatch ? versionMatch[1] : '7.x',
        uptime: uptimeMatch ? uptimeMatch[1] : '0d 0h 0m 0s',
        boardName: boardMatch ? boardMatch[1] : 'Unknown',
        platform: platformMatch && platformMatch[1] === 'yes' ? 'MikroTik' : 'Unknown',
      };
    } catch (error: any) {
      this.logger.warn(`Failed to get device info from ${device.ipAddress}: ${error.message}`);
      return {
        identity: `MikroTik-${device.ipAddress.replace(/\./g, '')}`,
        version: '7.x',
        uptime: '0d 0h 0m 0s',
        boardName: 'Unknown',
        platform: 'MikroTik',
      };
    }
  }

  async getSystemResources(device: Device): Promise<any> {
    try {
      const result = await this.executeCommand(device, '/system resource print');
      
      const cpuLoadMatch = result.output?.match(/cpu-load:\s*(\d+)/i);
      const cpuFreqMatch = result.output?.match(/cpu-frequency:\s*(\d+)/i);
      const cpuCoresMatch = result.output?.match(/cpu-cores:\s*(\d+)/i);

      const memTotalMatch = result.output?.match(/total-memory:\s*(\d+)/i);
      const memUsedMatch = result.output?.match(/used-memory:\s*(\d+)/i);
      const memFreeMatch = result.output?.match(/free-memory:\s*(\d+)/i);

      const uptimeResult = await this.executeCommand(device, '/system clock print');
      const uptimeMatch = uptimeResult.output?.match(/uptime:\s*(.+)/i);
      const tempMatch = result.output?.match(/temperature:\s*([\d.]+)/i);

      return {
        cpu: {
          load: cpuLoadMatch ? parseFloat(cpuLoadMatch[1]) / 100 : 0,
          frequency: cpuFreqMatch ? parseInt(cpuFreqMatch[1], 10) : 0,
          cores: cpuCoresMatch ? parseInt(cpuCoresMatch[1], 10) : 0,
        },
        memory: {
          total: memTotalMatch ? parseInt(memTotalMatch[1], 10) : 0,
          used: memUsedMatch ? parseInt(memUsedMatch[1], 10) : 0,
          free: memFreeMatch ? parseInt(memFreeMatch[1], 10) : 0,
        },
        uptime: uptimeMatch ? uptimeMatch[1] : '0d 0h 0m',
        temperature: tempMatch ? parseFloat(tempMatch[1]) : 0,
      };
    } catch (error: any) {
      this.logger.warn(`Failed to get system resources from ${device.ipAddress}: ${error.message}`);
      return {
        cpu: { load: 0, frequency: 0, cores: 0 },
        memory: { total: 0, used: 0, free: 0 },
        uptime: '0d 0h 0m',
        temperature: 0,
      };
    }
  }

  async configureRadiusClient(
    device: Device,
    radiusServerIp: string,
    radiusSecret: string,
  ): Promise<MikroTikCommandResult> {
    const commands = [
      `/radius add service=pppoe address=${radiusServerIp} secret=${radiusSecret}`,
      `/radius add service=hotspot address=${radiusServerIp} secret=${radiusSecret}`,
    ];

    for (const cmd of commands) {
      const result = await this.executeCommand(device, cmd, 5000);
      if (!result.success) {
        return result;
      }
    }

    return {
      success: true,
      message: `RADIUS client configured for server ${radiusServerIp}`,
      output: `RADIUS client configured for server ${radiusServerIp}`,
    };
  }

  async configurePPPoE(
    device: Device,
    serviceName: string,
    interfaceName: string,
    ipPool: string,
  ): Promise<MikroTikCommandResult> {
    const commands = [
      `/interface pppoe-server server add service-name=${serviceName} interface=${interfaceName}`,
      `/ip pool add name=${ipPool} ranges=${ipPool}`,
      `/ppp profile set default=yes dns-server=8.8.8.8,8.8.4.4`,
    ];

    for (const cmd of commands) {
      const result = await this.executeCommand(device, cmd, 5000);
      if (!result.success) {
        return result;
      }
    }

    return {
      success: true,
      message: `PPPoE server configured with service name: ${serviceName}`,
      output: `PPPoE server configured with service name: ${serviceName}`,
    };
  }

  async configureHotspot(
    device: Device,
    name: string,
    interfaceName: string,
    ipPool: string,
  ): Promise<MikroTikCommandResult> {
    const commands = [
      `/ip hotspot add name=${name} interface=${interfaceName} address-pool=${ipPool}`,
      `/ip hotspot user profile set default radius=yes`,
    ];

    for (const cmd of commands) {
      const result = await this.executeCommand(device, cmd, 5000);
      if (!result.success) {
        return result;
      }
    }

    return {
      success: true,
      message: `Hotspot configured with name: ${name}`,
      output: `Hotspot configured with name: ${name}`,
    };
  }

  async addRadiusUser(
    device: Device,
    username: string,
    password: string,
    profile?: string,
  ): Promise<MikroTikCommandResult> {
    const profileCmd = profile ? ` profile=${profile}` : '';
    const command = `/ppp secret add name="${username}" password="${password}" service=pppoe${profileCmd}`;
    return this.executeCommand(device, command, 5000);
  }

  async addHotspotUser(
    device: Device,
    username: string,
    password: string,
    profile?: string,
  ): Promise<MikroTikCommandResult> {
    const profileCmd = profile ? ` profile=${profile}` : '';
    const command = `/ip hotspot user add name="${username}" password="${password}"${profileCmd}`;
    return this.executeCommand(device, command, 5000);
  }

  async removeRadiusUser(
    device: Device,
    username: string,
    serviceType: 'pppoe' | 'hotspot' = 'pppoe',
  ): Promise<MikroTikCommandResult> {
    const command = serviceType === 'pppoe' 
      ? `/ppp secret remove [find name="${username}"]`
      : `/ip hotspot user remove [find name="${username}"]`;
    return this.executeCommand(device, command, 5000);
  }

  async configureBandwidthLimit(
    device: Device,
    ipAddress: string,
    maxLimitUp: string,
    maxLimitDown: string,
    parent?: string,
  ): Promise<MikroTikCommandResult> {
    const parentCmd = parent ? ` parent=${parent}` : '';
    const command = `/queue simple add name="BW-${ipAddress.replace(/\./g, '-')}" target=${ipAddress} max-limit=${maxLimitUp}/${maxLimitDown}${parentCmd}`;
    return this.executeCommand(device, command, 5000);
  }

  async getConnectionStats(device: Device): Promise<MikroTikConnectionStats> {
    try {
      const pppoeResult = await this.executeCommand(device, '/ppp active print count-only');
      const pppoeMatch = pppoeResult.output?.match(/(\d+)/);
      
      const hotspotResult = await this.executeCommand(device, '/ip hotspot active print count-only');
      const hotspotMatch = hotspotResult.output?.match(/(\d+)/);

      const pppoe = pppoeMatch ? parseInt(pppoeMatch[1], 10) : 0;
      const hotspot = hotspotMatch ? parseInt(hotspotMatch[1], 10) : 0;

      return {
        pppoe,
        hotspot,
        total: pppoe + hotspot,
      };
    } catch (error: any) {
      this.logger.warn(`Failed to get connection stats from ${device.ipAddress}: ${error.message}`);
      return {
        pppoe: 0,
        hotspot: 0,
        total: 0,
      };
    }
  }

  async getInterfaceStats(device: Device, interfaceName: string): Promise<MikroTikInterfaceStats[]> {
    try {
      const result = await this.executeCommand(device, `/interface print stats-only [find name="${interfaceName}"]`);
      
      if (!result.success) {
        throw new Error(result.error || result.message);
      }

      const lines = result.output?.split('\n') || [];
      const stats: MikroTikInterfaceStats[] = [];

      for (const line of lines) {
        if (line.trim() === '') continue;
        const match = line.match(/^(\d+)\s+(\S+)\s+(\d+)\s+(\d+)\s+(\d+)\s+(\d+)/);
        if (match) {
          stats.push({
            name: match[2],
            rxBytes: parseInt(match[3], 10),
            txBytes: parseInt(match[4], 10),
            rxPackets: parseInt(match[5], 10),
            txPackets: parseInt(match[6], 10),
          });
        }
      }

      return stats.length > 0 ? stats : [
        {
          name: interfaceName,
          rxBytes: 0,
          txBytes: 0,
          rxPackets: 0,
          txPackets: 0,
        },
      ];
    } catch (error: any) {
      this.logger.warn(`Failed to get interface stats from ${device.ipAddress}: ${error.message}`);
      return [
        {
          name: interfaceName,
          rxBytes: 0,
          txBytes: 0,
          rxPackets: 0,
          txPackets: 0,
        },
      ];
    }
  }

  async getPPPoEActiveSessions(device: Device): Promise<string[]> {
    try {
      const result = await this.executeCommand(device, '/ppp active print');
      if (!result.success) {
        throw new Error(result.error || result.message);
      }

      const lines = result.output?.split('\n') || [];
      const usernames: string[] = [];

      for (const line of lines) {
        const match = line.match(/name="([^"]+)"/);
        if (match) {
          usernames.push(match[1]);
        }
      }

      return usernames;
    } catch (error: any) {
      this.logger.warn(`Failed to get PPPoE sessions from ${device.ipAddress}: ${error.message}`);
      return [];
    }
  }

  async getHotspotActiveSessions(device: Device): Promise<string[]> {
    try {
      const result = await this.executeCommand(device, '/ip hotspot active print');
      if (!result.success) {
        throw new Error(result.error || result.message);
      }

      const lines = result.output?.split('\n') || [];
      const users: string[] = [];

      for (const line of lines) {
        const match = line.match(/user="([^"]+)"/);
        if (match) {
          users.push(match[1]);
        }
      }

      return users;
    } catch (error: any) {
      this.logger.warn(`Failed to get Hotspot sessions from ${device.ipAddress}: ${error.message}`);
      return [];
    }
  }

  async kickUser(device: Device, username: string): Promise<MikroTikCommandResult> {
    const pppoeCommand = `/ppp active remove [find name="${username}"]`;
    const hotspotCommand = `/ip hotspot active remove [find user="${username}"]`;

    const pppoeResult = await this.executeCommand(device, pppoeCommand, 3000);
    if (pppoeResult.success) {
      return pppoeResult;
    }

    const hotspotResult = await this.executeCommand(device, hotspotCommand, 3000);
    if (hotspotResult.success) {
      return hotspotResult;
    }

    return {
      success: false,
      message: `User '${username}' not found in active sessions`,
      output: '',
      error: `User '${username}' not found in active sessions`,
    };
  }

  async provisionDevice(
    device: Device,
    radiusServerIp: string,
    radiusSecret: string,
    serviceName: string = 'Anagaza',
  ): Promise<{ success: boolean; message: string; commands?: string[] }> {
    const commands: string[] = [];
    const results: MikroTikCommandResult[] = [];

    this.logger.log(`Configuring RADIUS on ${device.ipAddress}...`);
    const radiusResult = await this.configureRadiusClient(device, radiusServerIp, radiusSecret);
    results.push(radiusResult);
    commands.push(
      `/radius add service=pppoe address=${radiusServerIp} secret=${radiusSecret}`,
      `/radius add service=hotspot address=${radiusServerIp} secret=${radiusSecret}`,
    );

    this.logger.log(`Configuring PPPoE on ${device.ipAddress}...`);
    const pppoeInterface = device.type === DeviceType.HOTSPOT ? 'ether2' : 'ether1';
    const pppoeResult = await this.configurePPPoE(device, serviceName, pppoeInterface, 'pppoe-pool');
    results.push(pppoeResult);
    commands.push(
      `/interface pppoe-server server add service-name=${serviceName} interface=${pppoeInterface}`,
      `/ip pool add name=pppoe-pool ranges=192.168.100.2-192.168.100.254`,
    );

    if (device.type === DeviceType.HOTSPOT || device.type === DeviceType.BOTH) {
      this.logger.log(`Configuring Hotspot on ${device.ipAddress}...`);
      const hotspotResult = await this.configureHotspot(device, serviceName, 'ether3', 'hotspot-pool');
      results.push(hotspotResult);
      commands.push(
        `/ip hotspot add name=${serviceName} interface=ether3 address-pool=hotspot-pool`,
        `/ip hotspot user profile set default radius=yes`,
      );
    }

    const allSuccess = results.every((r) => r.success);

    return {
      success: allSuccess,
      message: allSuccess
        ? `Device ${device.ipAddress} provisioned successfully`
        : `Device provisioning completed with some errors`,
      commands,
    };
  }

  generateProvisioningScript(
    radiusServerIp: string,
    radiusSecret: string,
    serviceName: string = 'Anagaza',
  ): string {
    return `# Anagaza Billing System - MikroTik Provisioning Script
# Generated: ${new Date().toISOString()}
# Radius Server: ${radiusServerIp}
# Service: ${serviceName}

# RADIUS for PPPoE
/radius add service=pppoe address=${radiusServerIp} secret=${radiusSecret}

# RADIUS for Hotspot
/radius add service=hotspot address=${radiusServerIp} secret=${radiusSecret}

# PPPoE Server
/interface pppoe-server server add service-name=${serviceName} interface=ether1 disabled=no
/ip pool add name=pppoe-pool ranges=192.168.100.2-192.168.100.254
/ppp profile set default=yes dns-server=8.8.8.8,8.8.4.4 use-ip-pool=pppoe-pool

# Hotspot
/ip hotspot add name=${serviceName}-hotspot interface=ether2 address-pool=hotspot-pool disabled=no
/ip pool add name=hotspot-pool ranges=192.168.101.2-192.168.101.254
/ip hotspot user profile set default radius=yes radius-accounting=yes

# Hotspot Profile
/ip hotspot profile add name=${serviceName}-profile hotspot-address=192.168.101.1 dns-name=${serviceName}
/ip hotspot set hotspot1 profile=${serviceName}-profile

# Save
/system configuration save
`;
  }

  generatePPPoEScript(
    radiusServerIp: string,
    radiusSecret: string,
    serviceName: string = 'Anagaza',
    interfaceName: string = 'ether1',
    ipPoolRange: string = '192.168.100.2-192.168.100.254',
  ): string {
    return `# Anagaza PPPoE Provisioning Script
# Radius Server: ${radiusServerIp}

# RADIUS
/radius add service=pppoe address=${radiusServerIp} secret=${radiusSecret}

# PPPoE Server
/interface pppoe-server server add service-name="${serviceName}" interface=${interfaceName} disabled=no

# IP Pool
/ip pool add name=${serviceName}-pppoe ranges=${ipPoolRange}

# PPPoE Profile
/ppp profile set default=yes dns-server=8.8.8.8,8.8.4.4 use-ip-pool=${serviceName}-pppoe

# Save
/system configuration save
`;
  }

  generateHotspotScript(
    radiusServerIp: string,
    radiusSecret: string,
    serviceName: string = 'Anagaza',
    interfaceName: string = 'ether2',
    ipPoolRange: string = '192.168.101.2-192.168.101.254',
    dnsName: string = 'Anagaza',
  ): string {
    return `# Anagaza Hotspot Provisioning Script
# Radius Server: ${radiusServerIp}

# RADIUS
/radius add service=hotspot address=${radiusServerIp} secret=${radiusSecret}

# IP Pool
/ip pool add name=${serviceName}-hotspot ranges=${ipPoolRange}

# Hotspot Service
/ip hotspot add name="${serviceName}" interface=${interfaceName} address-pool=${serviceName}-hotspot disabled=no

# Hotspot Profile
/ip hotspot profile add name=${serviceName}-profile hotspot-address=192.168.101.1 dns-name="${dnsName}"

# Enable RADIUS
/ip hotspot user profile set default radius=yes radius-accounting=yes
/ip hotspot set [find name="${serviceName}"] profile=${serviceName}-profile

# Save
/system configuration save
`;
  }
}
