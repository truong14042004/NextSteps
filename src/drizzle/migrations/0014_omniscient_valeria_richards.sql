CREATE TYPE "public"."users_role" AS ENUM('user', 'pro', 'recruiter', 'admin');--> statement-breakpoint
CREATE TYPE "public"."auth_otp_purpose" AS ENUM('sign_in', 'sign_up', 'password_reset');--> statement-breakpoint
CREATE TYPE "public"."explore_comment_status" AS ENUM('published', 'hidden', 'deleted');--> statement-breakpoint
CREATE TYPE "public"."explore_post_status" AS ENUM('pending', 'published', 'rejected', 'hidden', 'deleted');--> statement-breakpoint
CREATE TYPE "public"."explore_post_type" AS ENUM('job_post', 'cv_showcase');--> statement-breakpoint
CREATE TYPE "public"."job_application_status" AS ENUM('pending', 'reviewing', 'accepted', 'rejected', 'withdrawn');--> statement-breakpoint
CREATE TYPE "public"."recruiter_request_status" AS ENUM('pending', 'approved', 'rejected', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."quiz_attempt_status" AS ENUM('in_progress', 'submitted', 'expired');--> statement-breakpoint
CREATE TABLE "auth_credentials" (
	"userId" varchar PRIMARY KEY NOT NULL,
	"username" varchar NOT NULL,
	"passwordHash" varchar NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "auth_google_accounts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"userId" varchar NOT NULL,
	"googleSub" varchar NOT NULL,
	"email" varchar NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "auth_otps" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" varchar NOT NULL,
	"purpose" "auth_otp_purpose" NOT NULL,
	"name" varchar,
	"firstName" varchar,
	"lastName" varchar,
	"username" varchar,
	"passwordHash" varchar,
	"codeHash" varchar NOT NULL,
	"attempts" integer DEFAULT 0 NOT NULL,
	"expiresAt" timestamp with time zone NOT NULL,
	"consumedAt" timestamp with time zone,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "auth_sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"userId" varchar NOT NULL,
	"tokenHash" varchar NOT NULL,
	"expiresAt" timestamp with time zone NOT NULL,
	"revokedAt" timestamp with time zone,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "admin_plan_features" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"planId" uuid NOT NULL,
	"label" varchar(160) NOT NULL,
	"description" text,
	"isEnabled" boolean DEFAULT true NOT NULL,
	"sortOrder" integer DEFAULT 0 NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "admin_plans" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"key" varchar(32) NOT NULL,
	"name" varchar(80) NOT NULL,
	"description" text NOT NULL,
	"monthlyPrice" integer DEFAULT 0 NOT NULL,
	"annualDiscountPercent" integer DEFAULT 0 NOT NULL,
	"trialDays" integer DEFAULT 0 NOT NULL,
	"resumeAnalysisLimit" integer,
	"aiQuestionLimit" integer,
	"mockInterviewLimit" integer,
	"aiQuizLimit" integer,
	"isActive" boolean DEFAULT true NOT NULL,
	"sortOrder" integer DEFAULT 0 NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "payment_transactions" (
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
CREATE TABLE "user_subscriptions" (
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
--> statement-breakpoint
CREATE TABLE "user_usage_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"userId" varchar NOT NULL,
	"subscriptionId" uuid,
	"feature" varchar(40) NOT NULL,
	"amount" integer DEFAULT 1 NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "service_reviews" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"userId" varchar NOT NULL,
	"serviceKey" varchar(40) DEFAULT 'system' NOT NULL,
	"rating" integer NOT NULL,
	"comment" text,
	"status" varchar(24) DEFAULT 'pending' NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "explore_comments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"postId" uuid NOT NULL,
	"authorId" varchar NOT NULL,
	"content" text NOT NULL,
	"status" "explore_comment_status" DEFAULT 'published' NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "explore_posts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"authorId" varchar NOT NULL,
	"type" "explore_post_type" NOT NULL,
	"status" "explore_post_status" DEFAULT 'pending' NOT NULL,
	"title" varchar(180) NOT NULL,
	"content" text NOT NULL,
	"companyName" varchar(160),
	"positionTitle" varchar(160),
	"location" varchar(160),
	"salaryRange" varchar(120),
	"skills" text,
	"cvUrl" varchar(1024),
	"cvFileName" varchar(255),
	"rejectionReason" text,
	"reviewedById" varchar,
	"reviewedAt" timestamp with time zone,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "job_applications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"postId" uuid NOT NULL,
	"applicantId" varchar NOT NULL,
	"status" "job_application_status" DEFAULT 'pending' NOT NULL,
	"fullName" varchar(160) NOT NULL,
	"email" varchar(255),
	"phone" varchar(40),
	"coverLetter" text,
	"cvUrl" varchar(1024) NOT NULL,
	"cvFileName" varchar(255) NOT NULL,
	"recruiterNote" text,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "recruiter_requests" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"userId" varchar NOT NULL,
	"companyName" varchar(160) NOT NULL,
	"companyWebsite" varchar(255),
	"businessEmail" varchar(255),
	"position" varchar(120) NOT NULL,
	"reason" text NOT NULL,
	"status" "recruiter_request_status" DEFAULT 'pending' NOT NULL,
	"adminNote" text,
	"reviewedById" varchar,
	"reviewedAt" timestamp with time zone,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "quiz_attempts" (
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
CREATE TABLE "quiz_questions" (
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
CREATE TABLE "quizzes" (
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
ALTER TABLE "users" ADD COLUMN "role" "users_role" DEFAULT 'user' NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "status" varchar(24) DEFAULT 'active' NOT NULL;--> statement-breakpoint
ALTER TABLE "job_info" ADD COLUMN "analysisResult" text;--> statement-breakpoint
ALTER TABLE "auth_credentials" ADD CONSTRAINT "auth_credentials_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "auth_google_accounts" ADD CONSTRAINT "auth_google_accounts_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "auth_sessions" ADD CONSTRAINT "auth_sessions_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "admin_plan_features" ADD CONSTRAINT "admin_plan_features_planId_admin_plans_id_fk" FOREIGN KEY ("planId") REFERENCES "public"."admin_plans"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payment_transactions" ADD CONSTRAINT "payment_transactions_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payment_transactions" ADD CONSTRAINT "payment_transactions_planId_admin_plans_id_fk" FOREIGN KEY ("planId") REFERENCES "public"."admin_plans"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_subscriptions" ADD CONSTRAINT "user_subscriptions_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_subscriptions" ADD CONSTRAINT "user_subscriptions_planId_admin_plans_id_fk" FOREIGN KEY ("planId") REFERENCES "public"."admin_plans"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_subscriptions" ADD CONSTRAINT "user_subscriptions_paymentTransactionId_payment_transactions_id_fk" FOREIGN KEY ("paymentTransactionId") REFERENCES "public"."payment_transactions"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_usage_events" ADD CONSTRAINT "user_usage_events_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_usage_events" ADD CONSTRAINT "user_usage_events_subscriptionId_user_subscriptions_id_fk" FOREIGN KEY ("subscriptionId") REFERENCES "public"."user_subscriptions"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "service_reviews" ADD CONSTRAINT "service_reviews_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "explore_comments" ADD CONSTRAINT "explore_comments_postId_explore_posts_id_fk" FOREIGN KEY ("postId") REFERENCES "public"."explore_posts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "explore_comments" ADD CONSTRAINT "explore_comments_authorId_users_id_fk" FOREIGN KEY ("authorId") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "explore_posts" ADD CONSTRAINT "explore_posts_authorId_users_id_fk" FOREIGN KEY ("authorId") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "explore_posts" ADD CONSTRAINT "explore_posts_reviewedById_users_id_fk" FOREIGN KEY ("reviewedById") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "job_applications" ADD CONSTRAINT "job_applications_postId_explore_posts_id_fk" FOREIGN KEY ("postId") REFERENCES "public"."explore_posts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "job_applications" ADD CONSTRAINT "job_applications_applicantId_users_id_fk" FOREIGN KEY ("applicantId") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recruiter_requests" ADD CONSTRAINT "recruiter_requests_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recruiter_requests" ADD CONSTRAINT "recruiter_requests_reviewedById_users_id_fk" FOREIGN KEY ("reviewedById") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quiz_attempts" ADD CONSTRAINT "quiz_attempts_quizId_quizzes_id_fk" FOREIGN KEY ("quizId") REFERENCES "public"."quizzes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quiz_attempts" ADD CONSTRAINT "quiz_attempts_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quiz_questions" ADD CONSTRAINT "quiz_questions_quizId_quizzes_id_fk" FOREIGN KEY ("quizId") REFERENCES "public"."quizzes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quizzes" ADD CONSTRAINT "quizzes_jobInfoId_job_info_id_fk" FOREIGN KEY ("jobInfoId") REFERENCES "public"."job_info"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quizzes" ADD CONSTRAINT "quizzes_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "auth_credentials_username_unique" ON "auth_credentials" USING btree ("username");--> statement-breakpoint
CREATE UNIQUE INDEX "auth_google_accounts_user_id_unique" ON "auth_google_accounts" USING btree ("userId");--> statement-breakpoint
CREATE UNIQUE INDEX "auth_google_accounts_google_sub_unique" ON "auth_google_accounts" USING btree ("googleSub");--> statement-breakpoint
CREATE INDEX "auth_otps_email_idx" ON "auth_otps" USING btree ("email");--> statement-breakpoint
CREATE INDEX "auth_sessions_user_id_idx" ON "auth_sessions" USING btree ("userId");--> statement-breakpoint
CREATE UNIQUE INDEX "auth_sessions_token_hash_unique" ON "auth_sessions" USING btree ("tokenHash");--> statement-breakpoint
CREATE UNIQUE INDEX "admin_plans_key_unique" ON "admin_plans" USING btree ("key");--> statement-breakpoint
CREATE UNIQUE INDEX "payment_transactions_order_code_unique" ON "payment_transactions" USING btree ("orderCode");--> statement-breakpoint
CREATE INDEX "user_subscriptions_user_period_idx" ON "user_subscriptions" USING btree ("userId","currentPeriodStart","currentPeriodEnd");--> statement-breakpoint
CREATE INDEX "user_usage_events_user_feature_created_idx" ON "user_usage_events" USING btree ("userId","feature","createdAt");--> statement-breakpoint
CREATE INDEX "service_reviews_user_created_idx" ON "service_reviews" USING btree ("userId","createdAt");--> statement-breakpoint
CREATE INDEX "service_reviews_status_created_idx" ON "service_reviews" USING btree ("status","createdAt");