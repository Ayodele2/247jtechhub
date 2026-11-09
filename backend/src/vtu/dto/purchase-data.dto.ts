
import {
  IsIn,
  IsString,
  Matches,
} from 'class-validator';

export class PurchaseDataDto {
  @IsIn(['mtn_data', 'glo_data', 'airtel_data', '9mobile_data'])
  service!: string;

  @IsString()
  @Matches(/^(0[789][01]\d{8}|\+234[789][01]\d{8}|234[789][01]\d{8})$/, {
    message: 'Enter a valid Nigerian phone number.',
  })
  phoneNumber!: string;

  @IsString()
  bundleCode!: string;
}
