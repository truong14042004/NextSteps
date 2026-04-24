import { NextResponse } from "next/server"

import { requireAdminForApi } from "@/features/admin/auth"
import { getAdminPlans } from "@/features/admin/metrics"
import { listAdminPlanConfigs } from "@/features/admin/plans"

export const dynamic = "force-dynamic"

export async function GET() {
  const admin = await requireAdminForApi()
  if (!admin.ok) return admin.response

  const [summary, configs] = await Promise.all([
    getAdminPlans(),
    listAdminPlanConfigs(),
  ])

  return NextResponse.json({ ...summary, configs })
}
