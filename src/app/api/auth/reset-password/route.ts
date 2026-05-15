import { resetPasswordWithOtp } from "@/services/auth/lib/otp"
import { NextResponse } from "next/server"
import z from "zod"

const schema = z.object({
  email: z.string().trim().email().max(254),
  otp: z.string().trim().regex(/^\d{6}$/),
  newPassword: z.string().min(8).max(200),
})

export async function POST(request: Request) {
  const json = await request.json().catch(() => null)
  const parsed = schema.safeParse(json)

  if (!parsed.success) {
    return NextResponse.json(
      { message: "Dữ liệu không hợp lệ." },
      { status: 400 }
    )
  }

  try {
    const result = await resetPasswordWithOtp({
      email: parsed.data.email,
      code: parsed.data.otp,
      newPassword: parsed.data.newPassword,
    })

    if (!result.ok) {
      return NextResponse.json({ message: result.message }, { status: result.status })
    }

    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json(
      { message: "Lỗi khi đặt lại mật khẩu." },
      { status: 500 }
    )
  }
}
