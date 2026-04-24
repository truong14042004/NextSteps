import { NextResponse } from "next/server"

import { requireAdminForApi } from "@/features/admin/auth"
import { getAdminDashboard, parseAdminRange } from "@/features/admin/metrics"

export const dynamic = "force-dynamic"

export async function GET(request: Request) {
  const admin = await requireAdminForApi()
  if (!admin.ok) return admin.response

  const url = new URL(request.url)
  const data = await getAdminDashboard(parseAdminRange(url.searchParams))

  return NextResponse.json(data)
}
