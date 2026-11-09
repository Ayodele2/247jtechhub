import {
  Body,
  Controller,
  Get,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';

import { AuthGuard } from '@nestjs/passport';

import { WalletService } from './wallet.service';
import { FundWalletDto } from './dto/fund-wallet.dto';
import { VerifyFundingDto } from './dto/verify-funding.dto';

@Controller('api/v1/wallet')
@UseGuards(AuthGuard('jwt'))
export class WalletController {
  constructor(private readonly walletService: WalletService) {}

  @Get()
  getWallet(@Req() req: { user: { id: string } }) {
    return this.walletService.getWallet(req.user.id);
  }

  @Get('transactions')
  getTransactions(@Req() req: { user: { id: string } }) {
    return this.walletService.getTransactions(req.user.id);
  }

  @Post('fund/initialize')
  initializeFunding(
    @Req() req: { user: { id: string; email: string } },
    @Body() fundWalletDto: FundWalletDto,
  ) {
    return this.walletService.initializeFunding(
      req.user.id,
      req.user.email,
      fundWalletDto,
    );
  }

  @Post('fund/verify')
  verifyFunding(
    @Req() req: { user: { id: string } },
    @Body() verifyFundingDto: VerifyFundingDto,
  ) {
    return this.walletService.verifyFunding(
      req.user.id,
      verifyFundingDto.reference,
    );
  }
}