import { PartialType, OmitType } from '@nestjs/swagger';
import { CreateSettingDto } from './create-setting.dto';

export class UpdateSettingDto extends PartialType(
  OmitType(CreateSettingDto, ['companyId', 'key'] as const)
) {}
