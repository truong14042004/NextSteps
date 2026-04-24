CREATE TABLE IF NOT EXISTS "admin_plans" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"key" varchar(32) NOT NULL,
	"name" varchar(80) NOT NULL,
	"description" text NOT NULL,
	"monthlyPrice" integer DEFAULT 0 NOT NULL,
	"annualDiscountPercent" integer DEFAULT 0 NOT NULL,
	"trialDays" integer DEFAULT 0 NOT NULL,
	"isActive" boolean DEFAULT true NOT NULL,
	"sortOrder" integer DEFAULT 0 NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "admin_plan_features" (
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
DO $$ BEGIN
 ALTER TABLE "admin_plan_features" ADD CONSTRAINT "admin_plan_features_planId_admin_plans_id_fk" FOREIGN KEY ("planId") REFERENCES "public"."admin_plans"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "admin_plans_key_unique" ON "admin_plans" USING btree ("key");
--> statement-breakpoint
INSERT INTO "admin_plans" ("key", "name", "description", "monthlyPrice", "annualDiscountPercent", "trialDays", "isActive", "sortOrder")
VALUES
	('free', 'Free', 'Gói cơ bản cho người dùng mới trải nghiệm NextStep.', 0, 0, 0, true, 10),
	('start', 'Start', 'Gói trả phí cơ bản cho luyện phỏng vấn và phân tích CV.', 399000, 10, 7, true, 20),
	('premium', 'Premium', 'Gói đầy đủ tính năng cho người dùng cần luyện tập chuyên sâu.', 799000, 15, 14, true, 30)
ON CONFLICT ("key") DO NOTHING;
--> statement-breakpoint
INSERT INTO "admin_plan_features" ("planId", "label", "description", "isEnabled", "sortOrder")
SELECT p."id", f."label", f."description", f."isEnabled", f."sortOrder"
FROM "admin_plans" p
JOIN (
	VALUES
	('free', 'Phân tích CV cơ bản', 'Cho phép phân tích CV với giới hạn lượt dùng.', true, 10),
	('free', 'Luyện phỏng vấn thử', 'Trải nghiệm luồng phỏng vấn AI giới hạn.', true, 20),
	('free', 'Báo cáo nâng cao', 'Ẩn báo cáo chuyên sâu cho gói miễn phí.', false, 30),
	('start', 'Phân tích CV nâng cao', 'Mở phân tích CV theo JD với gợi ý cải thiện.', true, 10),
	('start', 'Luyện phỏng vấn AI', 'Cho phép luyện phỏng vấn theo vị trí ứng tuyển.', true, 20),
	('start', 'Lịch sử kết quả', 'Lưu và xem lại các buổi luyện tập trước.', true, 30),
	('premium', 'Không giới hạn phân tích CV', 'Mở giới hạn phân tích cho người dùng premium.', true, 10),
	('premium', 'Không giới hạn phỏng vấn AI', 'Mở giới hạn luyện phỏng vấn cho người dùng premium.', true, 20),
	('premium', 'Feedback chuyên sâu', 'Báo cáo đánh giá chi tiết sau mỗi buổi phỏng vấn.', true, 30)
) AS f("planKey", "label", "description", "isEnabled", "sortOrder")
ON p."key" = f."planKey"
WHERE NOT EXISTS (
	SELECT 1 FROM "admin_plan_features" existing
	WHERE existing."planId" = p."id" AND existing."label" = f."label"
);
