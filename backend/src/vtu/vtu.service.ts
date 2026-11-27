
import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { and, eq, sql } from 'drizzle-orm';
import { randomUUID } from 'node:crypto';

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

interface AirtimePurchaseInput {
  userId: string;
  service: string;
  phoneNumber: string;
  amount: number;
  idempotencyKey: string;
}

interface DataPurchaseInput {
  userId: string;
  service: string;
  phoneNumber: string;
  bundleCode: string;
  idempotencyKey: string;
}

type ProviderOutcome = 'successful' | 'failed' | 'pending';

function isRecord(value: unknown): value is Record<string, any> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function getProviderOutcome(body: unknown): ProviderOutcome {
  if (!isRecord(body)) return 'pending';

  const data = isRecord(body.data) ? body.data : {};
  const code = String(data.code ?? body.code ?? '');
  const status = String(
    data.transactionStatus ??
    data.status ??
    body.transactionStatus ??
    '',
  ).toLowerCase();

  if (code === '00' || status === 'successful' || status === 'success') {
    return 'successful';
  }

  if (code === '02' || status === 'failed' || status === 'failure') {
    return 'failed';
  }

  return 'pending';
}

function getProviderReference(body: unknown): string | null {
  if (!isRecord(body)) return null;

  const data = isRecord(body.data) ? body.data : {};
  const reference = data.transactionId ?? data.providerReference;

  return typeof reference === 'string' ? reference : null;
}

function parsePriceToKobo(price: string): string {
  const match = /^(\d+)(?:\.(\d{1,2}))?$/.exec(price.trim());

  if (!match) {
    throw new BadRequestException('The data bundle has an invalid price.');
  }

  const wholeNaira = BigInt(match[1]);
  const fraction = BigInt((match[2] ?? '').padEnd(2, '0'));

  return (wholeNaira * 100n + fraction).toString();
}

@Injectable()
export class VtuService {
  constructor(
    @Inject(DRIZZLE) private readonly db: any,
    private readonly paybetaService: PaybetaService,
  ) {}

  private ensurePurchasesEnabled(): void {
    if (process.env.PAYBETA_PURCHASES_ENABLED !== 'true') {
      throw new ServiceUnavailableException(
        'VTU purchases are temporarily unavailable.',
      );
    }
  }

  /**
   * Fetch available data bundles from Paybeta.
   * This is a read-only operation and does not initiate a purchase.
   */
  async getDataBundles(service: string) {
    const supportedServices = [
      'mtn_data',
      'airtel_data',
      'glo_data',
      '9mobile_data',
    ];

    if (!supportedServices.includes(service)) {
      throw new BadRequestException('Unsupported data network.');
    }

    const catalogue = await this.paybetaService.getDataBundles(service);

    if (!catalogue || !Array.isArray(catalogue.packages)) {
      throw new ServiceUnavailableException(
        'The data catalogue is temporarily unavailable.',
      );
    }

    // Remove bundle codes that occur more than once.
    // This prevents the app from offering a bundle that the
    // purchase service cannot uniquely identify.
    const codeCounts = new Map<string, number>();

    for (const bundle of catalogue.packages) {
      codeCounts.set(
        bundle.code,
        (codeCounts.get(bundle.code) ?? 0) + 1,
      );
    }

    const packages = catalogue.packages.filter(
      (bundle) =>
        typeof bundle.code === 'string' &&
        codeCounts.get(bundle.code) === 1,
    );

    return {
      service,
      packages,
    };
  }

  private validatePhoneNumber(phoneNumber: string): void {
    if (!/^0[789][01]\d{8}$/.test(phoneNumber)) {
      throw new BadRequestException('Enter a valid Nigerian phone number.');
    }
  }

  private validateIdempotencyKey(key: string): string {
    const normalized = key?.trim();

    if (!normalized || normalized.length < 8 || normalized.length > 100) {
      throw new BadRequestException(
        'A valid idempotency key between 8 and 100 characters is required.',
      );
    }

    return normalized;
  }

  async purchaseAirtime(input: AirtimePurchaseInput) {
    this.ensurePurchasesEnabled();

    const services = [
      'mtn_vtu',
      'glo_vtu',
      'airtel_vtu',
      '9mobile_vtu',
    ];

    if (!services.includes(input.service)) {
      throw new BadRequestException('Unsupported airtime network.');
    }

    this.validatePhoneNumber(input.phoneNumber);

    if (
      !Number.isSafeInteger(input.amount) ||
      input.amount <= 0 ||
      input.amount > 1_000_000
    ) {
      throw new BadRequestException('Enter a valid airtime amount.');
    }

    const idempotencyKey = this.validateIdempotencyKey(
      input.idempotencyKey,
    );

    const amountKobo = (BigInt(input.amount) * 100n).toString();

    const reservation = await this.reservePurchase({
      userId: input.userId,
      type: 'airtime',
      service: input.service,
      phoneNumber: input.phoneNumber,
      amountKobo,
      idempotencyKey,
    });

    if (reservation.reused) return reservation;

    return this.submitProviderPurchase(
      reservation.purchase,
      () =>
        this.paybetaService.purchaseAirtime({
          service: input.service,
          phoneNumber: input.phoneNumber,
          amount: input.amount,
          reference: reservation.purchase.reference,
        }),
    );
  }

  async purchaseData(input: DataPurchaseInput) {
    this.ensurePurchasesEnabled();

    const services = [
      'mtn_data',
      'glo_data',
      'airtel_data',
      '9mobile_data',
    ];

    if (!services.includes(input.service)) {
      throw new BadRequestException('Unsupported data network.');
    }

    this.validatePhoneNumber(input.phoneNumber);

    if (!input.bundleCode?.trim()) {
      throw new BadRequestException('Select a valid data bundle.');
    }

    const idempotencyKey = this.validateIdempotencyKey(
      input.idempotencyKey,
    );

    // The backend obtains the price directly from Paybeta.
    // Never trust a data bundle price sent by the mobile app.
    const catalogue = await this.paybetaService.getDataBundles(
      input.service,
    );

    const matchingBundles = catalogue.packages.filter(
      (item) => item.code === input.bundleCode,
    );

    if (matchingBundles.length === 0) {
      throw new BadRequestException('The selected data bundle was not found.');
    }

    if (matchingBundles.length > 1) {
      throw new BadRequestException(
        'This data bundle is ambiguous and cannot currently be purchased.',
      );
    }

    const bundle = matchingBundles[0];
    const amountKobo = parsePriceToKobo(bundle.price);

    // Paybeta expects an integer amount in Naira.
    // Do not silently round fractional Naira prices.
    if (BigInt(amountKobo) % 100n !== 0n) {
      throw new BadRequestException(
        'This data bundle has an unsupported fractional price.',
      );
    }

    const amountNaira = BigInt(amountKobo) / 100n;

    if (amountNaira > BigInt(Number.MAX_SAFE_INTEGER)) {
      throw new BadRequestException('Invalid data bundle price.');
    }

    const reservation = await this.reservePurchase({
      userId: input.userId,
      type: 'data',
      service: input.service,
      phoneNumber: input.phoneNumber,
      bundleCode: bundle.code,
      amountKobo,
      idempotencyKey,
    });

    if (reservation.reused) return reservation;

    return this.submitProviderPurchase(
      reservation.purchase,
      () =>
        this.paybetaService.purchaseData({
          service: input.service,
          phoneNumber: input.phoneNumber,
          amount: Number(amountNaira),
          code: bundle.code,
          reference: reservation.purchase.reference,
        }),
    );
  }

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

    const key = this.validateIdempotencyKey(idempotencyKey);

    if (!/^\d+$/.test(amountKobo) || BigInt(amountKobo) <= 0n) {
      throw new BadRequestException('Invalid purchase amount.');
    }

    return this.db.transaction(async (tx: any) => {
      const [wallet] = await tx
        .select()
        .from(wallets)
        .where(eq(wallets.userId, userId))
        .for('update')
        .limit(1);

      if (!wallet) {
        throw new NotFoundException('Wallet not found.');
      }

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
          (type === 'data' ||
            BigInt(existingPurchase.amountKobo) === BigInt(amountKobo));

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

      const reference = `247VTU_${randomUUID().replace(/-/g, '')}`;

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
        .returning({ balanceKobo: wallets.balanceKobo });

      if (!updatedWallet) {
        throw new BadRequestException('Insufficient wallet balance.');
      }

      const [debitTransaction] = await tx
        .insert(walletTransactions)
        .values({
          walletId: wallet.id,
          type: 'debit',
          status: 'pending',
          amountKobo,
          reference: `${reference}_DEBIT`,
          description: `VTU ${type} purchase`,
          metadata: { purchaseReference: reference, service, phoneNumber },
        })
        .returning();

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

  private async submitProviderPurchase(
    purchase: any,
    submit: () => Promise<{ httpStatus: number; body: unknown }>,
  ) {
    let providerResult: { httpStatus: number; body: unknown };

    try {
      providerResult = await submit();
    } catch {
      // The request may have reached Paybeta even if we did not receive
      // its response. Keep the debit reserved for reconciliation.
      return this.keepPurchasePending(purchase.id, null);
    }

    const outcome = getProviderOutcome(providerResult.body);

    if (outcome === 'successful') {
      return this.completePurchase(purchase, providerResult);
    }

    if (outcome === 'failed') {
      return this.refundFailedPurchase(purchase, providerResult);
    }

    // A timeout, pending response, or unclear response is not proof
    // of failure. Never refund or submit the purchase a second time.
    return this.keepPurchasePending(purchase.id, providerResult.body);
  }

  private async keepPurchasePending(
    purchaseId: string,
    providerResponse: unknown,
  ) {
    const [purchase] = await this.db
      .update(vtuPurchases)
      .set({
        status: 'processing',
        providerResponse: providerResponse as any,
        failureReason: 'Provider result is not yet confirmed.',
        updatedAt: new Date(),
      })
      .where(eq(vtuPurchases.id, purchaseId))
      .returning();

    return {
      message: 'Your purchase is being processed. Please check its status later.',
      purchase,
    };
  }

  private async completePurchase(
    purchase: any,
    providerResult: { httpStatus: number; body: unknown },
  ) {
    return this.db.transaction(async (tx: any) => {
      const [lockedPurchase] = await tx
        .select()
        .from(vtuPurchases)
        .where(eq(vtuPurchases.id, purchase.id))
        .for('update')
        .limit(1);

      if (!lockedPurchase) {
        throw new NotFoundException('Purchase not found.');
      }

      if (lockedPurchase.status === 'reversed' || lockedPurchase.refundTransactionId) {
        return {
          message: 'This purchase has already been refunded.',
          purchase: lockedPurchase,
        };
      }

      if (lockedPurchase.status === 'successful') {
        return {
          message: 'Purchase completed successfully.',
          purchase: lockedPurchase,
        };
      }

      const [updatedPurchase] = await tx
        .update(vtuPurchases)
        .set({
          status: 'successful',
          providerReference: getProviderReference(providerResult.body),
          providerResponse: providerResult.body as any,
          failureReason: null,
          updatedAt: new Date(),
        })
        .where(eq(vtuPurchases.id, purchase.id))
        .returning();

      if (lockedPurchase.debitTransactionId) {
        await tx
          .update(walletTransactions)
          .set({ status: 'successful' })
          .where(eq(walletTransactions.id, lockedPurchase.debitTransactionId));
      }

      return {
        message: 'Purchase completed successfully.',
        purchase: updatedPurchase,
      };
    });
  }

  private async refundFailedPurchase(
    purchase: any,
    providerResult: { httpStatus: number; body: unknown },
  ) {
    return this.db.transaction(async (tx: any) => {
      const [lockedPurchase] = await tx
        .select()
        .from(vtuPurchases)
        .where(eq(vtuPurchases.id, purchase.id))
        .for('update')
        .limit(1);

      if (!lockedPurchase) {
        throw new NotFoundException('Purchase not found.');
      }

      // A previous webhook or reconciliation may already have refunded it.
      if (lockedPurchase.refundTransactionId) {
        return {
          message: 'This failed purchase has already been refunded.',
          purchase: lockedPurchase,
        };
      }

      if (lockedPurchase.status === 'successful') {
        return {
          message: 'This purchase has already been completed.',
          purchase: lockedPurchase,
        };
      }

      const [wallet] = await tx
        .select()
        .from(wallets)
        .where(eq(wallets.id, lockedPurchase.walletId))
        .for('update')
        .limit(1);

      if (!wallet) {
        throw new NotFoundException('Wallet not found for refund.');
      }

      const refundReference = `${lockedPurchase.reference}_REFUND`;

      const [existingRefund] = await tx
        .select()
        .from(walletTransactions)
        .where(eq(walletTransactions.reference, refundReference))
        .limit(1);

      if (existingRefund) {
        // The refund transaction already exists. Link it to the purchase
        // rather than crediting the wallet a second time.
        const [updatedPurchase] = await tx
          .update(vtuPurchases)
          .set({
            status: 'reversed',
            refundTransactionId: existingRefund.id,
            providerReference: getProviderReference(providerResult.body),
            providerResponse: providerResult.body as any,
            failureReason: 'Paybeta confirmed that this purchase failed.',
            updatedAt: new Date(),
          })
          .where(eq(vtuPurchases.id, lockedPurchase.id))
          .returning();

        return {
          message: 'This failed purchase has already been refunded.',
          purchase: updatedPurchase,
        };
      }

      await tx
        .update(wallets)
        .set({
          balanceKobo: sql`${wallets.balanceKobo} + ${lockedPurchase.amountKobo}`,
          updatedAt: new Date(),
        })
        .where(eq(wallets.id, wallet.id));

      const [refundTransaction] = await tx
        .insert(walletTransactions)
        .values({
          walletId: wallet.id,
          type: 'credit',
          status: 'successful',
          amountKobo: lockedPurchase.amountKobo,
          reference: refundReference,
          description: `Refund for VTU ${lockedPurchase.type} purchase`,
          metadata: { purchaseReference: lockedPurchase.reference },
        })
        .returning();

      if (lockedPurchase.debitTransactionId) {
        await tx
          .update(walletTransactions)
          .set({ status: 'successful' })
          .where(
            eq(
              walletTransactions.id,
              lockedPurchase.debitTransactionId,
            ),
          );
      }

      const [updatedPurchase] = await tx
        .update(vtuPurchases)
        .set({
          status: 'reversed',
          refundTransactionId: refundTransaction.id,
          providerReference: getProviderReference(providerResult.body),
          providerResponse: providerResult.body as any,
          failureReason: 'Paybeta confirmed that this purchase failed.',
          updatedAt: new Date(),
        })
        .where(eq(vtuPurchases.id, lockedPurchase.id))
        .returning();

      return {
        message: 'Purchase failed. Your wallet has been refunded.',
        purchase: updatedPurchase,
      };
    });
  }
}
