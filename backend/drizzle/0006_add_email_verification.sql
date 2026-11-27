
CREATE TABLE "email_verification_codes" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    "user_id" uuid NOT NULL,
    "code_hash" varchar(255) NOT NULL,
    "expires_at" timestamp with time zone NOT NULL,
    "attempts" integer DEFAULT 0 NOT NULL,
    "last_sent_at" timestamp with time zone DEFAULT now() NOT NULL,
    "created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint

-- Preserve access for all existing customers.
ALTER TABLE "users"
ADD COLUMN "email_verified" boolean DEFAULT true NOT NULL;
--> statement-breakpoint

-- New customers must verify their email.
ALTER TABLE "users"
ALTER COLUMN "email_verified" SET DEFAULT false;
--> statement-breakpoint

ALTER TABLE "email_verification_codes"
ADD CONSTRAINT "email_verification_codes_user_id_users_id_fk"
FOREIGN KEY ("user_id")
REFERENCES "public"."users"("id")
ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint

CREATE UNIQUE INDEX "email_verification_codes_user_id_idx"
ON "email_verification_codes" USING btree ("user_id");
