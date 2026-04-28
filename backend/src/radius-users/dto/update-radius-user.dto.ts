import { PartialType } from '@nestjs/swagger';
import { CreateRadiusUserDto } from './create-radius-user.dto';

export class UpdateRadiusUserDto extends PartialType(CreateRadiusUserDto) {}
