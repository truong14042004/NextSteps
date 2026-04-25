import { NextResponse } from "next/server"

import {
  getFeatureUsageSummary,
} from "@/features/plans/entitlements"
import { getCurrentUser } from "@/services/clerk/lib/getCurrentUser"
import { usageFeatures, type UsageFeature } from "@/drizzle/schema"

function isUsageFeature(value: string | null): value is UsageFeature {
  return usageFeatures.includes(value as UsageFeature)
}

export async function GET(request: Request) {
  const { userId } = await getCurrentUser()
  if (userId == null) {
    return NextResponse.json({ message: "You are not logged in" }, { status: 401 })
  }

  const requestUrl = new URL(request.url)
  const feature = requestUrl.searchParams.get("feature")
  if (!isUsageFeature(feature)) {
    return NextResponse.json({ message: "Invalid usage feature" }, { status: 400 })
  }

  const usage = await getFeatureUsageSummary(feature)
  return NextResponse.json({ usage })
}
