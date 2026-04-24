import { NextResponse } from "next/server"

import { syncPayOSTransaction } from "@/features/payments/payos"
import { getSessionUserId } from "@/services/auth/lib/session"

export const dynamic = "force-dynamic"

type RouteContext = {
  params: Promise<{
    orderCode: string
  }>
}

export async function GET(_request: Request, context: RouteContext) {
  const userId = await getSessionUserId()
  if (userId == null) {
    return NextResponse.json(
      { message: "Ban can dang nhap de kiem tra thanh toan." },
      { status: 401 }
    )
  }

  const { orderCode: rawOrderCode } = await context.params
  const orderCode = Number(rawOrderCode)
  if (!Number.isSafeInteger(orderCode)) {
    return NextResponse.json(
      { message: "Ma don hang khong hop le." },
      { status: 400 }
    )
  }

  const result = await syncPayOSTransaction(orderCode, userId)
  if (!result.ok) {
    return NextResponse.json(
      { message: result.message },
      { status: result.status }
    )
  }

  return NextResponse.json({
    orderCode: result.transaction.orderCode,
    status: result.transaction.status,
    amount: result.transaction.amount,
    planKey: result.transaction.planKey,
  })
}
