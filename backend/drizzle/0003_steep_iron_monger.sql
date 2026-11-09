CREATE TYPE "public"."wallet_funding_status" AS ENUM('pending', 'successful', 'failed');--> statement-breakpoint
CREATE TABLE "wallet_fundings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"wallet_id" uuid NOT NULL,
	"amount_kobo" numeric(20, 0) NOT NULL,
	"reference" varchar(100) NOT NULL,
	"paystack_reference" varchar(100),
	"status" "wallet_funding_status" DEFAULT 'pending' NOT NULL,
	"metadata" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "wallet_fundings_reference_unique" UNIQUE("reference"),
	CONSTRAINT "wallet_fundings_amount_positive" CHECK ("wallet_fundings"."amount_kobo" > 0)
);
--> statement-breakpoint
ALTER TABLE "wallet_fundings" ADD CONSTRAINT "wallet_fundings_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "wallet_fundings" ADD CONSTRAINT "wallet_fundings_wallet_id_wallets_id_fk" FOREIGN KEY ("wallet_id") REFERENCES "public"."wallets"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "wallet_fundings_user_id_idx" ON "wallet_fundings" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "wallet_fundings_wallet_id_idx" ON "wallet_fundings" USING btree ("wallet_id");--> statement-breakpoint
CREATE INDEX "wallet_fundings_created_at_idx" ON "wallet_fundings" USING btree ("created_at");--> statement-breakpoint
