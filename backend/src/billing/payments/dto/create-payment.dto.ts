import { IsString, IsNotEmpty, IsNumber, IsOptional, IsEnum } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PaymentMethod, PaymentStatus } from '../entities/payment.entity';

export class CreatePaymentDto {
  @ApiProperty({ example: 1, description: 'ID of the company' })
  @IsNotEmpty()
  @IsNumber()
  companyId: number;

  @ApiProperty({ example: 1, description: 'ID of the customer' })
  @IsNotEmpty()
  @IsNumber()
  customerId: number;

  @ApiPropertyOptional({ example: 1, description: 'ID of the invoice (optional)' })
  @IsNumber()
  @IsOptional()
  invoiceId?: number;

  @ApiProperty({ example: 1000.0, description: 'Payment amount in KES' })
  @IsNotEmpty()
  @IsNumber()
  amount: number;

  @ApiProperty({ enum: PaymentMethod, example: PaymentMethod.MPESA })
  @IsEnum(PaymentMethod)
  @IsNotEmpty()
  method: PaymentMethod;

  @ApiPropertyOptional({ example: 'MPESA123456789', description: 'Internal transaction reference' })
  @IsString()
  @IsOptional()
  transactionId?: string;

  @ApiPropertyOptional({ example: 'KCJ123456789', description: 'M-Pesa Receipt Number' })
  @IsString()
  @IsOptional()
  externalId?: string;

  @ApiPropertyOptional({ example: '+254700000000', description: 'Payer phone number (for M-Pesa)' })
  @IsString()
  @IsOptional()
  mpesaPhone?: string;

  @ApiPropertyOptional({ enum: PaymentStatus, example: PaymentStatus.PENDING })
  @IsEnum(PaymentStatus)
  @IsOptional()
  status?: PaymentStatus;

  @ApiPropertyOptional({ example: 'M-Pesa payment', description: 'Payment notes' })
  @IsString()
  @IsOptional()
  notes?: string;
}
