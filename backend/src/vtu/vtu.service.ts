
import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { and, eq, sql } from 'drizzle-orm';

import { DRIZZLE } from '../database/database.module';

import {
  vtuPurchases,
  walletTransactions,
  wallets,
} from '../database/schema';

import { PaybetaService } from '../payments/paybeta.service';

interface ReservePurchaseInput {
  userId: string;
  type: 'airtime' | 'data';
  service: string;
  phoneNumber: string;
  amountKobo: string;
  idempotencyKey: string;
  bundleCode?: string | null;
}

@Injectable()
export class VtuService {
  constructor(
    @Inject(DRIZZLE) private readonly db: any,
    private readonly paybetaService: PaybetaService,
  ) {}

  async reservePurchase(input: ReservePurchaseInput) {
    const {
      userId,
      type,
      service,
      phoneNumber,
      amountKobo,
      idempotencyKey,
      bundleCode = null,
    } = input;

    const key = idempotencyKey?.trim();

    if (!key || key.length < 8 || key.length > 100) {
      throw new BadRequestException(
        'A valid idempotency key between 8 and 100 characters is required.',
      );
    }

    if (!/^\d+$/.test(amountKobo) || BigInt(amountKobo) <= 0n) {
      throw new BadRequestException('Invalid purchase amount.');
    }

    return this.db.transaction(async (tx: any) => {
      // Lock this user's wallet to prevent concurrent spending.
      const [wallet] = await tx
        .select()
        .from(wallets)
        .where(eq(wallets.userId, userId))
        .for('update')
        .limit(1);

      if (!wallet) {
        throw new NotFoundException('Wallet not found.');
      }

      // Check whether this request was already processed.
      const [existingPurchase] = await tx
        .select()
        .from(vtuPurchases)
        .where(
          and(
            eq(vtuPurchases.userId, userId),
            eq(vtuPurchases.idempotencyKey, key),
          ),
        )
        .limit(1);

      if (existingPurchase) {
        const sameRequest =
          existingPurchase.type === type &&
          existingPurchase.service === service &&
          existingPurchase.phoneNumber === phoneNumber &&
          existingPurchase.bundleCode === bundleCode &&
          BigInt(existingPurchase.amountKobo) === BigInt(amountKobo);

        if (!sameRequest) {
          throw new ConflictException(
            'This idempotency key has already been used for a different purchase.',
          );
        }

        return {
          message: 'This purchase request has already been received.',
          reused: true,
          purchase: existingPurchase,
        };
      }

      // Generate a unique purchase reference.
      const reference = `247VTU_${crypto.randomUUID().replace(/-/g, '')}`;

      // Debit the wallet only when sufficient funds are available.
      const [updatedWallet] = await tx
        .update(wallets)
        .set({
          balanceKobo: sql`${wallets.balanceKobo} - ${amountKobo}`,
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(wallets.id, wallet.id),
            sql`${wallets.balanceKobo} >= ${amountKobo}`,
          ),
        )
        .returning({
          balanceKobo: wallets.balanceKobo,
        });

      if (!updatedWallet) {
        throw new BadRequestException('Insufficient wallet balance.');
      }

      // Record the wallet debit.
      const [debitTransaction] = await tx
        .insert(walletTransactions)
        .values({
          walletId: wallet.id,
          type: 'debit',
          status: 'pending',
          amountKobo,
          reference: `${reference}_DEBIT`,
          description: `VTU ${type} purchase`,
          metadata: {
            purchaseReference: reference,
            service,
            phoneNumber,
          },
        })
        .returning();

      // Create the purchase record.
      const [purchase] = await tx
        .insert(vtuPurchases)
        .values({
          userId,
          walletId: wallet.id,
          type,
          status: 'processing',
          service,
          phoneNumber,
          bundleCode,
          amountKobo,
          reference,
          idempotencyKey: key,
          debitTransactionId: debitTransaction.id,
        })
        .returning();

      return {
        message: 'Purchase reserved successfully.',
        reused: false,
        purchase,
        walletBalanceKobo: updatedWallet.balanceKobo,
      };
    });
  }
}
