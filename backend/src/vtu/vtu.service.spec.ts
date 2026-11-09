
import {
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';

import { VtuService } from './vtu.service';
import { DRIZZLE } from '../database/database.module';
import { PaybetaService } from '../payments/paybeta.service';

describe('VtuService', () => {
  let service: VtuService;
  let dbMock: { transaction: jest.Mock };

  const validInput = {
    userId: 'test-user-id',
    type: 'airtime' as const,
    service: 'mtn_vtu',
    phoneNumber: '08012345678',
    amountKobo: '20000',
    idempotencyKey: 'test-key-12345',
  };

  beforeEach(async () => {
    dbMock = {
      transaction: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        VtuService,
        { provide: DRIZZLE, useValue: dbMock },
        { provide: PaybetaService, useValue: {} },
      ],
    }).compile();

    service = module.get<VtuService>(VtuService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('reservePurchase validation', () => {
    it('rejects an idempotency key that is too short', async () => {
      await expect(
        service.reservePurchase({
          ...validInput,
          idempotencyKey: 'short',
        }),
      ).rejects.toThrow(BadRequestException);

      expect(dbMock.transaction).not.toHaveBeenCalled();
    });

    it('rejects an idempotency key that is too long', async () => {
      await expect(
        service.reservePurchase({
          ...validInput,
          idempotencyKey: 'a'.repeat(101),
        }),
      ).rejects.toThrow(BadRequestException);

      expect(dbMock.transaction).not.toHaveBeenCalled();
    });

    it('rejects a non-numeric purchase amount', async () => {
      await expect(
        service.reservePurchase({
          ...validInput,
          amountKobo: 'invalid',
        }),
      ).rejects.toThrow(BadRequestException);

      expect(dbMock.transaction).not.toHaveBeenCalled();
    });

    it('rejects a zero purchase amount', async () => {
      await expect(
        service.reservePurchase({
          ...validInput,
          amountKobo: '0',
        }),
      ).rejects.toThrow(BadRequestException);

      expect(dbMock.transaction).not.toHaveBeenCalled();
    });
  });

  describe('reservePurchase wallet protection', () => {
    it('rejects a purchase when the wallet has insufficient funds', async () => {
      const update = {
        set: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        returning: jest.fn().mockResolvedValue([]),
      };

      const existingPurchaseQuery = {
        limit: jest.fn().mockResolvedValue([]),
      };

      const walletQuery = {
        for: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue([
          {
            id: 'wallet-123',
            userId: validInput.userId,
            balanceKobo: '10000',
          },
        ]),
      };

      const tx = {
        select: jest
          .fn()
          .mockReturnValueOnce({
            from: jest.fn().mockReturnValue({
              where: jest.fn().mockReturnValue(walletQuery),
            }),
          })
          .mockReturnValueOnce({
            from: jest.fn().mockReturnValue({
              where: jest.fn().mockReturnValue(existingPurchaseQuery),
            }),
          }),
        update: jest.fn().mockReturnValue(update),
        insert: jest.fn(),
      };

      dbMock.transaction.mockImplementation(
        async (callback: (tx: any) => Promise<any>) => callback(tx),
      );

      await expect(
        service.reservePurchase(validInput),
      ).rejects.toThrow(BadRequestException);

      expect(update.returning).toHaveBeenCalled();
      expect(tx.insert).not.toHaveBeenCalled();
    });

    it('rejects reuse of an idempotency key for a different purchase', async () => {
      const existingPurchase = {
        type: 'airtime',
        service: 'mtn_vtu',
        phoneNumber: '08011111111',
        bundleCode: null,
        amountKobo: '20000',
      };

      const walletQuery = {
        for: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue([
          {
            id: 'wallet-123',
            userId: validInput.userId,
            balanceKobo: '50000',
          },
        ]),
      };

      const existingPurchaseQuery = {
        limit: jest.fn().mockResolvedValue([existingPurchase]),
      };

      const tx = {
        select: jest
          .fn()
          .mockReturnValueOnce({
            from: jest.fn().mockReturnValue({
              where: jest.fn().mockReturnValue(walletQuery),
            }),
          })
          .mockReturnValueOnce({
            from: jest.fn().mockReturnValue({
              where: jest.fn().mockReturnValue(existingPurchaseQuery),
            }),
          }),
        update: jest.fn(),
        insert: jest.fn(),
      };

      dbMock.transaction.mockImplementation(
        async (callback: (tx: any) => Promise<any>) => callback(tx),
      );

      await expect(
        service.reservePurchase(validInput),
      ).rejects.toThrow(ConflictException);

      expect(tx.update).not.toHaveBeenCalled();
      expect(tx.insert).not.toHaveBeenCalled();
    });

    it('returns the existing purchase when the same request is submitted again', async () => {
      const existingPurchase = {
        id: 'purchase-123',
        type: 'airtime',
        service: 'mtn_vtu',
        phoneNumber: validInput.phoneNumber,
        bundleCode: null,
        amountKobo: validInput.amountKobo,
      };

      const walletQuery = {
        for: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue([
          {
            id: 'wallet-123',
            userId: validInput.userId,
            balanceKobo: '30000',
          },
        ]),
      };

      const existingPurchaseQuery = {
        limit: jest.fn().mockResolvedValue([existingPurchase]),
      };

      const tx = {
        select: jest
          .fn()
          .mockReturnValueOnce({
            from: jest.fn().mockReturnValue({
              where: jest.fn().mockReturnValue(walletQuery),
            }),
          })
          .mockReturnValueOnce({
            from: jest.fn().mockReturnValue({
              where: jest.fn().mockReturnValue(existingPurchaseQuery),
            }),
          }),
        update: jest.fn(),
        insert: jest.fn(),
      };

      dbMock.transaction.mockImplementation(
        async (callback: (tx: any) => Promise<any>) => callback(tx),
      );

      const result = await service.reservePurchase(validInput);

      expect(result.reused).toBe(true);
      expect(result.purchase).toEqual(existingPurchase);
      expect(tx.update).not.toHaveBeenCalled();
      expect(tx.insert).not.toHaveBeenCalled();
    });

    it('rejects a purchase when the user has no wallet', async () => {
      const walletQuery = {
        for: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue([]),
      };

      const tx = {
        select: jest.fn().mockReturnValue({
          from: jest.fn().mockReturnValue({
            where: jest.fn().mockReturnValue(walletQuery),
          }),
        }),
        update: jest.fn(),
        insert: jest.fn(),
      };

      dbMock.transaction.mockImplementation(
        async (callback: (tx: any) => Promise<any>) => callback(tx),
      );

      await expect(
        service.reservePurchase(validInput),
      ).rejects.toThrow('Wallet not found.');

      expect(tx.update).not.toHaveBeenCalled();
      expect(tx.insert).not.toHaveBeenCalled();
    });

    it('successfully reserves a purchase and records the wallet debit', async () => {
      const updatedWallet = {
        balanceKobo: '30000',
      };

      const debitTransaction = {
        id: 'debit-123',
        type: 'debit',
        status: 'pending',
        amountKobo: validInput.amountKobo,
      };

      const purchase = {
        id: 'purchase-123',
        userId: validInput.userId,
        type: validInput.type,
        status: 'processing',
        service: validInput.service,
        phoneNumber: validInput.phoneNumber,
        bundleCode: null,
        amountKobo: validInput.amountKobo,
      };

      const walletQuery = {
        for: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue([
          {
            id: 'wallet-123',
            userId: validInput.userId,
            balanceKobo: '50000',
          },
        ]),
      };

      const existingPurchaseQuery = {
        limit: jest.fn().mockResolvedValue([]),
      };

      const update = {
        set: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        returning: jest.fn().mockResolvedValue([updatedWallet]),
      };

      const debitInsert = {
        values: jest.fn().mockReturnThis(),
        returning: jest.fn().mockResolvedValue([debitTransaction]),
      };

      const purchaseInsert = {
        values: jest.fn().mockReturnThis(),
        returning: jest.fn().mockResolvedValue([purchase]),
      };

      const tx = {
        select: jest
          .fn()
          .mockReturnValueOnce({
            from: jest.fn().mockReturnValue({
              where: jest.fn().mockReturnValue(walletQuery),
            }),
          })
          .mockReturnValueOnce({
            from: jest.fn().mockReturnValue({
              where: jest.fn().mockReturnValue(existingPurchaseQuery),
            }),
          }),
        update: jest.fn().mockReturnValue(update),
        insert: jest
          .fn()
          .mockReturnValueOnce(debitInsert)
          .mockReturnValueOnce(purchaseInsert),
      };

      dbMock.transaction.mockImplementation(
        async (callback: (tx: any) => Promise<any>) => callback(tx),
      );

      const result = await service.reservePurchase(validInput);

      expect(result.reused).toBe(false);
      expect(result.walletBalanceKobo).toBe('30000');
      expect(result.purchase).toEqual(purchase);

      expect(update.set).toHaveBeenCalled();
      expect(update.where).toHaveBeenCalled();
      expect(update.returning).toHaveBeenCalled();

      expect(tx.insert).toHaveBeenCalledTimes(2);

      expect(debitInsert.values).toHaveBeenCalledWith(
        expect.objectContaining({
          walletId: 'wallet-123',
          type: 'debit',
          status: 'pending',
          amountKobo: validInput.amountKobo,
        }),
      );

      expect(purchaseInsert.values).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: validInput.userId,
          walletId: 'wallet-123',
          status: 'processing',
          amountKobo: validInput.amountKobo,
          debitTransactionId: debitTransaction.id,
        }),
      );
    });
  });
});
