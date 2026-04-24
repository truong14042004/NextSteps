import { NextResponse } from "next/server"

import { requireAdminForApi } from "@/features/admin/auth"
import { getRecentAdminUsers } from "@/features/admin/metrics"

export const dynamic = "force-dynamic"

export async function GET() {
  const admin = await requireAdminForApi()
  if (!admin.ok) return admin.response

  try {
    return NextResponse.json({ users: await getRecentAdminUsers() })
  } catch (err) {
    console.error("Error fetching recent users", err)
    return NextResponse.json({ users: [] }, { status: 500 })
  }
}
