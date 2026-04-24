import { NextResponse } from "next/server"
import { z } from "zod"

import { createPayOSPaymentLink } from "@/features/payments/payos"
import { getSessionUserId } from "@/services/auth/lib/session"

export const dynamic = "force-dynamic"

const schema = z.object({
  planKey: z.string().trim().min(1).max(32),
  buyerEmail: z.string().trim().email().optional().or(z.literal("")),
})

export async function POST(request: Request) {
  const userId = await getSessionUserId()
  if (userId == null) {
    return NextResponse.json(
      { message: "Ban can dang nhap de thanh toan." },
      { status: 401 }
    )
  }

  const parsed = schema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) {
    return NextResponse.json(
      { message: "Du lieu thanh toan khong hop le." },
      { status: 400 }
    )
  }

  const origin = new URL(request.url).origin
  const result = await createPayOSPaymentLink({
    userId,
    planKey: parsed.data.planKey,
    buyerEmail: parsed.data.buyerEmail || undefined,
    origin,
  })

  if (!result.ok) {
    return NextResponse.json(
      { message: result.message },
      { status: result.status }
    )
  }

  return NextResponse.json({
    checkoutUrl: result.checkoutUrl,
    orderCode: result.orderCode,
  })
}
