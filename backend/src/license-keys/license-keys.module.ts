import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LicenseKey } from './entities/license-key.entity';
import { LicenseKeysService } from './license-keys.service';
import { LicenseKeysController } from './license-keys.controller';
import { CompaniesModule } from '../companies/companies.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([LicenseKey]),
    CompaniesModule,
  ],
  controllers: [LicenseKeysController],
  providers: [LicenseKeysService],
  exports: [LicenseKeysService, TypeOrmModule],
})
export class LicenseKeysModule {}
