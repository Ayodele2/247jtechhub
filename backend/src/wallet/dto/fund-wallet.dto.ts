import {
  IsNumber,
  IsPositive,
  Max,
} from 'class-validator';

export class FundWalletDto {
  @IsNumber()
  @IsPositive()
  @Max(1000000)
  amount!: number;
}