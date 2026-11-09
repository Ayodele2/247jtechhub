
import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { and, desc, eq, sql } from 'drizzle-orm';

import { DRIZZLE } from '../database/database.module';
import {
  walletFundings,
  walletTransactions,
  wallets,
} from '../database/schema';

import { PaystackService } from '../payments/paystack.service';
import { FundWalletDto } from './dto/fund-wallet.dto';

@Injectable()
export class WalletService {
  constructor(
    @Inject(DRIZZLE) private readonly db: any,
    private readonly paystackService: PaystackService,
  ) {}

  // Get the authenticated user's wallet.
  async getWallet(userId: string) {
    const [wallet] = await this.db
      .select()
      .from(wallets)
      .where(eq(wallets.userId, userId))
      .limit(1);

    if (!wallet) {
      throw new NotFoundException('Wallet not found.');
    }

    return {
      id: wallet.id,
      balance: Number(wallet.balanceKobo) / 100,
      balanceKobo: wallet.balanceKobo,
      currency: 'NGN',
    };
  }

  // Get the user's wallet transaction history.
  async getTransactions(userId: string) {
    const [wallet] = await this.db
      .select()
      .from(wallets)
      .where(eq(wallets.userId, userId))
      .limit(1);

    if (!wallet) {
      throw new NotFoundException('Wallet not found.');
    }

    return this.db
      .select()
      .from(walletTransactions)
      .where(eq(walletTransactions.walletId, wallet.id))
      .orderBy(desc(walletTransactions.createdAt));
  }

  // Initialize wallet funding through Paystack.
  async initializeFunding(
    userId: string,
    email: string,
    fundWalletDto: FundWalletDto,
  ) {
    const [wallet] = await this.db
      .select()
      .from(wallets)
      .where(eq(wallets.userId, userId))
      .limit(1);

    if (!wallet) {
      throw new NotFoundException('Wallet not found.');
    }

    const amountKobo = Math.round(fundWalletDto.amount * 100);

    if (!Number.isSafeInteger(amountKobo) || amountKobo <= 0) {
      throw new BadRequestException('Invalid funding amount.');
    }

    const reference = `247VTU_${crypto.randomUUID().replace(/-/g, '')}`;

    const [funding] = await this.db
      .insert(walletFundings)
      .values({
        userId,
        walletId: wallet.id,
        amountKobo: String(amountKobo),
        reference,
        status: 'pending',
      })
      .returning();

    try {
      const payment = await this.paystackService.initializeTransaction({
        email,
        amountKobo,
        reference,
        callbackUrl: `${
          process.env.FRONTEND_URL ?? 'http://localhost:3000'
        }/wallet/fund/callback`,
      });

      return {
        message: 'Wallet funding initialized successfully.',
        funding: {
          id: funding.id,
          reference: funding.reference,
          amountKobo: funding.amountKobo,
          status: funding.status,
        },
        payment: {
          authorizationUrl: payment.authorization_url,
          accessCode: payment.access_code,
          reference: payment.reference,
        },
      };
    } catch (error) {
      await this.db
        .update(walletFundings)
        .set({
          status: 'failed',
          updatedAt: new Date(),
        })
        .where(eq(walletFundings.id, funding.id));

      throw error;
    }
  }

  // Verify Paystack payment and credit the wallet exactly once.
  async verifyFunding(userId: string, reference: string) {
    const [funding] = await this.db
      .select()
      .from(walletFundings)
      .where(
        and(
          eq(walletFundings.reference, reference),
          eq(walletFundings.userId, userId),
        ),
      )
      .limit(1);

    if (!funding) {
      throw new NotFoundException('Funding transaction not found.');
    }

    if (funding.status === 'successful') {
      return {
        message: 'This funding transaction has already been credited.',
        status: 'successful',
        reference,
      };
    }

    if (funding.status !== 'pending') {
      throw new BadRequestException(
        'This funding transaction cannot be verified.',
      );
    }

    // Verify the transaction directly with Paystack.
    const payment =
      await this.paystackService.verifyTransaction(reference);

    if (payment.status !== 'success') {
      throw new BadRequestException(
        'Payment has not been completed successfully.',
      );
    }

    if (payment.currency !== 'NGN') {
      throw new BadRequestException(
        'Payment currency does not match.',
      );
    }

    if (
      payment.reference !== funding.reference ||
      BigInt(payment.amount) !== BigInt(funding.amountKobo)
    ) {
      throw new BadRequestException(
        'Payment reference or amount does not match.',
      );
    }

    // Lock the funding record to prevent duplicate wallet credits.
    return this.db.transaction(async (tx: any) => {
      const [lockedFunding] = await tx
        .select()
        .from(walletFundings)
        .where(
          and(
            eq(walletFundings.id, funding.id),
            eq(walletFundings.userId, userId),
          ),
        )
        .for('update')
        .limit(1);

      if (!lockedFunding) {
        throw new NotFoundException('Funding transaction not found.');
      }

      if (lockedFunding.status === 'successful') {
        return {
          message: 'This funding transaction has already been credited.',
          status: 'successful',
          reference,
        };
      }

      if (lockedFunding.status !== 'pending') {
        throw new BadRequestException(
          'This funding transaction cannot be credited.',
        );
      }

      // Increment the wallet balance atomically.
      await tx
        .update(wallets)
        .set({
          balanceKobo: sql`${wallets.balanceKobo} + ${lockedFunding.amountKobo}`,
          updatedAt: new Date(),
        })
        .where(eq(wallets.id, lockedFunding.walletId));

      // Record the successful wallet credit.
      await tx.insert(walletTransactions).values({
        walletId: lockedFunding.walletId,
        type: 'credit',
        status: 'successful',
        amountKobo: lockedFunding.amountKobo,
        reference: lockedFunding.reference,
        description: 'Wallet funding via Paystack',
        metadata: {
          provider: 'paystack',
          paystackTransactionId: payment.id,
          channel: payment.channel,
          paidAt: payment.paid_at,
        },
      });

      // Mark the funding record as successful.
      await tx
        .update(walletFundings)
        .set({
          status: 'successful',
          paystackReference: payment.reference,
          updatedAt: new Date(),
        })
        .where(eq(walletFundings.id, lockedFunding.id));

      return {
        message: 'Wallet funded successfully.',
        status: 'successful',
        reference,
        amountKobo: lockedFunding.amountKobo,
      };
    });
  }
}
