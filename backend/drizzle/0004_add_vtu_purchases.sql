
CREATE TYPE "public"."vtu_purchase_status" AS ENUM(
    'pending',
    'processing',
    'successful',
    'failed',
    'reversed'
);
--> statement-breakpoint

CREATE TYPE "public"."vtu_purchase_type" AS ENUM(
    'airtime',
    'data'
);
--> statement-breakpoint

CREATE TABLE "vtu_purchases" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    "user_id" uuid NOT NULL,
    "wallet_id" uuid NOT NULL,
    "type" "vtu_purchase_type" NOT NULL,
    "status" "vtu_purchase_status" DEFAULT 'pending' NOT NULL,
    "service" varchar(50) NOT NULL,
    "phone_number" varchar(20) NOT NULL,
    "bundle_code" varchar(100),
    "amount_kobo" numeric(20, 0) NOT NULL,
    "reference" varchar(100) NOT NULL,
    "idempotency_key" varchar(100) NOT NULL,
    "provider_reference" varchar(100),
    "debit_transaction_id" uuid,
    "refund_transaction_id" uuid,
    "provider_response" jsonb,
    "failure_reason" varchar(500),
    "created_at" timestamp with time zone DEFAULT now() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT now() NOT NULL,

    CONSTRAINT "vtu_purchases_reference_unique"
        UNIQUE("reference"),

    CONSTRAINT "vtu_purchases_provider_reference_unique"
        UNIQUE("provider_reference"),

    CONSTRAINT "vtu_purchases_debit_transaction_id_unique"
        UNIQUE("debit_transaction_id"),

    CONSTRAINT "vtu_purchases_refund_transaction_id_unique"
        UNIQUE("refund_transaction_id"),

    CONSTRAINT "vtu_purchases_amount_positive"
        CHECK ("vtu_purchases"."amount_kobo" > 0)
);
--> statement-breakpoint

ALTER TABLE "vtu_purchases"
ADD CONSTRAINT "vtu_purchases_user_id_users_id_fk"
FOREIGN KEY ("user_id")
REFERENCES "public"."users"("id")
ON DELETE restrict ON UPDATE no action;
--> statement-breakpoint

ALTER TABLE "vtu_purchases"
ADD CONSTRAINT "vtu_purchases_wallet_id_wallets_id_fk"
FOREIGN KEY ("wallet_id")
REFERENCES "public"."wallets"("id")
ON DELETE restrict ON UPDATE no action;
--> statement-breakpoint

ALTER TABLE "vtu_purchases"
ADD CONSTRAINT "vtu_purchases_debit_transaction_id_wallet_transactions_id_fk"
FOREIGN KEY ("debit_transaction_id")
REFERENCES "public"."wallet_transactions"("id")
ON DELETE restrict ON UPDATE no action;
--> statement-breakpoint

ALTER TABLE "vtu_purchases"
ADD CONSTRAINT "vtu_purchases_refund_transaction_id_wallet_transactions_id_fk"
FOREIGN KEY ("refund_transaction_id")
REFERENCES "public"."wallet_transactions"("id")
ON DELETE restrict ON UPDATE no action;
--> statement-breakpoint

CREATE UNIQUE INDEX "vtu_purchases_user_idempotency_key_idx"
ON "vtu_purchases" USING btree ("user_id", "idempotency_key");
--> statement-breakpoint

CREATE INDEX "vtu_purchases_user_id_idx"
ON "vtu_purchases" USING btree ("user_id");
--> statement-breakpoint

CREATE INDEX "vtu_purchases_wallet_id_idx"
ON "vtu_purchases" USING btree ("wallet_id");
--> statement-breakpoint

CREATE INDEX "vtu_purchases_status_idx"
ON "vtu_purchases" USING btree ("status");
--> statement-breakpoint

CREATE INDEX "vtu_purchases_created_at_idx"
ON "vtu_purchases" USING btree ("created_at");
