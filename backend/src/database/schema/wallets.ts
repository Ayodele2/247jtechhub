import {
  pgTable,
  uuid,
  varchar,
  numeric,
  timestamp,
  pgEnum,
  jsonb,
  index,
  check,
} from 'drizzle-orm/pg-core';

import { sql } from 'drizzle-orm';
import { users } from './users';

export const walletTransactionType = pgEnum(
  'wallet_transaction_type',
  ['credit', 'debit'],
);

export const walletTransactionStatus = pgEnum(
  'wallet_transaction_status',
  ['pending', 'successful', 'failed'],
);

export const wallets = pgTable(
  'wallets',
  {
    id: uuid('id').defaultRandom().primaryKey(),

    userId: uuid('user_id')
      .notNull()
      .unique()
      .references(() => users.id, { onDelete: 'cascade' }),

    balanceKobo: numeric('balance_kobo', {
      precision: 20,
      scale: 0,
    })
      .notNull()
      .default('0'),

    currency: varchar('currency', { length: 3 })
      .notNull()
      .default('NGN'),

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
    check(
      'wallets_balance_nonnegative',
      sql`${table.balanceKobo} >= 0`,
    ),
  ],
);

export const walletTransactions = pgTable(
  'wallet_transactions',
  {
    id: uuid('id').defaultRandom().primaryKey(),

    walletId: uuid('wallet_id')
      .notNull()
      .references(() => wallets.id, { onDelete: 'restrict' }),

    type: walletTransactionType('type').notNull(),

    status: walletTransactionStatus('status')
      .notNull()
      .default('pending'),

    amountKobo: numeric('amount_kobo', {
      precision: 20,
      scale: 0,
    }).notNull(),

    reference: varchar('reference', { length: 100 })
      .notNull()
      .unique(),

    description: varchar('description', { length: 255 }),

    metadata: jsonb('metadata'),

    createdAt: timestamp('created_at', {
      withTimezone: true,
    })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index('wallet_transactions_wallet_id_idx').on(table.walletId),

    index('wallet_transactions_created_at_idx').on(table.createdAt),

    check(
      'wallet_transactions_amount_positive',
      sql`${table.amountKobo} > 0`,
    ),
  ],
);