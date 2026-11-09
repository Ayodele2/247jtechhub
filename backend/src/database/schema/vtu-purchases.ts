
import {
  pgEnum,
  pgTable,
  uuid,
  varchar,
  numeric,
  timestamp,
  jsonb,
  index,
  uniqueIndex,
  check,
} from 'drizzle-orm/pg-core';

import { sql } from 'drizzle-orm';

import { users } from './users';
import { wallets, walletTransactions } from './wallets';

export const vtuPurchaseType = pgEnum(
  'vtu_purchase_type',
  ['airtime', 'data'],
);

export const vtuPurchaseStatus = pgEnum(
  'vtu_purchase_status',
  ['pending', 'processing', 'successful', 'failed', 'reversed'],
);

export const vtuPurchases = pgTable(
  'vtu_purchases',
  {
    id: uuid('id').defaultRandom().primaryKey(),

    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'restrict' }),

    walletId: uuid('wallet_id')
      .notNull()
      .references(() => wallets.id, { onDelete: 'restrict' }),

    type: vtuPurchaseType('type').notNull(),

    status: vtuPurchaseStatus('status')
      .notNull()
      .default('pending'),

    service: varchar('service', { length: 50 }).notNull(),

    phoneNumber: varchar('phone_number', { length: 20 }).notNull(),

    bundleCode: varchar('bundle_code', { length: 100 }),

    amountKobo: numeric('amount_kobo', {
      precision: 20,
      scale: 0,
    }).notNull(),

    reference: varchar('reference', { length: 100 })
      .notNull()
      .unique(),

    idempotencyKey: varchar('idempotency_key', {
      length: 100,
    }).notNull(),

    providerReference: varchar('provider_reference', {
      length: 100,
    }).unique(),

    debitTransactionId: uuid('debit_transaction_id')
      .unique()
      .references(() => walletTransactions.id, {
        onDelete: 'restrict',
      }),

    refundTransactionId: uuid('refund_transaction_id')
      .unique()
      .references(() => walletTransactions.id, {
        onDelete: 'restrict',
      }),

    providerResponse: jsonb('provider_response'),

    failureReason: varchar('failure_reason', { length: 500 }),

    createdAt: timestamp('created_at', {
      withTimezone: true,
    })
      .defaultNow()
      .notNull(),

    updatedAt: timestamp('updated_at', {
      withTimezone: true,
    })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    uniqueIndex('vtu_purchases_user_idempotency_key_idx').on(
      table.userId,
      table.idempotencyKey,
    ),

    index('vtu_purchases_user_id_idx').on(table.userId),

    index('vtu_purchases_wallet_id_idx').on(table.walletId),

    index('vtu_purchases_status_idx').on(table.status),

    index('vtu_purchases_created_at_idx').on(table.createdAt),

    check(
      'vtu_purchases_amount_positive',
      sql`${table.amountKobo} > 0`,
    ),
  ],
);
