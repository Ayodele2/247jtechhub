import {
  pgEnum,
  pgTable,
  uuid,
  varchar,
  numeric,
  timestamp,
  jsonb,
  index,
  check,
} from 'drizzle-orm/pg-core';

import { sql } from 'drizzle-orm';

import { users } from './users';
import { wallets } from './wallets';

export const walletFundingStatus = pgEnum(
  'wallet_funding_status',
  ['pending', 'successful', 'failed'],
);

export const walletFundings = pgTable(
  'wallet_fundings',
  {
    id: uuid('id').defaultRandom().primaryKey(),

    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'restrict' }),

    walletId: uuid('wallet_id')
      .notNull()
      .references(() => wallets.id, { onDelete: 'restrict' }),

    amountKobo: numeric('amount_kobo', {
      precision: 20,
      scale: 0,
    }).notNull(),

    reference: varchar('reference', {
      length: 100,
    })
      .notNull()
      .unique(),

    paystackReference: varchar('paystack_reference', {
      length: 100,
    }),

    status: walletFundingStatus('status')
      .notNull()
      .default('pending'),

    metadata: jsonb('metadata'),

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
    index('wallet_fundings_user_id_idx').on(table.userId),

    index('wallet_fundings_wallet_id_idx').on(table.walletId),

    index('wallet_fundings_created_at_idx').on(table.createdAt),

    check(
      'wallet_fundings_amount_positive',
      sql`${table.amountKobo} > 0`,
    ),
  ],
);