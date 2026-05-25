import { canUseFeature } from "@/features/plans/entitlements"

export async function canStartQuizAttempt() {
  return canUseFeature("ai_quiz")
}
