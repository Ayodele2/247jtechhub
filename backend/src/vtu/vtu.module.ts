
import { Module } from '@nestjs/common';

import { PaymentsModule } from '../payments/payments.module';
import { VtuService } from './vtu.service';
import { VtuController } from './vtu.controller';

@Module({
  imports: [PaymentsModule],
  providers: [VtuService],
  controllers: [VtuController],
})
export class VtuModule {}
