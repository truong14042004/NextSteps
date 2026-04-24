import { NextResponse } from "next/server"

import { requireAdminForApi } from "@/features/admin/auth"
import { deleteAdminUser, updateAdminUser } from "@/features/admin/users"

export const dynamic = "force-dynamic"

type RouteContext = {
  params: Promise<{
    userId: string
  }>
}

export async function PUT(request: Request, context: RouteContext) {
  const admin = await requireAdminForApi()
  if (!admin.ok) return admin.response

  const { userId } = await context.params
  const result = await updateAdminUser(userId, await request.json())
  if (!result.ok) {
    return NextResponse.json(
      { message: result.message },
      { status: result.status }
    )
  }

  return NextResponse.json({ user: result.user })
}

export async function DELETE(_request: Request, context: RouteContext) {
  const admin = await requireAdminForApi()
  if (!admin.ok) return admin.response

  const { userId } = await context.params
  const result = await deleteAdminUser(userId, admin.userId)
  if (!result.ok) {
    return NextResponse.json(
      { message: result.message },
      { status: result.status }
    )
  }

  return NextResponse.json({ ok: true })
}
