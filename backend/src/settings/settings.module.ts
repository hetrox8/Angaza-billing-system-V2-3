import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Setting } from './entities/setting.entity';
import { SettingsService } from './settings.service';
import { SettingsController } from './settings.controller';
import { CompaniesModule } from '../companies/companies.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Setting]),
    CompaniesModule,
  ],
  controllers: [SettingsController],
  providers: [SettingsService],
  exports: [SettingsService, TypeOrmModule],
})
export class SettingsModule {}
