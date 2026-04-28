import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Session } from './entities/session.entity';
import { SessionsService } from './sessions.service';
import { SessionsController } from './sessions.controller';
import { CompaniesModule } from '../companies/companies.module';
import { RadiusUsersModule } from '../radius-users/radius-users.module';
import { CustomersModule } from '../customers/customers.module';
import { DevicesModule } from '../devices/devices.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Session]),
    CompaniesModule,
    RadiusUsersModule,
    CustomersModule,
    DevicesModule,
  ],
  controllers: [SessionsController],
  providers: [SessionsService],
  exports: [SessionsService],
})
export class SessionsModule {}
