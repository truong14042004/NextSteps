import { canUseFeature } from "@/features/plans/entitlements"

export async function canCreateQuestion() {
  return canUseFeature("ai_question")
}
