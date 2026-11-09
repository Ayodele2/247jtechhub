
import {
  ConflictException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';

import { AuthService } from './auth.service';

jest.mock('bcrypt', () => ({
  hash: jest.fn(),
  compare: jest.fn(),
}));

describe('AuthService', () => {
  let authService: AuthService;
  let db: any;
  let jwtService: jest.Mocked<Pick<JwtService, 'signAsync'>>;

  const user = {
    id: 'user-123',
    fullName: 'Test User',
    email: 'test@example.com',
    phoneNumber: '+2348012345678',
    passwordHash: 'hashed-password',
    createdAt: new Date(),
  };

  beforeEach(() => {
    jest.clearAllMocks();

    db = {
      transaction: jest.fn(),
      select: jest.fn(),
    };

    jwtService = {
      signAsync: jest.fn().mockResolvedValue('test-access-token'),
    };

    authService = new AuthService(
      db,
      jwtService as unknown as JwtService,
    );
  });

  describe('register', () => {
    it('normalizes Nigerian phone numbers and creates a wallet', async () => {
      const returning = jest.fn().mockResolvedValue([
        {
          id: user.id,
          fullName: user.fullName,
          email: user.email,
          phoneNumber: user.phoneNumber,
          createdAt: user.createdAt,
        },
      ]);

      const values = jest.fn().mockReturnValue({ returning });
      const insert = jest.fn().mockReturnValue({ values });

      db.transaction.mockImplementation(async (callback: any) => {
        return callback({ insert });
      });

      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed-password');

      const result = await authService.register({
        fullName: ' Test User ',
        email: ' TEST@EXAMPLE.COM ',
        phoneNumber: '08012345678',
        password: 'password123',
      });

      expect(db.transaction).toHaveBeenCalled();
      expect(bcrypt.hash).toHaveBeenCalledWith('password123', 12);
      expect(values).toHaveBeenCalledTimes(2);
      expect(result.user.phoneNumber).toBe('+2348012345678');
      expect(result.user.email).toBe('test@example.com');
    });

    it('rejects duplicate email or phone numbers', async () => {
      db.transaction.mockRejectedValue({ code: '23505' });

      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed-password');

      await expect(
        authService.register({
          fullName: 'Test User',
          email: 'test@example.com',
          phoneNumber: '08012345678',
          password: 'password123',
        }),
      ).rejects.toBeInstanceOf(ConflictException);
    });
  });

  describe('login', () => {
    it('returns an access token for valid credentials', async () => {
      const limit = jest.fn().mockResolvedValue([user]);
      const where = jest.fn().mockReturnValue({ limit });
      const from = jest.fn().mockReturnValue({ where });

      db.select.mockReturnValue({ from });
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      const result = await authService.login({
        email: ' TEST@EXAMPLE.COM ',
        password: 'password123',
      });

      expect(bcrypt.compare).toHaveBeenCalledWith(
        'password123',
        'hashed-password',
      );
      expect(jwtService.signAsync).toHaveBeenCalled();
      expect(result.accessToken).toBe('test-access-token');
      expect(result.user.phoneNumber).toBe('+2348012345678');
    });

    it('rejects incorrect passwords', async () => {
      const limit = jest.fn().mockResolvedValue([user]);
      const where = jest.fn().mockReturnValue({ limit });
      const from = jest.fn().mockReturnValue({ where });

      db.select.mockReturnValue({ from });
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(
        authService.login({
          email: 'test@example.com',
          password: 'wrong-password',
        }),
      ).rejects.toBeInstanceOf(UnauthorizedException);

      expect(jwtService.signAsync).not.toHaveBeenCalled();
    });

    it('rejects login when the email does not exist', async () => {
      const limit = jest.fn().mockResolvedValue([]);
      const where = jest.fn().mockReturnValue({ limit });
      const from = jest.fn().mockReturnValue({ where });

      db.select.mockReturnValue({ from });

      await expect(
        authService.login({
          email: 'unknown@example.com',
          password: 'password123',
        }),
      ).rejects.toBeInstanceOf(UnauthorizedException);

      expect(bcrypt.compare).not.toHaveBeenCalled();
    });
  });

  describe('getProfile', () => {
    it('returns the authenticated user profile', async () => {
      const limit = jest.fn().mockResolvedValue([
        {
          id: user.id,
          fullName: user.fullName,
          email: user.email,
          phoneNumber: user.phoneNumber,
          createdAt: user.createdAt,
        },
      ]);

      const where = jest.fn().mockReturnValue({ limit });
      const from = jest.fn().mockReturnValue({ where });

      db.select.mockReturnValue({ from });

      const result = await authService.getProfile(user.id);

      expect(result.user.id).toBe(user.id);
      expect(result.user.fullName).toBe(user.fullName);
      expect(result.user.phoneNumber).toBe(user.phoneNumber);
    });

    it('rejects when the user profile does not exist', async () => {
      const limit = jest.fn().mockResolvedValue([]);
      const where = jest.fn().mockReturnValue({ limit });
      const from = jest.fn().mockReturnValue({ where });

      db.select.mockReturnValue({ from });

      await expect(
        authService.getProfile('unknown-user-id'),
      ).rejects.toBeInstanceOf(UnauthorizedException);
    });
  });
});
