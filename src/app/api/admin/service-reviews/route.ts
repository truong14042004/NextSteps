import { NextResponse } from "next/server"

import { requireAdminForApi } from "@/features/admin/auth"
import {
  listAdminServiceReviews,
  parseAdminServiceReviewListParams,
} from "@/features/serviceReviews"

export const dynamic = "force-dynamic"

export async function GET(request: Request) {
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
}
