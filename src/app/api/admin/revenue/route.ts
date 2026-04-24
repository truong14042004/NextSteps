import { NextResponse } from "next/server"

import { requireAdminForApi } from "@/features/admin/auth"
import { getAdminRevenue } from "@/features/admin/metrics"

export const dynamic = "force-dynamic"

export async function GET() {
  const admin = await requireAdminForApi()
  if (!admin.ok) return admin.response

  return NextResponse.json(await getAdminRevenue())
}
