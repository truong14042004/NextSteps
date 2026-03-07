import { otpPurposeEnum } from "@/drizzle/schema"
import { verifyOtp } from "@/services/auth/lib/otp"
import { NextResponse } from "next/server"
import z from "zod"

const schema = z.object({
  email: z.string().trim().email().max(254),
  code: z.string().trim().regex(/^\d{6}$/),
  purpose: z.enum(otpPurposeEnum.enumValues),
})

export async function POST(request: Request) {
  const json = await request.json().catch(() => null)
  const parsed = schema.safeParse(json)

  if (!parsed.success) {
    return NextResponse.json(
      { message: "Dữ liệu gửi lên không hợp lệ." },
      { status: 400 }
    )
  }

  try {
    const result = await verifyOtp(parsed.data)
    if (!result.ok) {
      return NextResponse.json({ message: result.message }, { status: result.status })
    }

    return NextResponse.json({ ok: true, isNewUser: result.isNewUser })
  } catch {
    return NextResponse.json(
      { message: "Xác thực OTP thất bại. Vui lòng thử lại." },
      { status: 500 }
    )
  }
}
