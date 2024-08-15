import { Controller, Get, Post } from '@nestjs/common';
import { PaymentsService } from './payments.service';

@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post('create-payment-session')
  async createPaymentSession() {
    return this.paymentsService.createPaymentSession();
  }

  @Post('webhook')
  async stripeWebhook() {
    return 'webhook';
  }

  @Get('success')
  async success() {
    return 'success';
  }

  @Get('cancel')
  async cancel() {
    return 'cancel';
  }
}
