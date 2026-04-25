CREATE TABLE IF NOT EXISTS "user_subscriptions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"userId" varchar NOT NULL,
	"planId" uuid,
	"planKey" varchar(32) NOT NULL,
	"status" varchar(24) DEFAULT 'active' NOT NULL,
	"currentPeriodStart" timestamp with time zone NOT NULL,
	"currentPeriodEnd" timestamp with time zone NOT NULL,
	"paymentTransactionId" uuid,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "user_usage_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"userId" varchar NOT NULL,
	"subscriptionId" uuid,
	"feature" varchar(40) NOT NULL,
	"amount" integer DEFAULT 1 NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL
);

DO $$ BEGIN
 ALTER TABLE "user_subscriptions" ADD CONSTRAINT "user_subscriptions_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "user_subscriptions" ADD CONSTRAINT "user_subscriptions_planId_admin_plans_id_fk" FOREIGN KEY ("planId") REFERENCES "public"."admin_plans"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "user_subscriptions" ADD CONSTRAINT "user_subscriptions_paymentTransactionId_payment_transactions_id_fk" FOREIGN KEY ("paymentTransactionId") REFERENCES "public"."payment_transactions"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "user_usage_events" ADD CONSTRAINT "user_usage_events_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "user_usage_events" ADD CONSTRAINT "user_usage_events_subscriptionId_user_subscriptions_id_fk" FOREIGN KEY ("subscriptionId") REFERENCES "public"."user_subscriptions"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

CREATE INDEX IF NOT EXISTS "user_subscriptions_user_period_idx" ON "user_subscriptions" USING btree ("userId", "currentPeriodStart", "currentPeriodEnd");
CREATE INDEX IF NOT EXISTS "user_usage_events_user_feature_created_idx" ON "user_usage_events" USING btree ("userId", "feature", "createdAt");

INSERT INTO "user_subscriptions" (
	"userId",
	"planId",
	"planKey",
	"status",
	"currentPeriodStart",
	"currentPeriodEnd",
	"paymentTransactionId"
)
SELECT DISTINCT ON (u."id")
	u."id",
	p."id",
	coalesce(t."planKey", 'premium'),
	'active',
	coalesce(t."paidAt", now()),
	coalesce(t."paidAt", now()) + interval '30 days',
	t."id"
FROM "users" u
LEFT JOIN LATERAL (
	SELECT *
	FROM "payment_transactions" pt
	WHERE pt."userId" = u."id" AND pt."status" = 'paid'
	ORDER BY pt."paidAt" DESC NULLS LAST, pt."createdAt" DESC
	LIMIT 1
) t ON true
LEFT JOIN "admin_plans" p ON p."key" = coalesce(t."planKey", 'premium')
WHERE u."role" = 'pro'
AND NOT EXISTS (
	SELECT 1 FROM "user_subscriptions" existing
	WHERE existing."userId" = u."id"
);
