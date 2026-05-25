ALTER TABLE "admin_plans" ADD COLUMN IF NOT EXISTS "aiQuizLimit" integer;
--> statement-breakpoint
UPDATE "admin_plans" SET "aiQuizLimit" = 5 WHERE "key" = 'free';
--> statement-breakpoint
UPDATE "admin_plans" SET "aiQuizLimit" = 10 WHERE "key" = 'start';
--> statement-breakpoint
UPDATE "admin_plans" SET "aiQuizLimit" = 20 WHERE "key" = 'premium';
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "quiz_attempt_status" AS ENUM ('in_progress', 'submitted', 'expired');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "quizzes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"jobInfoId" uuid NOT NULL,
	"userId" varchar NOT NULL,
	"title" varchar(200) NOT NULL,
	"totalQuestions" integer DEFAULT 30 NOT NULL,
	"durationSeconds" integer DEFAULT 2700 NOT NULL,
	"maxAttempts" integer DEFAULT 5 NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "quiz_questions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"quizId" uuid NOT NULL,
	"order" integer NOT NULL,
	"text" text NOT NULL,
	"options" jsonb NOT NULL,
	"correctIndex" integer NOT NULL,
	"explanation" text NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "quiz_attempts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"quizId" uuid NOT NULL,
	"userId" varchar NOT NULL,
	"status" "quiz_attempt_status" DEFAULT 'in_progress' NOT NULL,
	"startedAt" timestamp with time zone DEFAULT now() NOT NULL,
	"submittedAt" timestamp with time zone,
	"expiresAt" timestamp with time zone NOT NULL,
	"score" integer,
	"answers" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "quizzes" ADD CONSTRAINT "quizzes_jobInfoId_job_info_id_fk" FOREIGN KEY ("jobInfoId") REFERENCES "public"."job_info"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "quizzes" ADD CONSTRAINT "quizzes_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "quiz_questions" ADD CONSTRAINT "quiz_questions_quizId_quizzes_id_fk" FOREIGN KEY ("quizId") REFERENCES "public"."quizzes"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "quiz_attempts" ADD CONSTRAINT "quiz_attempts_quizId_quizzes_id_fk" FOREIGN KEY ("quizId") REFERENCES "public"."quizzes"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "quiz_attempts" ADD CONSTRAINT "quiz_attempts_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "quizzes_user_job_idx" ON "quizzes" USING btree ("userId", "jobInfoId");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "quiz_questions_quiz_order_idx" ON "quiz_questions" USING btree ("quizId", "order");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "quiz_attempts_quiz_user_idx" ON "quiz_attempts" USING btree ("quizId", "userId");
