import { IsString, IsNotEmpty, IsEmail, IsOptional, IsNumber, IsEnum, IsPhoneNumber } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CustomerStatus } from '../entities/customer.entity';

export class CreateCustomerDto {
  @ApiProperty({ example: 1, description: 'ID of the company' })
  @IsNotEmpty()
  @IsNumber()
  companyId: number;

  @ApiProperty({ example: 'John' })
  @IsString()
  @IsNotEmpty()
  firstName: string;

  @ApiPropertyOptional({ example: 'Doe' })
  @IsString()
  @IsOptional()
  lastName?: string;

  @ApiPropertyOptional({ example: 'john.doe@example.com' })
  @IsEmail()
  @IsOptional()
  email?: string;

  @ApiProperty({ example: '+254700000000' })
  @IsString()
  @IsNotEmpty()
  @IsPhoneNumber()
  phone: string;

  @ApiPropertyOptional({ example: '123 Main St, Mombasa' })
  @IsString()
  @IsOptional()
  address?: string;

  @ApiPropertyOptional({ example: 'Mombasa' })
  @IsString()
  @IsOptional()
  city?: string;

  @ApiPropertyOptional({ example: 'Kenya' })
  @IsString()
  @IsOptional()
  country?: string;

  @ApiPropertyOptional({ enum: CustomerStatus, example: CustomerStatus.ACTIVE })
  @IsEnum(CustomerStatus)
  @IsOptional()
  status?: CustomerStatus;

  @ApiPropertyOptional({ example: 'VIP customer' })
  @IsString()
  @IsOptional()
  notes?: string;

  @ApiPropertyOptional({ example: 1, description: 'ID of referring customer' })
  @IsNumber()
  @IsOptional()
  referredById?: number;

  @ApiPropertyOptional({ example: 0.0, description: 'Initial balance' })
  @IsNumber()
  @IsOptional()
  balance?: number;

  @ApiPropertyOptional({ example: 1000.0, description: 'Credit limit in KES' })
  @IsNumber()
  @IsOptional()
  creditLimit?: number;
}
