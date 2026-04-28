import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Notification } from './entities/notification.entity';
import { NotificationsService } from './notifications.service';
import { NotificationsController } from './notifications.controller';
import { CompaniesModule } from '../companies/companies.module';
import { AuthModule } from '../auth/auth.module';
import { CustomersModule } from '../customers/customers.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Notification]),
    CompaniesModule,
    AuthModule,
    CustomersModule,
  ],
  controllers: [NotificationsController],
  providers: [NotificationsService],
  exports: [NotificationsService, TypeOrmModule],
})
export class NotificationsModule {}
