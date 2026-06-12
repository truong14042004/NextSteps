import { NextResponse } from "next/server"

import { requireAdminForApi } from "@/features/admin/auth"
import {
  listAdminServiceReviews,
  parseAdminServiceReviewListParams,
} from "@/features/serviceReviews"

export const dynamic = "force-dynamic"

export async function GET(request: Request) {
  try {
    const admin = await requireAdminForApi()
    if (!admin.ok) return admin.response

    const url = new URL(request.url)
    const data = await listAdminServiceReviews(
      parseAdminServiceReviewListParams(url.searchParams)
    )

    return NextResponse.json(data, {
      headers: {
        "Cache-Control": "no-store",
      },
    })
  } catch (error) {
    console.error("[GET /api/admin/service-reviews] Error:", error)
    const message =
      error instanceof Error ? error.message : "Internal server error"
    return NextResponse.json({ message }, { status: 500 })
  }
}
