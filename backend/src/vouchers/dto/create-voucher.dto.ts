import { IsString, IsNotEmpty, IsNumber, IsOptional, IsDateString, IsBoolean } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateVoucherDto {
  @ApiProperty({ example: 1, description: 'ID of the company' })
  @IsNotEmpty()
  @IsNumber()
  companyId: number;

  @ApiProperty({ example: 1, description: 'ID of the plan' })
  @IsNotEmpty()
  @IsNumber()
  planId: number;

  @ApiPropertyOptional({ example: 'BATCH-2024-001', description: 'Batch name for voucher grouping' })
  @IsString()
  @IsOptional()
  batchName?: string;

  @ApiPropertyOptional({ example: '2024-12-31', description: 'Expiry date (YYYY-MM-DD)' })
  @IsDateString()
  @IsOptional()
  expiryDate?: string;

  @ApiPropertyOptional({ example: 100, description: 'Number of vouchers to generate' })
  @IsNumber()
  @IsOptional()
  count?: number;

  @ApiPropertyOptional({ example: 1, description: 'ID of the user creating this voucher' })
  @IsNumber()
  @IsOptional()
  createdById?: number;
}
