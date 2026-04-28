import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Voucher } from './entities/voucher.entity';
import { VouchersService } from './vouchers.service';
import { VouchersController } from './vouchers.controller';
import { CompaniesModule } from '../companies/companies.module';
import { PlansModule } from '../plans/plans.module';
import { CustomersModule } from '../customers/customers.module';
import { RadiusUsersModule } from '../radius-users/radius-users.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Voucher]),
    CompaniesModule,
    PlansModule,
    CustomersModule,
    RadiusUsersModule,
  ],
  controllers: [VouchersController],
  providers: [VouchersService],
  exports: [VouchersService, TypeOrmModule],
})
export class VouchersModule {}
