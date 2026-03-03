ALTER TYPE "public"."job_infos_experience_level" ADD VALUE 'intern' BEFORE 'junior';--> statement-breakpoint
ALTER TYPE "public"."job_infos_experience_level" ADD VALUE 'fresh' BEFORE 'junior';--> statement-breakpoint
ALTER TABLE "job_info" ADD COLUMN "resumeUrl" varchar;