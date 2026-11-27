import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

import { PaybetaService } from '../payments/paybeta.service';
import { ValidateCableAccountDto } from './dto/validate-cable-account.dto';

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

  @Get('cable/providers')
  getCableProviders() {
    return this.paybetaService.getCableProviders();
  }


    
  @Get('education/providers')
  getEducationProviders() {
    return this.paybetaService.getEducationProviders();
  }


  @Post('education/:service/exam-types')
  getEducationExamTypes(@Param('service') service: string) {
    const supportedServices = [
      'waec-registration',
      'waec-result',
      'jamb',
    ];

    if (!supportedServices.includes(service)) {
      throw new BadRequestException(
        'Unsupported Education provider.',
      );
    }

    return this.paybetaService.getEducationExamTypes(service);
  }


  @Get('cable/:service/bouquets')
  getCableBouquets(@Param('service') service: string) {
    const supportedServices = ['dstv', 'gotv', 'startimes'];

    if (!supportedServices.includes(service)) {
      throw new BadRequestException(
        'Unsupported Cable TV provider.',
      );
    }

    return this.paybetaService.getCableBouquets(service);
  }

  @Post('cable/validate')
  validateCableAccount(
    @Body() dto: ValidateCableAccountDto,
  ) {
    return this.paybetaService.validateCableAccount(
      dto.service,
      dto.smartCardNumber,
    );
  }
}