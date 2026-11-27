
import { Module } from '@nestjs/common';
import { WalletController } from './wallet.controller';
import { WalletService } from './wallet.service';
import { PaymentsModule } from '../payments/payments.module';
import { PaystackWebhookController } from '../payments/paystack-webhook.controller';

@Module({
  imports: [PaymentsModule],
  controllers: [
    WalletController,
    PaystackWebhookController,
  ],
  providers: [WalletService],
})
export class WalletModule {}
