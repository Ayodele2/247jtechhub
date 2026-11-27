
import { WalletService } from './wallet.service';
import { PaystackService } from '../payments/paystack.service';

describe('WalletService', () => {
  let service: WalletService;
  let db: any;
  let paystackService: any;

  const wallet = {
    id: 'wallet-123',
    userId: 'user-123',
    balanceKobo: '500000',
  };

  beforeEach(() => {
    jest.clearAllMocks();

    db = {
      select: jest.fn(),
      insert: jest.fn(),
      update: jest.fn(),
      transaction: jest.fn(),
    };

    paystackService = {
      initializeTransaction: jest.fn(),
      verifyTransaction: jest.fn(),
    };

    service = new WalletService(
      db,
      paystackService as PaystackService,
    );
  });

  function mockSelect(result: any[]) {
    const query: any = {
      from: jest.fn(),
      where: jest.fn(),
      limit: jest.fn(),
      orderBy: jest.fn(),
    };

    query.from.mockReturnValue(query);
    query.where.mockReturnValue(query);
    query.limit.mockResolvedValue(result);
    query.orderBy.mockResolvedValue(result);

    db.select.mockReturnValue(query);

    return query;
  }

  describe('getWallet', () => {
    it('should return the wallet balance in naira', async () => {
      mockSelect([wallet]);

      const result = await service.getWallet('user-123');

      expect(result).toEqual({
        id: 'wallet-123',
        balance: 5000,
        balanceKobo: '500000',
        currency: 'NGN',
      });
    });

    it('should fail when the wallet does not exist', async () => {
      mockSelect([]);

      await expect(
        service.getWallet('user-123'),
      ).rejects.toThrow('Wallet not found.');
    });
  });

  describe('getTransactions', () => {
    it('should return transactions belonging to the user wallet', async () => {
      const transactions = [
        {
          id: 'transaction-123',
          walletId: 'wallet-123',
          type: 'credit',
          amountKobo: '500000',
          status: 'successful',
        },
      ];

      const query = mockSelect([wallet]);
      query.orderBy.mockResolvedValue(transactions);

      const result = await service.getTransactions('user-123');

      expect(result).toEqual(transactions);
      expect(db.select).toHaveBeenCalled();
    });
  });

  describe('initializeFunding', () => {
    it('should reject an invalid funding amount', async () => {
      mockSelect([wallet]);

      await expect(
        service.initializeFunding(
          'user-123',
          'customer@example.com',
          { amount: 0 } as any,
        ),
      ).rejects.toThrow('Invalid funding amount.');

      expect(
        paystackService.initializeTransaction,
      ).not.toHaveBeenCalled();
    });

    it('should initialize funding through Paystack', async () => {
      mockSelect([wallet]);

      const funding = {
        id: 'funding-123',
        userId: 'user-123',
        walletId: 'wallet-123',
        amountKobo: '500000',
        reference: '247VTU_test123',
        status: 'pending',
      };

      db.insert.mockReturnValue({
        values: jest.fn().mockReturnValue({
          returning: jest.fn().mockResolvedValue([funding]),
        }),
      });

      db.update.mockReturnValue({
        set: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue(undefined),
        }),
      });

      paystackService.initializeTransaction.mockImplementation(
        ({ reference }: { reference: string }) =>
          Promise.resolve({
            authorization_url:
              'https://checkout.paystack.com/test',
            access_code: 'test-access-code',
            reference,
          }),
      );

      const result = await service.initializeFunding(
        'user-123',
        'customer@example.com',
        { amount: 5000 } as any,
      );

      expect(result.message).toBe(
        'Wallet funding initialized successfully.',
      );

      expect(result.funding).toEqual({
        id: 'funding-123',
        reference: funding.reference,
        amountKobo: '500000',
        status: 'pending',
      });

      expect(result.payment.authorizationUrl).toBe(
        'https://checkout.paystack.com/test',
      );

      expect(
        paystackService.initializeTransaction,
      ).toHaveBeenCalledWith(
        expect.objectContaining({
          email: 'customer@example.com',
          amountKobo: 500000,
          reference: expect.any(String),
        }),
      );
    });

    it('should mark funding as failed when Paystack initialization fails', async () => {
      mockSelect([wallet]);

      const funding = {
        id: 'funding-123',
        userId: 'user-123',
        walletId: 'wallet-123',
        amountKobo: '500000',
        reference: '247VTU_test123',
        status: 'pending',
      };

      db.insert.mockReturnValue({
        values: jest.fn().mockReturnValue({
          returning: jest.fn().mockResolvedValue([funding]),
        }),
      });

      const where = jest.fn().mockResolvedValue(undefined);
      const set = jest.fn().mockReturnValue({ where });

      db.update.mockReturnValue({ set });

      paystackService.initializeTransaction.mockRejectedValue(
        new Error('Paystack unavailable'),
      );

      await expect(
        service.initializeFunding(
          'user-123',
          'customer@example.com',
          { amount: 5000 } as any,
        ),
      ).rejects.toThrow('Paystack unavailable');

      expect(set).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'failed',
        }),
      );
    });

    it('should reject an unexpected Paystack reference', async () => {
      mockSelect([wallet]);

      const funding = {
        id: 'funding-123',
        userId: 'user-123',
        walletId: 'wallet-123',
        amountKobo: '500000',
        reference: '247VTU_test123',
        status: 'pending',
      };

      db.insert.mockReturnValue({
        values: jest.fn().mockReturnValue({
          returning: jest.fn().mockResolvedValue([funding]),
        }),
      });

      db.update.mockReturnValue({
        set: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue(undefined),
        }),
      });

      paystackService.initializeTransaction.mockResolvedValue({
        authorization_url: 'https://checkout.paystack.com/test',
        access_code: 'test-access-code',
        reference: 'WRONG_REFERENCE',
      });

      await expect(
        service.initializeFunding(
          'user-123',
          'customer@example.com',
          { amount: 5000 } as any,
        ),
      ).rejects.toThrow(
        'Paystack returned an unexpected transaction reference.',
      );
    });
  });

  describe('verifyFunding', () => {
    const funding = {
      id: 'funding-123',
      userId: 'user-123',
      walletId: 'wallet-123',
      amountKobo: '500000',
      reference: '247VTU_test123',
      status: 'pending',
    };

    const payment = {
      id: 123456,
      status: 'success',
      reference: '247VTU_test123',
      amount: 500000,
      currency: 'NGN',
      channel: 'card',
      paid_at: '2026-11-17T12:00:00.000Z',
    };

    function createQuery(result: any[]) {
      const query: any = {
        from: jest.fn(),
        where: jest.fn(),
        limit: jest.fn(),
        for: jest.fn(),
      };

      query.from.mockReturnValue(query);
      query.where.mockReturnValue(query);
      query.for.mockReturnValue(query);
      query.limit.mockResolvedValue(result);

      return query;
    }

    function setupTransaction(lockedFunding: any) {
      const walletUpdate = {
        set: jest.fn().mockReturnThis(),
        where: jest.fn().mockResolvedValue(undefined),
      };

      const fundingUpdate = {
        set: jest.fn().mockReturnThis(),
        where: jest.fn().mockResolvedValue(undefined),
      };

      const tx = {
        select: jest.fn().mockReturnValue(
          createQuery([lockedFunding]),
        ),
        update: jest
          .fn()
          .mockReturnValueOnce(walletUpdate)
          .mockReturnValueOnce(fundingUpdate),
        insert: jest.fn().mockReturnValue({
          values: jest.fn().mockResolvedValue(undefined),
        }),
      };

      db.transaction.mockImplementation(
        async (callback: any) => callback(tx),
      );

      return tx;
    }

    it('should verify payment and credit the wallet successfully', async () => {
      db.select.mockReturnValue(createQuery([funding]));

      paystackService.verifyTransaction.mockResolvedValue(payment);

      const tx = setupTransaction(funding);

      const result = await service.verifyFunding(
        'user-123',
        funding.reference,
      );

      expect(result).toEqual({
        message: 'Wallet funded successfully.',
        status: 'successful',
        reference: funding.reference,
        amountKobo: '500000',
      });

      expect(paystackService.verifyTransaction)
        .toHaveBeenCalledWith(funding.reference);

      expect(tx.update).toHaveBeenCalledTimes(2);
      expect(tx.insert).toHaveBeenCalledTimes(1);
    });

    it('should not credit the wallet twice if already successful', async () => {
      db.select.mockReturnValue(createQuery([funding]));

      paystackService.verifyTransaction.mockResolvedValue(payment);

      const alreadySuccessful = {
        ...funding,
        status: 'successful',
      };

      const tx = setupTransaction(alreadySuccessful);

      const result = await service.verifyFunding(
        'user-123',
        funding.reference,
      );

      expect(result).toEqual({
        message: 'This funding transaction has already been credited.',
        status: 'successful',
        reference: funding.reference,
      });

      expect(tx.update).not.toHaveBeenCalled();
      expect(tx.insert).not.toHaveBeenCalled();
    });

    it('should reject payment with an incorrect amount', async () => {
      db.select.mockReturnValue(createQuery([funding]));

      paystackService.verifyTransaction.mockResolvedValue({
        ...payment,
        amount: 100000,
      });

      await expect(
        service.verifyFunding('user-123', funding.reference),
      ).rejects.toThrow('Payment reference or amount does not match.');

      expect(db.transaction).not.toHaveBeenCalled();
    });

    it('should reject payment with an incorrect currency', async () => {
      db.select.mockReturnValue(createQuery([funding]));

      paystackService.verifyTransaction.mockResolvedValue({
        ...payment,
        currency: 'USD',
      });

      await expect(
        service.verifyFunding('user-123', funding.reference),
      ).rejects.toThrow('Payment currency does not match.');

      expect(db.transaction).not.toHaveBeenCalled();
    });

    it('should reject an unsuccessful Paystack payment', async () => {
      db.select.mockReturnValue(createQuery([funding]));

      paystackService.verifyTransaction.mockResolvedValue({
        ...payment,
        status: 'failed',
      });

      await expect(
        service.verifyFunding('user-123', funding.reference),
      ).rejects.toThrow(
        'Payment has not been completed successfully.',
      );

      expect(db.transaction).not.toHaveBeenCalled();
    });

    it('should reject a funding reference belonging to another user', async () => {
      db.select.mockReturnValue(createQuery([]));

      await expect(
        service.verifyFunding('another-user', funding.reference),
      ).rejects.toThrow('Funding transaction not found.');

      expect(paystackService.verifyTransaction)
        .not.toHaveBeenCalled();
    });

    it('should reject funding that is already failed', async () => {
      db.select.mockReturnValue(
        createQuery([
          {
            ...funding,
            status: 'failed',
          },
        ]),
      );

      await expect(
        service.verifyFunding('user-123', funding.reference),
      ).rejects.toThrow(
        'This funding transaction cannot be verified.',
      );

      expect(paystackService.verifyTransaction)
        .not.toHaveBeenCalled();
    });
  });
});
