import { getCurrentUser } from "./getCurrentUser"
import { canUseFeature } from "@/features/plans/entitlements"

type Permission =
  | "unlimited_resume_analysis"
  | "unlimited_interviews"
  | "unlimited_questions"
  | "1_interview"
  | "5_questions"

const PERMISSION_FEATURES: Record<Permission, Parameters<typeof canUseFeature>[0]> = {
  unlimited_resume_analysis: "resume_analysis",
  unlimited_interviews: "mock_interview",
  unlimited_questions: "ai_question",
  "1_interview": "mock_interview",
  "5_questions": "ai_question",
}

export async function hasPermission(permission: Permission) {
  const { userId } = await getCurrentUser()
  if (userId == null) return false

  return canUseFeature(PERMISSION_FEATURES[permission])
}
