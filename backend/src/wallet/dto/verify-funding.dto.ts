
import {
  IsNotEmpty,
  IsString,
  MaxLength,
} from 'class-validator';

export class VerifyFundingDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  reference!: string;
}
