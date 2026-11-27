import {
  Body,
  Controller,
  Get,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

import { VtuService } from './vtu.service';
import { PurchaseAirtimeDto } from './dto/purchase-airtime.dto';
import { PurchaseDataDto } from './dto/purchase-data.dto';

@Controller('api/v1/vtu')
@UseGuards(AuthGuard('jwt'))
export class VtuController {
  constructor(private readonly vtuService: VtuService) {}

  private normalizePhoneNumber(phoneNumber: string): string {
    if (phoneNumber.startsWith('+234')) {
      return `0${phoneNumber.slice(4)}`;
    }

    if (phoneNumber.startsWith('234')) {
      return `0${phoneNumber.slice(3)}`;
    }

    return phoneNumber;
  }

  @Get('data-bundles')
  getDataBundles(@Query('service') service: string) {
    return this.vtuService.getDataBundles(service);
  }

  @Post('airtime')
  purchaseAirtime(
    @Body() dto: PurchaseAirtimeDto,
    @Req() req: any,
  ) {
    return this.vtuService.purchaseAirtime({
      userId: req.user.id,
      service: dto.service,
      phoneNumber: this.normalizePhoneNumber(dto.phoneNumber),
      amount: dto.amount,
      idempotencyKey: dto.idempotencyKey,
    });
  }

  @Post('data')
  purchaseData(
    @Body() dto: PurchaseDataDto,
    @Req() req: any,
  ) {
    return this.vtuService.purchaseData({
      userId: req.user.id,
      service: dto.service,
      phoneNumber: this.normalizePhoneNumber(dto.phoneNumber),
      bundleCode: dto.bundleCode,
      idempotencyKey: dto.idempotencyKey,
    });
  }
}