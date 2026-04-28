import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { HttpModule } from '@nestjs/axios';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { CompaniesModule } from './companies/companies.module';
import { CustomersModule } from './customers/customers.module';
import { PlansModule } from './plans/plans.module';
import { DevicesModule } from './devices/devices.module';
import { RadiusUsersModule } from './radius-users/radius-users.module';
import { MikroTikModule } from './mikrotik/mikrotik.module';
import { SessionsModule } from './sessions/sessions.module';
import { BillingModule } from './billing/billing.module';
import { MpesaModule } from './mpesa/mpesa.module';
import { VouchersModule } from './vouchers/vouchers.module';
import { MonitoringModule } from './monitoring/monitoring.module';
import { AuditLogsModule } from './audit-logs/audit-logs.module';
import { NotificationsModule } from './notifications/notifications.module';
import { SettingsModule } from './settings/settings.module';
import { LicenseKeysModule } from './license-keys/license-keys.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    HttpModule,
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST || 'postgres',
      port: process.env.DB_PORT ? parseInt(process.env.DB_PORT, 10) : 5432,
      username: process.env.DB_USERNAME || 'anagaza',
      password: process.env.DB_PASSWORD || 'anagaza123',
      database: process.env.DB_NAME || 'anagaza',
      entities: [__dirname + '/**/*.entity{.ts,.js}'],
      synchronize: process.env.NODE_ENV !== 'production',
      migrations: ['dist/migrations/*{.ts,.js}'],
      autoLoadEntities: true,
      logging: process.env.NODE_ENV !== 'test',
    }),
    AuthModule,
    CompaniesModule,
    CustomersModule,
    PlansModule,
    DevicesModule,
    RadiusUsersModule,
    MikroTikModule,
    SessionsModule,
    BillingModule,
    MpesaModule,
    VouchersModule,
    MonitoringModule,
    AuditLogsModule,
    NotificationsModule,
    SettingsModule,
    LicenseKeysModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
