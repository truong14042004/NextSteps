DO $$ BEGIN
  ALTER TYPE "users_role" ADD VALUE IF NOT EXISTS 'recruiter';
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "explore_post_type" AS ENUM('job_post', 'cv_showcase');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "explore_post_status" AS ENUM('pending', 'published', 'rejected', 'hidden', 'deleted');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "explore_comment_status" AS ENUM('published', 'hidden', 'deleted');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "recruiter_request_status" AS ENUM('pending', 'approved', 'rejected', 'cancelled');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS "explore_posts" (
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

CREATE TABLE IF NOT EXISTS "explore_comments" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "postId" uuid NOT NULL,
  "authorId" varchar NOT NULL,
  "content" text NOT NULL,
  "status" "explore_comment_status" DEFAULT 'published' NOT NULL,
  "createdAt" timestamp with time zone DEFAULT now() NOT NULL,
  "updatedAt" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "recruiter_requests" (
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

DO $$ BEGIN
  ALTER TABLE "explore_posts" ADD CONSTRAINT "explore_posts_authorId_users_id_fk" FOREIGN KEY ("authorId") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE "explore_posts" ADD CONSTRAINT "explore_posts_reviewedById_users_id_fk" FOREIGN KEY ("reviewedById") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE "explore_comments" ADD CONSTRAINT "explore_comments_postId_explore_posts_id_fk" FOREIGN KEY ("postId") REFERENCES "public"."explore_posts"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE "explore_comments" ADD CONSTRAINT "explore_comments_authorId_users_id_fk" FOREIGN KEY ("authorId") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE "recruiter_requests" ADD CONSTRAINT "recruiter_requests_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE "recruiter_requests" ADD CONSTRAINT "recruiter_requests_reviewedById_users_id_fk" FOREIGN KEY ("reviewedById") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

CREATE INDEX IF NOT EXISTS "explore_posts_status_created_idx" ON "explore_posts" USING btree ("status", "createdAt");
CREATE INDEX IF NOT EXISTS "explore_posts_type_status_created_idx" ON "explore_posts" USING btree ("type", "status", "createdAt");
CREATE INDEX IF NOT EXISTS "explore_posts_author_created_idx" ON "explore_posts" USING btree ("authorId", "createdAt");
CREATE INDEX IF NOT EXISTS "explore_comments_post_created_idx" ON "explore_comments" USING btree ("postId", "createdAt");
CREATE INDEX IF NOT EXISTS "recruiter_requests_user_status_idx" ON "recruiter_requests" USING btree ("userId", "status");
CREATE INDEX IF NOT EXISTS "recruiter_requests_status_created_idx" ON "recruiter_requests" USING btree ("status", "createdAt");
