import { getCurrentUser } from "./getCurrentUser"

type Permission =
  | "unlimited_resume_analysis"
  | "unlimited_interviews"
  | "unlimited_questions"
  | "1_interview"
  | "5_questions"

export async function hasPermission(_permission: Permission) {
  const { userId } = await getCurrentUser()
  if (userId == null) return false

  // Temporary unlock: allow all authenticated users to use all features.
  // Revert this when plan-based permissions are needed again.
  return true
}
