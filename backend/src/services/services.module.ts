import { Module } from '@nestjs/common';

import { PaymentsModule } from '../payments/payments.module';
import { ServicesController } from './services.controller';

@Module({
  imports: [PaymentsModule],
  controllers: [ServicesController],
})
export class ServicesModule {}