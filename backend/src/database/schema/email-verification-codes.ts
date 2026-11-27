
import {
  pgTable,
  uuid,
  varchar,
  timestamp,
  integer,
  uniqueIndex,
} from 'drizzle-orm/pg-core';
import { users } from './users';

export const emailVerificationCodes = pgTable(
  'email_verification_codes',
  {
    id: uuid('id').defaultRandom().primaryKey(),

    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),

    codeHash: varchar('code_hash', { length: 255 }).notNull(),

    expiresAt: timestamp('expires_at', {
      withTimezone: true,
    }).notNull(),

    attempts: integer('attempts').notNull().default(0),

    lastSentAt: timestamp('last_sent_at', {
      withTimezone: true,
    })
      .defaultNow()
      .notNull(),

    createdAt: timestamp('created_at', {
      withTimezone: true,
    })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    uniqueIndex('email_verification_codes_user_id_idx').on(
      table.userId,
    ),
  ],
);
