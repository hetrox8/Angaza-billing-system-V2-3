import { Controller, Post, Body, UseGuards, Request, Logger } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { MpesaService } from './mpesa.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('M-Pesa')
@Controller('mpesa')
@ApiBearerAuth()
export class MpesaController {
  private readonly logger = new Logger(MpesaController.name);

  constructor(private readonly mpesaService: MpesaService) {}

  @Post('callback')
  @ApiOperation({ summary: 'M-Pesa callback endpoint (STK Push, C2B)' })
  async callback(@Body() callbackData: any, @Request() req: any) {
    this.logger.log('M-Pesa callback received', callbackData);
    await this.mpesaService.handleCallback(callbackData);
    return { ResultCode: 0, ResultDesc: 'Accepted' };
  }

  @Post('validation')
  @ApiOperation({ summary: 'M-Pesa C2B validation endpoint' })
  async validation(@Body() validationData: any) {
    const result = await this.mpesaService.validateMpesaRequest(validationData);
    return result;
  }

  @Post('confirmation')
  @ApiOperation({ summary: 'M-Pesa C2B confirmation endpoint' })
  async confirmation(@Body() confirmationData: any) {
    const result = await this.mpesaService.confirmMpesaRequest(confirmationData);
    return result;
  }

  @Post('stk-push')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Manual STK Push initiation' })
  @ApiBearerAuth()
  async stkPush(@Body() body: { phone: string; amount: number; accountReference: string; transactionId: string }) {
    return this.mpesaService.stkPush(
      body.phone,
      body.amount,
      body.accountReference,
      body.transactionId,
    );
  }

  @Post('verify')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Verify M-Pesa payment by RequestID' })
  @ApiBearerAuth()
  async verify(@Body() body: { requestId: string }) {
    return this.mpesaService.verifyPayment(body.requestId);
  }

  @Post('verify-receipt')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Verify M-Pesa payment by Receipt' })
  @ApiBearerAuth()
  async verifyReceipt(@Body() body: { receipt: string }) {
    return this.mpesaService.verifyMpesaReceipt(body.receipt);
  }

  @Post('reverse')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Reverse M-Pesa transaction' })
  @ApiBearerAuth()
  async reverse(@Body() body: { transactionId: string; amount: number; receiverParty: string; remarks: string }) {
    return this.mpesaService.reversePayment(
      body.transactionId,
      body.amount,
      body.receiverParty,
      body.remarks,
    );
  }

  @Post('balance')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Check M-Pesa account balance' })
  @ApiBearerAuth()
  async checkBalance() {
    return this.mpesaService.checkAccountBalance();
  }
}
