import { IsString, IsNotEmpty, IsNumber, IsOptional, IsEnum, IsBoolean, IsIP } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { DeviceType, DeviceStatus } from '../entities/device.entity';

export class CreateDeviceDto {
  @ApiProperty({ example: 1, description: 'ID of the company' })
  @IsNotEmpty()
  @IsNumber()
  companyId: number;

  @ApiProperty({ example: 'MikroTik Hex S' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: '192.168.1.1' })
  @IsIP()
  @IsNotEmpty()
  ipAddress: string;

  @ApiPropertyOptional({ example: 22, description: 'SSH port' })
  @IsNumber()
  @IsOptional()
  sshPort?: number;

  @ApiProperty({ example: 'admin' })
  @IsString()
  @IsNotEmpty()
  username: string;

  @ApiProperty({ example: 'securePassword123' })
  @IsString()
  @IsNotEmpty()
  password: string;

  @ApiPropertyOptional({ enum: DeviceType, example: DeviceType.BOTH })
  @IsEnum(DeviceType)
  @IsOptional()
  type?: DeviceType;

  @ApiPropertyOptional({ example: 'Mombasa HQ Router' })
  @IsString()
  @IsOptional()
  location?: string;

  @ApiPropertyOptional({ example: -4.043477, description: 'Latitude' })
  @IsNumber()
  @IsOptional()
  latitude?: number;

  @ApiPropertyOptional({ example: 39.668206, description: 'Longitude' })
  @IsNumber()
  @IsOptional()
  longitude?: number;

  @ApiPropertyOptional({ example: 'mikrotik' })
  @IsString()
  @IsOptional()
  nasIdentifier?: string;

  @ApiPropertyOptional({ example: '192.168.1.1' })
  @IsIP()
  @IsOptional()
  nasIpAddress?: string;

  @ApiProperty({ example: 'mySecureRadiusSecret' })
  @IsString()
  @IsNotEmpty()
  sharedSecret: string;

  @ApiPropertyOptional({ example: true, description: 'Device online status' })
  @IsBoolean()
  @IsOptional()
  status?: DeviceStatus;

  @ApiPropertyOptional({ example: 'Main gateway router' })
  @IsString()
  @IsOptional()
  notes?: string;
}
