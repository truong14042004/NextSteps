import { NextResponse } from "next/server"

import { verifyPayOSWebhook } from "@/features/payments/payos"

export const dynamic = "force-dynamic"

export async function POST(request: Request) {
  const payload = await request.json().catch(() => null)

  if (payload == null) {
    return NextResponse.json({ message: "Invalid webhook payload" }, { status: 400 })
  }

  try {
    await verifyPayOSWebhook(payload)
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ message: "Invalid payOS webhook" }, { status: 400 })
  }
}
