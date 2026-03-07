ALTER TABLE "auth_otps" ADD COLUMN IF NOT EXISTS "firstName" varchar;
--> statement-breakpoint
ALTER TABLE "auth_otps" ADD COLUMN IF NOT EXISTS "lastName" varchar;
--> statement-breakpoint
ALTER TABLE "auth_otps" ADD COLUMN IF NOT EXISTS "username" varchar;
--> statement-breakpoint
ALTER TABLE "auth_otps" ADD COLUMN IF NOT EXISTS "passwordHash" varchar;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "auth_credentials" (
	"userId" varchar PRIMARY KEY NOT NULL,
	"username" varchar NOT NULL,
	"passwordHash" varchar NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "auth_google_accounts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"userId" varchar NOT NULL,
	"googleSub" varchar NOT NULL,
	"email" varchar NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "auth_credentials" ADD CONSTRAINT "auth_credentials_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "auth_google_accounts" ADD CONSTRAINT "auth_google_accounts_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "auth_credentials_username_unique" ON "auth_credentials" USING btree ("username");
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "auth_google_accounts_user_id_unique" ON "auth_google_accounts" USING btree ("userId");
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "auth_google_accounts_google_sub_unique" ON "auth_google_accounts" USING btree ("googleSub");
