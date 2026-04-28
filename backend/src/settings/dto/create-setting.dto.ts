import { IsString, IsNotEmpty, IsNumber, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateSettingDto {
  @ApiProperty({ example: 1, description: 'ID of the company' })
  @IsNotEmpty()
  @IsNumber()
  companyId: number;

  @ApiProperty({ example: 'mpesa_consumer_key', description: 'Setting key' })
  @IsString()
  @IsNotEmpty()
  key: string;

  @ApiProperty({ example: { apiKey: 'abc123' }, description: 'Setting value (can be any type)' })
  @IsNotEmpty()
  value: any;

  @ApiPropertyOptional({ example: 'M-Pesa API Consumer Key', description: 'Setting description' })
  @IsString()
  @IsOptional()
  description?: string;
}
