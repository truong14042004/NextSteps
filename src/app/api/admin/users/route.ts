import { NextResponse } from "next/server"

import { requireAdminForApi } from "@/features/admin/auth"
import {
  createAdminUser,
  listAdminUsers,
  parseAdminUserListParams,
} from "@/features/admin/users"

export const dynamic = "force-dynamic"

export async function GET(request: Request) {
  const admin = await requireAdminForApi()
  if (!admin.ok) return admin.response

  const url = new URL(request.url)
  const params = parseAdminUserListParams(url.searchParams)
  const data = await listAdminUsers(params)

  return NextResponse.json(data)
}

export async function POST(request: Request) {
  const admin = await requireAdminForApi()
  if (!admin.ok) return admin.response

  const result = await createAdminUser(await request.json())
  if (!result.ok) {
    return NextResponse.json(
      { message: result.message },
      { status: result.status }
    )
  }

  return NextResponse.json({ user: result.user }, { status: 201 })
}
