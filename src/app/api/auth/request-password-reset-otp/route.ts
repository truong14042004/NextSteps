import { requestPasswordResetOtp } from "@/services/auth/lib/otp"
import { NextResponse } from "next/server"
import z from "zod"

const schema = z.object({
  email: z.string().trim().email().max(254),
})

export async function POST(request: Request) {
  const json = await request.json().catch(() => null)
  const parsed = schema.safeParse(json)

  if (!parsed.success) {
    return NextResponse.json(
      { message: "Email không hợp lệ." },
      { status: 400 }
    )
  }

  try {
    const result = await requestPasswordResetOtp(parsed.data)
    if (!result.ok) {
      return NextResponse.json({ message: result.message }, { status: result.status })
    }

    return NextResponse.json({
      ok: true,
      message: "Nếu email tồn tại, mã OTP sẽ được gửi.",
    })
  } catch {
    return NextResponse.json(
      { message: "Không gửi được OTP. Vui lòng thử lại sau." },
      { status: 500 }
    )
  }
}
