import { PartialType, OmitType } from '@nestjs/swagger';
import { CreateVoucherDto } from './create-voucher.dto';

export class UpdateVoucherDto extends PartialType(
  OmitType(CreateVoucherDto, ['companyId', 'planId', 'createdById'] as const)
) {}
