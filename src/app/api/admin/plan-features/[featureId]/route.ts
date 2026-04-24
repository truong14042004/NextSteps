import { NextResponse } from "next/server"

import { requireAdminForApi } from "@/features/admin/auth"
import {
  deleteAdminPlanFeature,
  updateAdminPlanFeature,
} from "@/features/admin/plans"

export const dynamic = "force-dynamic"

type RouteContext = {
  params: Promise<{
    featureId: string
  }>
}

export async function PUT(request: Request, context: RouteContext) {
  const admin = await requireAdminForApi()
  if (!admin.ok) return admin.response

  const { featureId } = await context.params
  const result = await updateAdminPlanFeature(featureId, await request.json())
  if (!result.ok) {
    return NextResponse.json(
      { message: result.message },
      { status: result.status }
    )
  }

  return NextResponse.json({ feature: result.feature })
}

export async function DELETE(_request: Request, context: RouteContext) {
  const admin = await requireAdminForApi()
  if (!admin.ok) return admin.response

  const { featureId } = await context.params
  const result = await deleteAdminPlanFeature(featureId)
  if (!result.ok) {
    return NextResponse.json(
      { message: result.message },
      { status: result.status }
    )
  }

  return NextResponse.json({ ok: true })
}
