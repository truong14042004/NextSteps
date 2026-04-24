import { NextResponse } from "next/server"

import { requireAdminForApi } from "@/features/admin/auth"
import { createAdminPlanFeature } from "@/features/admin/plans"

export const dynamic = "force-dynamic"

type RouteContext = {
  params: Promise<{
    planKey: string
  }>
}

export async function POST(request: Request, context: RouteContext) {
  const admin = await requireAdminForApi()
  if (!admin.ok) return admin.response

  const { planKey } = await context.params
  const result = await createAdminPlanFeature(planKey, await request.json())
  if (!result.ok) {
    return NextResponse.json(
      { message: result.message },
      { status: result.status }
    )
  }

  return NextResponse.json({ feature: result.feature }, { status: 201 })
}
