import { IsString, IsNotEmpty, IsNumber, IsOptional, IsDateString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateAuditLogDto {
  @ApiProperty({ example: 1, description: 'ID of the company' })
  @IsNotEmpty()
  @IsNumber()
  companyId: number;

  @ApiPropertyOptional({ example: 1, description: 'ID of the user' })
  @IsNumber()
  @IsOptional()
  userId?: number;

  @ApiProperty({ example: 'created_customer', description: 'Action performed' })
  @IsString()
  @IsNotEmpty()
  action: string;

  @ApiProperty({ example: 'customer', description: 'Entity type' })
  @IsString()
  @IsNotEmpty()
  entityType: string;

  @ApiPropertyOptional({ example: 1, description: 'ID of the entity' })
  @IsNumber()
  @IsOptional()
  entityId?: number;

  @ApiPropertyOptional({ example: '192.168.1.1', description: 'IP address of the requester' })
  @IsString()
  @IsOptional()
  ipAddress?: string;

  @ApiPropertyOptional({ example: 'Mozilla/5.0...', description: 'User agent' })
  @IsString()
  @IsOptional()
  userAgent?: string;

  @ApiPropertyOptional({ description: 'Old values before change' })
  @IsOptional()
  oldValues?: any;

  @ApiPropertyOptional({ description: 'New values after change' })
  @IsOptional()
  newValues?: any;
}
