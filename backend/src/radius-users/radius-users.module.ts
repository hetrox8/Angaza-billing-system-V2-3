import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { RadiusUsersController } from './radius-users.controller';
import { RadiusUsersService } from './radius-users.service';
import { RadiusUser } from './entities/radius-user.entity';
// FreeRADIUS SQL entities
import { RadCheck, RadReply, RadUserGroup, RadGroupCheck, RadGroupReply } from './entities/radius-sql.entity';
import { CompaniesModule } from '../companies/companies.module';
import { CustomersModule } from '../customers/customers.module';
import { DevicesModule } from '../devices/devices.module';
import { PlansModule } from '../plans/plans.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      RadiusUser,
      RadCheck,
      RadReply,
      RadUserGroup,
      RadGroupCheck,
      RadGroupReply,
    ]),
    CompaniesModule,
    CustomersModule,
    DevicesModule,
    PlansModule,
  ],
  controllers: [RadiusUsersController],
  providers: [
    RadiusUsersService,
    {
      provide: DataSource,
      inject: [DataSource],
      useExisting: DataSource,
    },
  ],
  exports: [RadiusUsersService],
})
export class RadiusUsersModule {}
