import { IsString, IsNotEmpty, IsNumber, IsOptional, IsEnum, IsBoolean } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { LicenseType } from '../../companies/entities/license-type.enum';

export class CreateLicenseKeyDto {
  @ApiPropertyOptional({ example: 1, description: 'ID of the company' })
  @IsNumber()
  @IsOptional()
  companyId?: number;

  @ApiProperty({ example: 'ANGAZA-LICENSE-XXXX-XXXX-XXXX', description: 'License key string' })
  @IsString()
  @IsNotEmpty()
  key: string;

  @ApiProperty({ enum: LicenseType, example: LicenseType.MONTHLY })
  @IsEnum(LicenseType)
  @IsNotEmpty()
  type: LicenseType;

  @ApiProperty({ example: 10, description: 'Maximum devices allowed' })
  @IsNumber()
  @IsNotEmpty()
  maxDevices: number;

  @ApiProperty({ example: 1000, description: 'Maximum customers allowed' })
  @IsNumber()
  @IsNotEmpty()
  maxCustomers: number;

  @ApiPropertyOptional({ example: '2024-12-31', description: 'Expiry date' })
  @IsOptional()
  expiresAt?: Date;

  @ApiPropertyOptional({ example: true, description: 'Is license active' })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
