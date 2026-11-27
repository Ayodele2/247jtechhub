
import {
  IsIn,
  IsInt,
  IsNumber,
  IsPositive,
  IsString,
  Length,
  Matches,
  Max,
} from 'class-validator';

export class PurchaseAirtimeDto {
  @IsIn(['mtn_vtu', 'glo_vtu', 'airtel_vtu', '9mobile_vtu'])
  service!: string;

  @IsString()
  @Matches(/^(0[789][01]\d{8}|\+234[789][01]\d{8}|234[789][01]\d{8})$/, {
    message: 'Enter a valid Nigerian phone number.',
  })
  phoneNumber!: string;

  // Amount is in Naira, not kobo.
  @IsNumber()
  @IsInt()
  @IsPositive()
  @Max(1000000)
  amount!: number;

  @IsString()
  @Length(8, 100)
  idempotencyKey!: string;
}
