import { IsString, IsNotEmpty, IsNumber, IsOptional, IsEnum, IsDateString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { InvoiceStatus } from '../entities/invoice.entity';

export class CreateInvoiceDto {
  @ApiProperty({ example: 1, description: 'ID of the company' })
  @IsNotEmpty()
  @IsNumber()
  companyId: number;

  @ApiProperty({ example: 1, description: 'ID of the customer' })
  @IsNotEmpty()
  @IsNumber()
  customerId: number;

  @ApiPropertyOptional({ example: 1, description: 'ID of the plan (optional)' })
  @IsNumber()
  @IsOptional()
  planId?: number;

  @ApiProperty({ example: 'INV-001', description: 'Invoice number' })
  @IsString()
  @IsNotEmpty()
  number: string;

  @ApiProperty({ example: 1000.0, description: 'Subtotal amount in KES' })
  @IsNumber()
  @IsNotEmpty()
  subtotal: number;

  @ApiPropertyOptional({ example: 160.0, description: 'Tax amount in KES' })
  @IsNumber()
  @IsOptional()
  tax?: number;

  @ApiProperty({ example: 0.0, description: 'Discount amount in KES' })
  @IsNumber()
  @IsOptional()
  discount?: number;

  @ApiProperty({ example: '2024-12-31', description: 'Due date (YYYY-MM-DD)' })
  @IsDateString()
  @IsNotEmpty()
  dueDate: string;

  @ApiPropertyOptional({ example: 'Monthly subscription', description: 'Invoice notes' })
  @IsString()
  @IsOptional()
  notes?: string;

  @ApiPropertyOptional({ enum: InvoiceStatus, example: InvoiceStatus.DRAFT })
  @IsEnum(InvoiceStatus)
  @IsOptional()
  status?: InvoiceStatus;
}
