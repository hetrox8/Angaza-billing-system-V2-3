import { IsString, IsNotEmpty, IsNumber, IsOptional, IsEnum, IsBoolean } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';


export class CreateRadiusUserDto {
  @ApiProperty({ example: 1, description: 'ID of the company' })
  @IsNotEmpty()
  @IsNumber()
  companyId: number;


  @ApiProperty({ example: 1, description: 'ID of the customer' })
  @IsNotEmpty()
  @IsNumber()
  customerId: number;


  @ApiPropertyOptional({ example: 1, description: 'ID of the device' })
  @IsNumber()
  @IsOptional()
  deviceId?: number;


  @ApiProperty({ example: 1, description: 'ID of the plan to assign' })
  @IsNumber()
  @IsOptional()
  planId?: number;


  @ApiProperty({ example: 'johndoe' })
  @IsString()
  @IsNotEmpty()
  username: string;


  @ApiProperty({ example: 'radiusPassword123' })
  @IsString()
  @IsNotEmpty()
  password: string;


  @ApiPropertyOptional({ example: '192.168.100.2-192.168.100.254', description: 'IP pool for Hotspot' })
  @IsString()
  @IsOptional()
  ipPool?: string;


  @ApiPropertyOptional({ example: '00:11:22:33:44:55', description: 'MAC address for filtering' })
  @IsString()
  @IsOptional()
  macAddress?: string;


  @ApiPropertyOptional({ example: 'Wireless-802.11', description: 'NAS port type' })
  @IsString()
  @IsOptional()
  nasPortType?: string;


  @ApiPropertyOptional({ example: true, description: 'Whether user is active' })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;


  @ApiPropertyOptional({ example: false, description: 'Whether user is locked' })
  @IsBoolean()
  @IsOptional()
  isLocked?: boolean;


  @ApiPropertyOptional({ example: '2024-01-01T00:00:00Z', description: 'Start date' })
  @IsString()
  @IsOptional()
  startDate?: string;


  @ApiPropertyOptional({ example: '2024-12-31T23:59:59Z', description: 'Expiry date for prepaid' })
  @IsString()
  @IsOptional()
  expiryDate?: string;


  @ApiPropertyOptional({ example: '10M', description: 'Upload speed limit (e.g., 10M, 5M)' })
  @IsString()
  @IsOptional()
  speedLimitUp?: string;


  @ApiPropertyOptional({ example: '10M', description: 'Download speed limit (e.g., 10M, 5M)' })
  @IsString()
  @IsOptional()
  speedLimitDown?: string;
}
