
import {
  Controller,
  Get,
  Param,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

import { PaybetaService } from '../payments/paybeta.service';

@Controller('api/v1/services')
@UseGuards(AuthGuard('jwt'))
export class ServicesController {
  constructor(
    private readonly paybetaService: PaybetaService,
  ) {}

  @Get('airtime/providers')
  getAirtimeProviders() {
    return this.paybetaService.getAirtimeProviders();
  }

  @Get('data/providers')
  getDataProviders() {
    return this.paybetaService.getDataProviders();
  }

  @Get('data/:service/bundles')
  getDataBundles(@Param('service') service: string) {
    return this.paybetaService.getDataBundles(service);
  }
}
