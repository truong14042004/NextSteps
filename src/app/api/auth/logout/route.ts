import { clearSession } from "@/services/auth/lib/session"
import { NextResponse } from "next/server"

export async function POST() {
  await clearSession()
  return NextResponse.json({ ok: true })
}
