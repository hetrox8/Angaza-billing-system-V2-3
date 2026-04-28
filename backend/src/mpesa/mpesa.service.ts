import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

interface MpesaAuthResponse {
  access_token: string;
  expires_in: number;
}

@Injectable()
export class MpesaService {
  private readonly logger = new Logger(MpesaService.name);
  private readonly baseUrl: string = 'https://sandbox.safaricom.co.ke';
  // Production: https://api.safaricom.co.ke

  private accessToken: string | null = null;
  private tokenExpiry: Date | null = null;

  constructor(
    private readonly configService: ConfigService,
    private readonly httpService: HttpService,
  ) {}

  private get consumerKey(): string {
    return this.configService.get<string>('MPESA_CONSUMER_KEY', '');
  }

  private get consumerSecret(): string {
    return this.configService.get<string>('MPESA_CONSUMER_SECRET', '');
  }

  private get businessShortCode(): string {
    return this.configService.get<string>('MPESA_BUSINESS_SHORT_CODE', '174379');
  }

  private get passKey(): string {
    return this.configService.get<string>('MPESA_PASS_KEY', '');
  }

  private get callbackURL(): string {
    return this.configService.get<string>('MPESA_CALLBACK_URL', 'https://yourdomain.com/api/mpesa/callback');
  }

  private get authUrl(): string {
    return `${this.baseUrl}/oauth/v1/generate?grant_type=client_credentials`;
  }

  private async getAccessToken(): Promise<string> {
    if (this.accessToken && this.tokenExpiry && this.tokenExpiry > new Date()) {
      return this.accessToken;
    }

    const authString = Buffer.from(`${this.consumerKey}:${this.consumerSecret}`).toString('base64');

    try {
      const response = await firstValueFrom(
        this.httpService.get(this.authUrl, {
          headers: { Authorization: `Basic ${authString}` },
        }),
      );

      const data = response.data as MpesaAuthResponse;
      this.accessToken = data.access_token;
      this.tokenExpiry = new Date(Date.now() + (data.expires_in - 300) * 1000); // 5 min buffer
      
      return this.accessToken;
    } catch (error) {
      this.logger.error('Failed to get M-Pesa access token', error);
      throw new Error('Failed to authenticate with M-Pesa API');
    }
  }

  private async mpesaRequest(endpoint: string, payload: any, method: 'post' | 'get' = 'post'): Promise<any> {
    const token = await this.getAccessToken();

    const url = `${this.baseUrl}${endpoint}`;

    try {
      const response = await firstValueFrom(
        this.httpService[method](url, payload, {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }),
      );

      return response.data;
    } catch (error: any) {
      this.logger.error(`M-Pesa ${method.toUpperCase()} ${endpoint} failed`, error.response?.data || error.message);
      
      if (error.response) {
        return {
          success: false,
          errorMessage: error.response.data?.errorMessage || error.response.data?.errorCode || 'Unknown error',
          gatewayResponse: error.response.data,
        };
      }
      
      return {
        success: false,
        errorMessage: error.message,
        gatewayResponse: null,
      };
    }
  }

  async stkPush(phone: string, amount: number, accountReference: string, transactionId: string): Promise<{ 
    success: boolean;
    requestId?: string;
    errorMessage?: string;
    gatewayResponse?: any;
  }> {
    const timestamp = new Date().toISOString().replace(/[-:.]/g, '').slice(0, -5);
    const password = Buffer.from(`${this.businessShortCode}${this.passKey}${timestamp}`).toString('base64');

    const payload = {
      BusinessShortCode: this.businessShortCode,
      Password: password,
      Timestamp: timestamp,
      TransactionType: 'CustomerPayBillOnline',
      Amount: Math.round(amount),
      PartyA: this.formatPhoneNumber(phone),
      PartyB: this.businessShortCode,
      PhoneNumber: this.formatPhoneNumber(phone),
      CallBackURL: this.callbackURL,
      AccountReference: accountReference,
      TransactionDesc: `Payment for ${accountReference}`,
    };

    this.logger.log(`STK Push request for phone: ${phone}, amount: ${amount}, ref: ${accountReference}`);

    const result = await this.mpesaRequest('/mpesa/stkpush/v1/processrequest', payload);

    if (result.ResponseCode === '0') {
      this.logger.log(`STK Push successful, RequestID: ${result.RequestID}`);
      return {
        success: true,
        requestId: result.RequestID,
        gatewayResponse: result,
      };
    }

    this.logger.warn(`STK Push failed: ${result.ResponseDescription || result.errorMessage}`);
    return {
      success: false,
      requestId: result.RequestID,
      errorMessage: result.ResponseDescription || result.errorMessage,
      gatewayResponse: result,
    };
  }

  async verifyPayment(requestId: string): Promise<{ 
    success: boolean;
    errorMessage?: string;
    gatewayResponse?: any;
  }> {
    this.logger.log(`Verifying payment with RequestID: ${requestId}`);

    const result = await this.mpesaRequest(
      `/mpesa/stkpush/v1/query?BusinessShortCode=${this.businessShortCode}&Password=${this.getPassword()}&Timestamp=${this.getTimestamp()}&CheckoutRequestID=${requestId}`,
      null,
      'get',
    );

    if (result.ResponseCode === '0' && result.ResultCode === '0') {
      this.logger.log(`Payment verification successful for RequestID: ${requestId}`);
      return {
        success: true,
        gatewayResponse: result,
      };
    }

    this.logger.warn(`Payment verification failed: ${result.ResponseDescription || result.ResultDesc}`);
    return {
      success: false,
      errorMessage: result.ResponseDescription || result.ResultDesc || 'Payment not found or failed',
      gatewayResponse: result,
    };
  }

  async verifyMpesaReceipt(receipt: string): Promise<{ 
    success: boolean;
    errorMessage?: string;
    gatewayResponse?: any;
  }> {
    this.logger.log(`Verifying M-Pesa receipt: ${receipt}`);

    const result = await this.mpesaRequest(
      `/mpesa/reversal/v1/query?Receipt=${receipt}`,
      null,
      'get',
    );

    if (result.ResponseCode === '0') {
      return {
        success: true,
        gatewayResponse: result,
      };
    }

    return {
      success: false,
      errorMessage: result.ResponseDescription || 'Receipt verification failed',
      gatewayResponse: result,
    };
  }

  async reversePayment(
    transactionId: string,
    amount: number,
    receiverParty: string,
    remarks: string,
  ): Promise<{ 
    success: boolean;
    errorMessage?: string;
    gatewayResponse?: any;
  }> {
    const timestamp = new Date().toISOString().replace(/[-:.]/g, '').slice(0, -5);
    const password = Buffer.from(`${this.businessShortCode}${this.passKey}${timestamp}`).toString('base64');

    const payload = {
      Initiator: this.configService.get<string>('MPESA_INITIATOR_USERNAME', 'testapi'),
      SecurityCredential: this.configService.get<string>('MPESA_INITIATOR_PASSWORD', 'Safcomanagaza123!'),
      CommandID: 'TransactionReversal',
      TransactionID: transactionId,
      Amount: Math.round(amount),
      ReceiverParty: receiverParty,
      RecieverIdentifierType: '11',
      ResultURL: this.callbackURL,
      QueueTimeOutURL: this.callbackURL,
      Remarks: remarks,
      Occasion: 'Reversal',
    };

    this.logger.log(`Reversing transaction: ${transactionId}, amount: ${amount}`);

    const result = await this.mpesaRequest('/mpesa/reversal/v1/request', payload);

    if (result.ResponseCode === '0') {
      return {
        success: true,
        gatewayResponse: result,
      };
    }

    return {
      success: false,
      errorMessage: result.ResponseDescription || 'Reversal failed',
      gatewayResponse: result,
    };
  }

  async checkAccountBalance(): Promise<{ 
    success: boolean;
    balance?: number;
    errorMessage?: string;
    gatewayResponse?: any;
  }> {
    const timestamp = new Date().toISOString().replace(/[-:.]/g, '').slice(0, -5);
    const password = Buffer.from(`${this.businessShortCode}${this.passKey}${timestamp}`).toString('base64');

    const payload = {
      Initiator: this.configService.get<string>('MPESA_INITIATOR_USERNAME', 'testapi'),
      SecurityCredential: this.configService.get<string>('MPESA_INITIATOR_PASSWORD', 'Safcomanagaza123!'),
      CommandID: 'AccountBalance',
      PartyA: this.businessShortCode,
      IdentifierType: '11',
      Remarks: 'Account balance check',
      QueueTimeOutURL: this.callbackURL,
      ResultURL: this.callbackURL,
    };

    this.logger.log('Checking M-Pesa account balance');

    const result = await this.mpesaRequest('/mpesa/accountbalance/v1/query', payload);

    if (result.ResponseCode === '0') {
      return {
        success: true,
        balance: parseFloat(result.WorkingAccountAvailableFunds || '0'),
        gatewayResponse: result,
      };
    }

    return {
      success: false,
      errorMessage: result.ResponseDescription || 'Balance check failed',
      gatewayResponse: result,
    };
  }

  async handleCallback(callbackData: any): Promise<void> {
    this.logger.log('M-Pesa callback received', callbackData);

    const result = callbackData.Result;
    if (!result) return;

    const requestId = result.RequestID || result.CheckoutRequestID;
    const receipt = result.ReceiptNo || result.MPESARceiptNumber;
    const mpesaRequestId = result.MPESARequestID;
    const amount = parseFloat(result.Amount) || parseFloat(result.TransAmount);
    const phone = result.MSISDN || this.extractPhoneFromCallback(callbackData);

    this.logger.log(`Callback: RequestID=${requestId}, Receipt=${receipt}, Amount=${amount}, Phone=${phone}`);

    if (receipt && amount > 0) {
      // Payment was successful - we should update the payment but need to avoid circular dependency
      // This is handled via the callback controller which injects PaymentsService
      this.logger.log(`Callback: Payment confirmed with receipt ${receipt}`);
    }
  }

  private formatPhoneNumber(phone: string): string {
    if (!phone) return phone;
    
    // Remove spaces and leading + or 0
    let cleaned = phone.replace(/\s+/g, '').replace(/^\+/, '').replace(/^0/, '');
    
    // Add 254 prefix if it's a Kenyan number without it
    if (cleaned.startsWith('7') && !cleaned.startsWith('254')) {
      cleaned = `254${cleaned}`;
    }
    
    return cleaned;
  }

  private extractPhoneFromCallback(callbackData: any): string | null {
    // Try to extract phone from various callback formats
    if (callbackData.Result?.MSISDN) return callbackData.Result.MSISDN;
    if (callbackData.Result?.Message?.MSISDN) return callbackData.Result.Message.MSISDN;
    if (callbackData.Body?.stkCallback?.CallbackMetadata?.Item?.find((i: any) => i.Name === 'PhoneNumber')?.Value) {
      return callbackData.Body.stkCallback.CallbackMetadata.Item.find((i: any) => i.Name === 'PhoneNumber').Value;
    }
    return null;
  }

  private getTimestamp(): string {
    return new Date().toISOString().replace(/[-:.]/g, '').slice(0, -5);
  }

  private getPassword(): string {
    return Buffer.from(`${this.businessShortCode}${this.passKey}${this.getTimestamp()}`).toString('base64');
  }

  // Validation callback for M-Pesa (C2B)
  async validateMpesaRequest(validationData: any): Promise<{ ResultCode: number; ResultDesc: string }> {
    this.logger.log('M-Pesa validation request received', validationData);
    return { ResultCode: 0, ResultDesc: 'Accepted' };
  }

  // Confirmation callback for M-Pesa (C2B)
  async confirmMpesaRequest(confirmationData: any): Promise<{ ResultCode: number; ResultDesc: string }> {
    this.logger.log('M-Pesa confirmation request received', confirmationData);
    return { ResultCode: 0, ResultDesc: 'Accepted' };
  }
}
