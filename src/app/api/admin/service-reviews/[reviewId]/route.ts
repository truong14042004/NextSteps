import { NextResponse } from "next/server"

import { requireAdminForApi } from "@/features/admin/auth"
import { updateAdminServiceReviewStatus } from "@/features/serviceReviews"

export const dynamic = "force-dynamic"

export async function PATCH(
  request: Request,
  context: { params: Promise<{ reviewId: string }> }
) {
  const admin = await requireAdminForApi()
  if (!admin.ok) return admin.response

  const { reviewId } = await context.params
  const result = await updateAdminServiceReviewStatus(
    reviewId,
    await request.json()
  )

  if (!result.ok) {
    return NextResponse.json(
      { message: result.message },
      { status: result.status }
    )
  }

  return NextResponse.json({ review: result.review })
}
