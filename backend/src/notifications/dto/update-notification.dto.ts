import { PartialType, OmitType } from '@nestjs/swagger';
import { CreateNotificationDto } from './create-notification.dto';

export class UpdateNotificationDto extends PartialType(
  OmitType(CreateNotificationDto, ['companyId', 'userId', 'customerId', 'type', 'title', 'message'] as const)
) {}
