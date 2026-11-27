import {
  IsIn,
  IsString,
  Length,
  Matches,
} from 'class-validator';

export class ValidateCableAccountDto {
  @IsIn(['dstv', 'gotv', 'startimes'])
  service!: string;

  @IsString()
  @Length(5, 20)
  @Matches(/^\d+$/, {
    message: 'Enter a valid smart-card number.',
  })
  smartCardNumber!: string;
}