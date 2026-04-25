import { canUseFeature } from "@/features/plans/entitlements"

export async function canRunResumeAnalysis() {
  return canUseFeature("resume_analysis")
}
