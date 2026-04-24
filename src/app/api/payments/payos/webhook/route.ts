import { NextResponse } from "next/server"

import { verifyPayOSWebhook } from "@/features/payments/payos"

export const dynamic = "force-dynamic"

export function GET() {
  return NextResponse.json({ ok: true })
}

export function HEAD() {
  return new Response(null, { status: 204 })
}

export function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: { Allow: "GET, HEAD, POST, OPTIONS" },
  })
}

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
