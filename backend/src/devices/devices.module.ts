import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DevicesController } from './devices.controller';
import { DevicesService } from './devices.service';
import { Device } from './entities/device.entity';
import { CompaniesModule } from '../companies/companies.module';
import { MikroTikModule } from '../mikrotik/mikrotik.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Device]),
    CompaniesModule,
    MikroTikModule,
  ],
  controllers: [DevicesController],
  providers: [DevicesService],
  exports: [DevicesService],
})
export class DevicesModule {}
