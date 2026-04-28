import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Invoice } from './entities/invoice.entity';
import { InvoicesService } from './invoices.service';
import { InvoicesController } from './invoices.controller';
import { CompaniesModule } from '../../companies/companies.module';
import { CustomersModule } from '../../customers/customers.module';
import { PlansModule } from '../../plans/plans.module';
import { PaymentsModule } from '../payments/payments.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Invoice]),
    CompaniesModule,
    CustomersModule,
    PlansModule,
    forwardRef(() => PaymentsModule),
  ],
  controllers: [InvoicesController],
  providers: [InvoicesService],
  exports: [InvoicesService],
})
export class InvoicesModule {}
