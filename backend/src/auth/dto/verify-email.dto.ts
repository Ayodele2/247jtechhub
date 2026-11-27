
import {
  IsEmail,
  IsNotEmpty,
  IsString,
  Matches,
  MaxLength,
} from 'class-validator';

export class VerifyEmailDto {
  @IsEmail()
  @IsNotEmpty()
  @MaxLength(255)
  email!: string;

  @IsString()
  @Matches(/^\d{6}$/, {
    message: 'Verification code must contain exactly six digits.',
  })
  code!: string;
}
