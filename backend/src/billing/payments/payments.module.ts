import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Payment } from './entities/payment.entity';
import { PaymentsService } from './payments.service';
import { PaymentsController } from './payments.controller';
import { CompaniesModule } from '../../companies/companies.module';
import { CustomersModule } from '../../customers/customers.module';
import { MpesaModule } from '../../mpesa/mpesa.module';
import { InvoicesModule } from '../invoices/invoices.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Payment]),
    CompaniesModule,
    CustomersModule,
    MpesaModule,
    forwardRef(() => InvoicesModule),
  ],
  controllers: [PaymentsController],
  providers: [PaymentsService],
  exports: [PaymentsService],
})
export class PaymentsModule {}
