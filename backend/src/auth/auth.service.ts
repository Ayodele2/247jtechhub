
import {
  ConflictException,
  Inject,
  Injectable,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';

import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { eq } from 'drizzle-orm';

import { DRIZZLE } from '../database/database.module';
import { users } from '../database/schema/users';
import { wallets } from '../database/schema/wallets';

import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    @Inject(DRIZZLE)
    private readonly db: any,
    private readonly jwtService: JwtService,
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

    try {
      const user = await this.db.transaction(async (tx: any) => {
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

      return {
        message: 'Account created successfully',
        user,
      };
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
