import { NextResponse } from "next/server"

import { createServiceReview } from "@/features/serviceReviews"

export const dynamic = "force-dynamic"

export async function POST(request: Request) {
  const result = await createServiceReview(await request.json())

  if (!result.ok) {
    return NextResponse.json(
      { message: result.message },
      { status: result.status }
    )
  }

  return NextResponse.json({ review: result.review }, { status: 201 })
}
