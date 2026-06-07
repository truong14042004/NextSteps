import { z } from "zod";
import { experienceLevels, type ExperienceLevel } from "@/drizzle/schema/jobInfo";
import { getUserJobInfos } from "@/features/jobInfos/actions";

export const analysisSchema = z.object({
  candidateName: z.string().min(1, "Vui lòng nhập họ tên ứng viên"),
  jobTitle: z.string().min(1, "Vui lòng nhập vị trí tuyển dụng"),
  experienceLevel: z.enum(experienceLevels),
  jobDescription: z.string().min(1, "Vui lòng nhập mô tả công việc"),
});

export type AnalysisFormData = z.infer<typeof analysisSchema>;
export type JobInfoHistory = Awaited<ReturnType<typeof getUserJobInfos>>;

export type ExploreDraft = {
  postId: string;
  jobTitle: string;
  companyName: string | null;
  jobDescription: string;
};

export type UsageInfo = {
  used: number;
  total: number | null;
  remaining: number | null;
  planName: string;
  resetText: string;
  billingMode: "subscription" | "pay_per_use";
};

export const defaultUsage: UsageInfo = {
  used: 0,
  total: 0,
  remaining: 0,
  planName: "Free",
  resetText: "Đang tải...",
  billingMode: "subscription",
};

export type ExperienceLevelOption = ExperienceLevel;