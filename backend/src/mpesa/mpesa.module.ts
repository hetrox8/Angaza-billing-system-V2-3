import { Module, Global } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';
import { MpesaService } from './mpesa.service';
import { MpesaController } from './mpesa.controller';

@Global()
@Module({
  imports: [HttpModule, ConfigModule.forRoot()],
  controllers: [MpesaController],
  providers: [MpesaService],
  exports: [MpesaService],
})
export class MpesaModule {}
