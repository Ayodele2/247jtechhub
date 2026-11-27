
import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  InternalServerErrorException,
  HttpException,
HttpStatus,
  UnauthorizedException,
  ServiceUnavailableException,
} from '@nestjs/common';

import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { randomInt } from 'node:crypto';
import { eq, sql } from 'drizzle-orm';

import { DRIZZLE } from '../database/database.module';
import { users } from '../database/schema/users';
import { wallets } from '../database/schema/wallets';
import { emailVerificationCodes } from '../database/schema/email-verification-codes';

import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { VerifyEmailDto } from './dto/verify-email.dto';
import { ResendVerificationDto } from './dto/resend-verification.dto';
import { EmailService } from './email.service';

const OTP_EXPIRY_MINUTES = 10;
const OTP_MAX_ATTEMPTS = 5;
const OTP_RESEND_COOLDOWN_MS = 60 * 1000;

@Injectable()
export class AuthService {
  constructor(
    @Inject(DRIZZLE)
    private readonly db: any,
    private readonly jwtService: JwtService,
    private readonly emailService: EmailService,
  ) {}

  private normalizePhoneNumber(phoneNumber: string): string {
    const cleaned = phoneNumber.replace(/[\s()-]/g, '');

    if (cleaned.startsWith('+234')) {
      return cleaned;
    }

    if (cleaned.startsWith('234')) {
      return `+${cleaned}`;
    }

    if (cleaned.startsWith('0')) {
      return `+234${cleaned.slice(1)}`;
    }

    throw new ConflictException('Invalid Nigerian phone number.');
  }

  private async createAndSendVerificationCode(
    userId: string,
    email: string,
  ): Promise<void> {
    const code = String(randomInt(100000, 1000000));
    const codeHash = await bcrypt.hash(code, 10);

    const now = new Date();
    const expiresAt = new Date(
      now.getTime() + OTP_EXPIRY_MINUTES * 60 * 1000,
    );

    await this.db
      .insert(emailVerificationCodes)
      .values({
        userId,
        codeHash,
        expiresAt,
        attempts: 0,
        lastSentAt: now,
      })
      .onConflictDoUpdate({
        target: emailVerificationCodes.userId,
        set: {
          codeHash,
          expiresAt,
          attempts: 0,
          lastSentAt: now,
        },
      });

    await this.emailService.sendVerificationCode(email, code);
  }

  async register(registerDto: RegisterDto) {
    const fullName = registerDto.fullName.trim();
    const email = registerDto.email.trim().toLowerCase();
    const phoneNumber = this.normalizePhoneNumber(
      registerDto.phoneNumber,
    );

    const passwordHash = await bcrypt.hash(
      registerDto.password,
      12,
    );

    let user: {
      id: string;
      fullName: string;
      email: string;
      phoneNumber: string | null;
      createdAt: Date;
    };

    try {
      user = await this.db.transaction(async (tx: any) => {
        const [newUser] = await tx
          .insert(users)
          .values({
            fullName,
            email,
            phoneNumber,
            passwordHash,
          })
          .returning({
            id: users.id,
            fullName: users.fullName,
            email: users.email,
            phoneNumber: users.phoneNumber,
            createdAt: users.createdAt,
          });

        await tx.insert(wallets).values({
          userId: newUser.id,
        });

        return newUser;
      });
    } catch (error: unknown) {
      if (
        typeof error === 'object' &&
        error !== null &&
        'code' in error &&
        error.code === '23505'
      ) {
        throw new ConflictException(
          'An account with this email or phone number already exists.',
        );
      }

      throw new InternalServerErrorException(
        'Unable to create account.',
      );
    }

    try {
      await this.createAndSendVerificationCode(user.id, email);
    } catch {
      throw new ServiceUnavailableException(
        'Your account was created, but we could not send the verification email. Please request a new code.',
      );
    }

    return {
      message:
        'Account created. Check your email for your verification code.',
      user,
      verificationRequired: true,
    };
  }

  async verifyEmail(verifyEmailDto: VerifyEmailDto) {
    const email = verifyEmailDto.email.trim().toLowerCase();
    const code = verifyEmailDto.code;

    const outcome = await this.db.transaction(async (tx: any) => {
      const [user] = await tx
        .select({
          id: users.id,
          emailVerified: users.emailVerified,
        })
        .from(users)
        .where(eq(users.email, email))
        .limit(1);

      if (!user || user.emailVerified) {
        return 'unavailable';
      }

      const [record] = await tx
        .select()
        .from(emailVerificationCodes)
        .where(eq(emailVerificationCodes.userId, user.id))
        .for('update')
        .limit(1);

      if (!record) {
        return 'missing';
      }

      if (record.expiresAt.getTime() <= Date.now()) {
        await tx
          .delete(emailVerificationCodes)
          .where(eq(emailVerificationCodes.userId, user.id));

        return 'expired';
      }

      if (record.attempts >= OTP_MAX_ATTEMPTS) {
        return 'locked';
      }

      const matches = await bcrypt.compare(code, record.codeHash);

      if (!matches) {
        await tx
          .update(emailVerificationCodes)
          .set({
            attempts: sql`${emailVerificationCodes.attempts} + 1`,
          })
          .where(eq(emailVerificationCodes.id, record.id));

        return 'invalid';
      }

      await tx
        .update(users)
        .set({ emailVerified: true })
        .where(eq(users.id, user.id));

      await tx
        .delete(emailVerificationCodes)
        .where(eq(emailVerificationCodes.userId, user.id));

      return 'verified';
    });

    if (outcome === 'invalid') {
      throw new UnauthorizedException('Invalid verification code.');
    }

    if (outcome === 'expired') {
      throw new UnauthorizedException(
        'Verification code expired. Please request a new one.',
      );
    }

    if (outcome === 'locked') {
      throw new HttpException(
  'Too many incorrect attempts. Please request a new code.',
  HttpStatus.TOO_MANY_REQUESTS,
);
    }

    if (outcome === 'missing') {
      throw new BadRequestException(
        'No active verification code. Please request a new one.',
      );
    }

    if (outcome !== 'verified') {
      throw new BadRequestException(
        'This account does not require email verification.',
      );
    }

    return {
      message: 'Email verified successfully. You can now sign in.',
      verified: true,
    };
  }

  async resendVerification(
    resendDto: ResendVerificationDto,
  ) {
    const email = resendDto.email.trim().toLowerCase();

    const [user] = await this.db
      .select({
        id: users.id,
        email: users.email,
        emailVerified: users.emailVerified,
      })
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    // Use the same response for unknown and already-verified accounts.
    if (!user || user.emailVerified) {
      return {
        message:
          'If this account requires verification, a new code will be sent.',
      };
    }

    const [existingCode] = await this.db
      .select({
        lastSentAt: emailVerificationCodes.lastSentAt,
      })
      .from(emailVerificationCodes)
      .where(eq(emailVerificationCodes.userId, user.id))
      .limit(1);

    if (
      existingCode &&
      Date.now() - existingCode.lastSentAt.getTime() <
        OTP_RESEND_COOLDOWN_MS
    ) {
      return {
        message:
          'If this account requires verification, a new code will be sent.',
      };
    }

    try {
      await this.createAndSendVerificationCode(user.id, user.email);
    } catch {
      throw new ServiceUnavailableException(
        'Unable to send a verification email. Please try again later.',
      );
    }

    return {
      message: 'A new verification code has been sent if delivery is available.',
    };
  }

  async login(loginDto: LoginDto) {
    const email = loginDto.email.trim().toLowerCase();

    const [user] = await this.db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (!user) {
      throw new UnauthorizedException(
        'Invalid email or password.',
      );
    }

    const passwordMatches = await bcrypt.compare(
      loginDto.password,
      user.passwordHash,
    );

    if (!passwordMatches) {
      throw new UnauthorizedException(
        'Invalid email or password.',
      );
    }

    if (!user.emailVerified) {
      throw new UnauthorizedException(
        'Please verify your email before signing in.',
      );
    }

    const accessToken = await this.jwtService.signAsync({
      sub: user.id,
      email: user.email,
    });

    return {
      message: 'Login successful',
      accessToken,
      tokenType: 'Bearer',
      expiresIn: '15m',
      user: {
        id: user.id,
        fullName: user.fullName,
        email: user.email,
        phoneNumber: user.phoneNumber,
        createdAt: user.createdAt,
      },
    };
  }

  async getProfile(userId: string) {
    const [user] = await this.db
      .select({
        id: users.id,
        fullName: users.fullName,
        email: users.email,
        phoneNumber: users.phoneNumber,
        createdAt: users.createdAt,
      })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!user) {
      throw new UnauthorizedException(
        'User account could not be found.',
      );
    }

    return {
      message: 'Authenticated user',
      user,
    };
  }
}
