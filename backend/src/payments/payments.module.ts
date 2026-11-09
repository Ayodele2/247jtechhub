import { Module } from '@nestjs/common';

import { PaystackService } from './paystack.service';
import { PaybetaService } from './paybeta.service';

@Module({
  providers: [PaystackService, PaybetaService],
  exports: [PaystackService, PaybetaService],
})
export class PaymentsModule {}