CREATE TABLE IF NOT EXISTS "service_reviews" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"userId" varchar NOT NULL,
	"serviceKey" varchar(40) DEFAULT 'system' NOT NULL,
	"rating" integer NOT NULL,
	"comment" text,
	"status" varchar(24) DEFAULT 'pending' NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL
);

DO $$ BEGIN
 ALTER TABLE "service_reviews" ADD CONSTRAINT "service_reviews_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

CREATE INDEX IF NOT EXISTS "service_reviews_user_created_idx" ON "service_reviews" USING btree ("userId", "createdAt");
CREATE INDEX IF NOT EXISTS "service_reviews_status_created_idx" ON "service_reviews" USING btree ("status", "createdAt");
