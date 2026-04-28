import { IsString, IsNotEmpty, IsNumber, IsOptional, IsDateString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateMonitoringDto {
  @ApiProperty({ example: 1, description: 'ID of the company' })
  @IsNotEmpty()
  @IsNumber()
  companyId: number;

  @ApiPropertyOptional({ example: 1, description: 'ID of the device' })
  @IsNumber()
  @IsOptional()
  deviceId?: number;

  @ApiPropertyOptional({ example: 1, description: 'ID of the radius user' })
  @IsNumber()
  @IsOptional()
  radiusUserId?: number;

  @ApiPropertyOptional({ example: '2024-01-01T12:00:00Z', description: 'Timestamp of monitoring data' })
  @IsDateString()
  @IsOptional()
  timestamp?: string;

  @ApiPropertyOptional({ example: 100.5, description: 'Upload speed in Mbps' })
  @IsNumber()
  @IsOptional()
  uploadSpeed?: number;

  @ApiPropertyOptional({ example: 50.2, description: 'Download speed in Mbps' })
  @IsNumber()
  @IsOptional()
  downloadSpeed?: number;

  @ApiPropertyOptional({ example: 15, description: 'Latency in ms' })
  @IsNumber()
  @IsOptional()
  latency?: number;

  @ApiPropertyOptional({ example: 0.5, description: 'Packet loss percentage' })
  @IsNumber()
  @IsOptional()
  packetLoss?: number;

  @ApiPropertyOptional({ example: 1073741824, description: 'Bytes uploaded' })
  @IsNumber()
  @IsOptional()
  bytesUploaded?: number;

  @ApiPropertyOptional({ example: 5368709120, description: 'Bytes downloaded' })
  @IsNumber()
  @IsOptional()
  bytesDownloaded?: number;

  @ApiPropertyOptional({ example: -65, description: 'Signal strength in dBm' })
  @IsNumber()
  @IsOptional()
  signalStrength?: number;

  @ApiPropertyOptional({ example: 45.2, description: 'CPU usage percentage' })
  @IsNumber()
  @IsOptional()
  cpuUsage?: number;

  @ApiPropertyOptional({ example: 75.8, description: 'Memory usage percentage' })
  @IsNumber()
  @IsOptional()
  memoryUsage?: number;

  @ApiPropertyOptional({ example: 86400, description: 'Uptime in seconds' })
  @IsNumber()
  @IsOptional()
  uptime?: number;

  @ApiPropertyOptional({ example: 25, description: 'Number of connected clients' })
  @IsNumber()
  @IsOptional()
  connectedClients?: number;

  @ApiPropertyOptional({ example: 'online', description: 'Device status' })
  @IsString()
  @IsOptional()
  status?: string;

  @ApiPropertyOptional({ description: 'Additional metadata' })
  @IsOptional()
  metadata?: any;
}
