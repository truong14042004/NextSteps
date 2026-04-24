CREATE TABLE IF NOT EXISTS "payment_transactions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"userId" varchar NOT NULL,
	"planId" uuid,
	"planKey" varchar(32) NOT NULL,
	"orderCode" bigint NOT NULL,
	"paymentLinkId" varchar(128),
	"amount" integer NOT NULL,
	"currency" varchar(8) DEFAULT 'VND' NOT NULL,
	"status" varchar(24) DEFAULT 'pending' NOT NULL,
	"checkoutUrl" text,
	"qrCode" text,
	"providerPayload" jsonb,
	"paidAt" timestamp with time zone,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "payment_transactions" ADD CONSTRAINT "payment_transactions_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "payment_transactions" ADD CONSTRAINT "payment_transactions_planId_admin_plans_id_fk" FOREIGN KEY ("planId") REFERENCES "public"."admin_plans"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "payment_transactions_order_code_unique" ON "payment_transactions" USING btree ("orderCode");
