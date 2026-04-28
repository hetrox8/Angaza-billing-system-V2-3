import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Monitoring } from './entities/monitoring.entity';
import { MonitoringService } from './monitoring.service';
import { MonitoringController } from './monitoring.controller';
import { CompaniesModule } from '../companies/companies.module';
import { DevicesModule } from '../devices/devices.module';
import { RadiusUsersModule } from '../radius-users/radius-users.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Monitoring]),
    CompaniesModule,
    DevicesModule,
    RadiusUsersModule,
  ],
  controllers: [MonitoringController],
  providers: [MonitoringService],
  exports: [MonitoringService, TypeOrmModule],
})
export class MonitoringModule {}
