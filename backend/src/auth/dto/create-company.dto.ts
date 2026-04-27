import { IsString, IsEmail, IsNotEmpty, IsEnum, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { LicenseType } from '../../companies/entities/company.entity';

export class CreateCompanyDto {
  @ApiProperty({ example: 'Mwananchi Telecom' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional({ example: 'admin@mwananchi.co.ke' })
  @IsEmail()
  @IsOptional()
  email?: string;

  @ApiPropertyOptional({ example: '+254700000000' })
  @IsString()
  @IsOptional()
  phone?: string;

  @ApiPropertyOptional({ example: 'Mombasa, Kenya' })
  @IsString()
  @IsOptional()
  address?: string;

  @ApiPropertyOptional({ enum: LicenseType, example: LicenseType.TRIAL })
  @IsEnum(LicenseType)
  @IsOptional()
  licenseType?: LicenseType;
}