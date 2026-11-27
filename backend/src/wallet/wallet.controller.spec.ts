
import { WalletController } from './wallet.controller';
import { WalletService } from './wallet.service';

describe('WalletController', () => {
  let controller: WalletController;

  const walletService = {
    getWallet: jest.fn(),
    getTransactions: jest.fn(),
    initializeFunding: jest.fn(),
    verifyFunding: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();

    controller = new WalletController(
      walletService as unknown as WalletService,
    );
  });

  describe('getWallet', () => {
    it('should return the authenticated user wallet', async () => {
      const wallet = {
        id: 'wallet-123',
        balance: 5000,
        balanceKobo: '500000',
        currency: 'NGN',
      };

      walletService.getWallet.mockResolvedValue(wallet);

      const result = await controller.getWallet({
        user: { id: 'user-123' },
      });

      expect(result).toEqual(wallet);
      expect(walletService.getWallet).toHaveBeenCalledWith('user-123');
    });
  });

  describe('getTransactions', () => {
    it('should return the user transaction history', async () => {
      const transactions = [
        {
          id: 'transaction-123',
          type: 'credit',
          amountKobo: '500000',
          status: 'successful',
        },
      ];

      walletService.getTransactions.mockResolvedValue(transactions);

      const result = await controller.getTransactions({
        user: { id: 'user-123' },
      });

      expect(result).toEqual(transactions);
      expect(walletService.getTransactions).toHaveBeenCalledWith(
        'user-123',
      );
    });
  });

  describe('initializeFunding', () => {
    it('should initialize wallet funding for the authenticated user', async () => {
      const dto = { amount: 5000 } as any;

      const payment = {
        message: 'Wallet funding initialized successfully.',
        funding: {
          id: 'funding-123',
          reference: '247VTU_test123',
          amountKobo: '500000',
          status: 'pending',
        },
        payment: {
          authorizationUrl: 'https://checkout.paystack.com/test',
          accessCode: 'test-access-code',
          reference: '247VTU_test123',
        },
      };

      walletService.initializeFunding.mockResolvedValue(payment);

      const result = await controller.initializeFunding(
        {
          user: {
            id: 'user-123',
            email: 'customer@example.com',
          },
        },
        dto,
      );

      expect(result).toEqual(payment);

      expect(walletService.initializeFunding).toHaveBeenCalledWith(
        'user-123',
        'customer@example.com',
        dto,
      );
    });
  });

  describe('verifyFunding', () => {
    it('should verify funding using the supplied reference', async () => {
      const dto = {
        reference: '247VTU_test123',
      };

      const verification = {
        message: 'Wallet funded successfully.',
        status: 'successful',
        reference: '247VTU_test123',
        amountKobo: '500000',
      };

      walletService.verifyFunding.mockResolvedValue(verification);

      const result = await controller.verifyFunding(
        {
          user: { id: 'user-123' },
        },
        dto,
      );

      expect(result).toEqual(verification);

      expect(walletService.verifyFunding).toHaveBeenCalledWith(
        'user-123',
        '247VTU_test123',
      );
    });
  });
});
