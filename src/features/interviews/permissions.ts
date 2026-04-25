import { canUseFeature } from "@/features/plans/entitlements"

export async function canCreateInterview() {
  return canUseFeature("mock_interview")
}
