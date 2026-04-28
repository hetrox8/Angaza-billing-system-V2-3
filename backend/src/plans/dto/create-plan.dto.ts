import { IsString, IsNotEmpty, IsNumber, IsOptional, IsEnum, IsBoolean, IsDecimal } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PlanBillingCycle, PlanType } from '../entities/plan.entity';

export class CreatePlanDto {
  @ApiProperty({ example: 1, description: 'ID of the company' })
  @IsNotEmpty()
  @IsNumber()
  companyId: number;

  @ApiProperty({ example: 'Premium 10Mbps' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional({ example: 'High-speed internet plan for business users' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ example: 10240, description: 'Speed up in Kbps (10Mbps = 10240 Kbps)' })
  @IsNumber()
  @IsNotEmpty()
  speedUp: number;

  @ApiProperty({ example: 10240, description: 'Speed down in Kbps' })
  @IsNumber()
  @IsNotEmpty()
  speedDown: number;

  @ApiPropertyOptional({ example: 20480, description: 'Burst speed up in Kbps' })
  @IsNumber()
  @IsOptional()
  burstUp?: number;

  @ApiPropertyOptional({ example: 20480, description: 'Burst speed down in Kbps' })
  @IsNumber()
  @IsOptional()
  burstDown?: number;

  @ApiPropertyOptional({ example: 107374182400, description: 'Data cap in bytes (100GB = 107374182400)' })
  @IsNumber()
  @IsOptional()
  dataCap?: number;

  @ApiProperty({ example: 2500.0, description: 'Monthly price in KES' })
  @IsNumber()
  @IsNotEmpty()
  price: number;

  @ApiPropertyOptional({ example: 500.0, description: 'One-time setup fee in KES' })
  @IsNumber()
  @IsOptional()
  setupFee?: number;

  @ApiPropertyOptional({ example: 16.0, description: 'Tax rate percentage' })
  @IsNumber()
  @IsOptional()
  taxRate?: number;

  @ApiPropertyOptional({ enum: PlanBillingCycle, example: PlanBillingCycle.MONTHLY })
  @IsEnum(PlanBillingCycle)
  @IsOptional()
  billingCycle?: PlanBillingCycle;

  @ApiPropertyOptional({ enum: PlanType, example: PlanType.POSTPAID })
  @IsEnum(PlanType)
  @IsOptional()
  type?: PlanType;

  @ApiPropertyOptional({ example: true, description: 'Whether plan is recurring' })
  @IsBoolean()
  @IsOptional()
  isRecurring?: boolean;

  @ApiPropertyOptional({ example: true, description: 'Whether plan is active' })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @ApiPropertyOptional({ example: 0, description: 'Sort order for display' })
  @IsNumber()
  @IsOptional()
  sortOrder?: number;
}
