import {
  BadRequestException,
  Inject,
  Injectable,
  Req,
  Res,
} from '@nestjs/common';
import { envs } from 'src/config/envs';
import Stripe from 'stripe';
import { PaymentSessionDto } from './dto/payment-session.dto';
import { Request, Response } from 'express';
import { NATS_SERVICE } from 'src/config/services';
import { ClientProxy } from '@nestjs/microservices';

@Injectable()
export class PaymentsService {
  constructor(
    @Inject(NATS_SERVICE)
    private readonly client: ClientProxy,
  ) {}

  private readonly stripe = new Stripe(envs.stripeSecretKey);

  async createPaymentSession(paymentSessionDto: PaymentSessionDto) {
    const { currency, items, orderId } = paymentSessionDto;
    const line_items = items.map((item) => {
      return {
        price_data: {
          currency,
          product_data: {
            name: item.name,
          },
          unit_amount: Math.round(item.price * 100),
        },
        quantity: item.quantity,
      };
    });

    const session = await this.stripe.checkout.sessions.create({
      payment_intent_data: {
        metadata: {
          orderId,
        },
      },
      line_items: line_items,
      mode: 'payment',
      success_url: `${envs.apiBaseUrl}/payments/success`,
      cancel_url: `${envs.apiBaseUrl}/payments/cancel`,
    });
    return {
      successUrl: session.success_url,
      cancelUrl: session.cancel_url,
      url: session.url,
    };
  }

  async stripeWebhook(@Req() req: Request, @Res() res: Response) {
    const sig = req.headers['stripe-signature'];

    if (!sig) throw new BadRequestException('Missing information');

    let event: Stripe.Event;
    const endpointSecret = envs.stripeEndpointSecret;

    try {
      event = this.stripe.webhooks.constructEvent(
        req['rawBody'],
        sig,
        endpointSecret,
      );
    } catch (err) {
      res.status(400).send(`Webhook Error: ${err.message}`);
    }

    switch (event.type) {
      case 'charge.succeeded':
        const chargeSucceded = event.data.object;
        const orderId = chargeSucceded.metadata.orderId;

        const payload = {
          orderId,
          stripePaymentId: chargeSucceded.id,
          receiptUrl: chargeSucceded.receipt_url,
        };

        this.client.emit('payment.suceeded', payload);
        break;
      default:
        console.log(`Unhandled event type ${event.type}`);
    }
  }
}
