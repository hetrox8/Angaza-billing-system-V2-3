import { PartialType, OmitType } from '@nestjs/swagger';
import { CreateLicenseKeyDto } from './create-license-key.dto';

export class UpdateLicenseKeyDto extends PartialType(
  OmitType(CreateLicenseKeyDto, ['key', 'type'] as const)
) {}
