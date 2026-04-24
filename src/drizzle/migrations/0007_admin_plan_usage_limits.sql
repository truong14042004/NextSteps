ALTER TABLE "admin_plans" ADD COLUMN IF NOT EXISTS "resumeAnalysisLimit" integer;
--> statement-breakpoint
ALTER TABLE "admin_plans" ADD COLUMN IF NOT EXISTS "aiQuestionLimit" integer;
--> statement-breakpoint
ALTER TABLE "admin_plans" ADD COLUMN IF NOT EXISTS "mockInterviewLimit" integer;
--> statement-breakpoint
UPDATE "admin_plans"
SET
	"resumeAnalysisLimit" = 10,
	"aiQuestionLimit" = 5,
	"mockInterviewLimit" = 1
WHERE "key" = 'free';
--> statement-breakpoint
UPDATE "admin_plans"
SET
	"resumeAnalysisLimit" = NULL,
	"aiQuestionLimit" = 100,
	"mockInterviewLimit" = 3
WHERE "key" = 'start';
--> statement-breakpoint
UPDATE "admin_plans"
SET
	"resumeAnalysisLimit" = NULL,
	"aiQuestionLimit" = NULL,
	"mockInterviewLimit" = 10
WHERE "key" = 'premium';
