import { NextResponse } from "next/server"

import { requireAdminForApi } from "@/features/admin/auth"
import { updateAdminPlanConfig } from "@/features/admin/plans"

export const dynamic = "force-dynamic"

type RouteContext = {
  params: Promise<{
    planKey: string
  }>
}

export async function PUT(request: Request, context: RouteContext) {
  const admin = await requireAdminForApi()
  if (!admin.ok) return admin.response

  const { planKey } = await context.params
  const result = await updateAdminPlanConfig(planKey, await request.json())
  if (!result.ok) {
    return NextResponse.json(
      { message: result.message },
      { status: result.status }
    )
  }

  return NextResponse.json({ plan: result.plan })
}
