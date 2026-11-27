
import {
  BadRequestException,
  Body,
  Controller,
  Headers,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  UnauthorizedException,
} from '@nestjs/common';

import type { RawBodyRequest } from '@nestjs/common';
import type { Request } from 'express';

import { PaystackService } from './paystack.service';
import { WalletService } from '../wallet/wallet.service';

@Controller('api/v1/payments/paystack')
export class PaystackWebhookController {
  constructor(
    private readonly paystackService: PaystackService,
    private readonly walletService: WalletService,
  ) {}

  @Post('webhook')
  @HttpCode(HttpStatus.OK)
  async handleWebhook(
    @Req() req: RawBodyRequest<Request>,
    @Headers('x-paystack-signature') signature: string,
    @Body() body: unknown,
  ) {
    // 1. Verify the original request signature.
    const rawBody = req.rawBody;

    if (
      !rawBody ||
      !this.paystackService.verifyWebhookSignature(
        rawBody,
        signature,
      )
    ) {
      throw new UnauthorizedException(
        'Invalid Paystack webhook signature.',
      );
    }

    // 2. Validate the webhook payload.
    if (!body || typeof body !== 'object') {
      throw new BadRequestException(
        'Invalid webhook payload.',
      );
    }

    const payload = body as {
      event?: unknown;
      data?: {
        reference?: unknown;
      };
    };

    // 3. Ignore events unrelated to successful charges.
    if (payload.event !== 'charge.success') {
      return {
        message: 'Webhook event ignored.',
      };
    }

    // 4. Extract and validate the payment reference.
    const reference = payload.data?.reference;

    if (
      typeof reference !== 'string' ||
      !reference.trim()
    ) {
      throw new BadRequestException(
        'Payment reference is missing.',
      );
    }

    // 5. Verify with Paystack and credit the wallet safely.
    return this.walletService.processPaystackWebhook(
      reference,
    );
  }
}
