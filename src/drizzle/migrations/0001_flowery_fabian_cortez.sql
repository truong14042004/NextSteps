DO $$ BEGIN
 ALTER TYPE "public"."job_infos_experience_level" ADD VALUE 'intern' BEFORE 'junior';
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TYPE "public"."job_infos_experience_level" ADD VALUE 'fresh' BEFORE 'junior';
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
ALTER TABLE "job_info" ADD COLUMN IF NOT EXISTS "resumeUrl" varchar;
