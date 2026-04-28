import { PartialType, OmitType } from '@nestjs/swagger';
import { CreateInvoiceDto } from './create-invoice.dto';

export class UpdateInvoiceDto extends PartialType(
  OmitType(CreateInvoiceDto, ['companyId', 'customerId', 'number'] as const)
) {}
