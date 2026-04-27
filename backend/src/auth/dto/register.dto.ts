import { IsEmail, IsNotEmpty, IsString, IsEnum, IsNumber } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { UserRole } from '../entities/user.entity';

export class RegisterDto {
  @ApiProperty({ example: 'Suleiman' })
  @IsString()
  @IsNotEmpty()
  firstName: string;

  @ApiProperty({ example: 'Gacheru' })
  @IsString()
  @IsNotEmpty()
  lastName: string;

  @ApiProperty({ example: 'suleiman@mwananchi.co.ke' })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({ example: 'Admin1234!' })
  @IsString()
  @IsNotEmpty()
  password: string;

  @ApiProperty({ enum: UserRole, example: UserRole.ADMIN })
  @IsEnum(UserRole)
  role: UserRole;

  @ApiProperty({ example: 1, description: 'ID of the company this user belongs to' })
  @IsNotEmpty()
  @IsNumber()
  companyId: number;
}