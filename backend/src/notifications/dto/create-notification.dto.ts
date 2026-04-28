import { IsString, IsNotEmpty, IsNumber, IsOptional, IsEnum, IsBoolean } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { NotificationType, NotificationChannel } from '../entities/notification.entity';

export class CreateNotificationDto {
  @ApiProperty({ example: 1, description: 'ID of the company' })
  @IsNotEmpty()
  @IsNumber()
  companyId: number;

  @ApiPropertyOptional({ example: 1, description: 'ID of the user' })
  @IsNumber()
  @IsOptional()
  userId?: number;

  @ApiPropertyOptional({ example: 1, description: 'ID of the customer' })
  @IsNumber()
  @IsOptional()
  customerId?: number;

  @ApiProperty({ enum: NotificationType, example: NotificationType.INVOICE })
  @IsEnum(NotificationType)
  @IsNotEmpty()
  type: NotificationType;

  @ApiProperty({ example: 'Invoice Payment Received', description: 'Notification title' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({ example: 'Your invoice #123 has been paid', description: 'Notification message' })
  @IsString()
  @IsNotEmpty()
  message: string;

  @ApiPropertyOptional({ description: 'Additional data' })
  @IsOptional()
  data?: any;

  @ApiPropertyOptional({ enum: NotificationChannel, example: [NotificationChannel.EMAIL], isArray: true })
  @IsEnum(NotificationChannel, { each: true })
  @IsOptional()
  sentVia?: NotificationChannel[];

  @ApiPropertyOptional({ example: false, description: 'Is notification read' })
  @IsBoolean()
  @IsOptional()
  isRead?: boolean;
}
