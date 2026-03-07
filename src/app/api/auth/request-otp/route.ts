import { otpPurposeEnum } from "@/drizzle/schema"
import { requestOtp } from "@/services/auth/lib/otp"
import { NextResponse } from "next/server"
import z from "zod"

const schema = z.object({
  email: z.string().trim().email().max(254),
  firstName: z.string().trim().min(1).max(80).optional(),
  lastName: z.string().trim().min(1).max(80).optional(),
  username: z.string().trim().min(4).max(32).optional(),
  password: z.string().min(8).max(200).optional(),
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
    const result = await requestOtp(parsed.data)
    if (!result.ok) {
      return NextResponse.json({ message: result.message }, { status: result.status })
    }

    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json(
      { message: "Không gửi được OTP. Vui lòng kiểm tra cấu hình SMTP." },
      { status: 500 }
    )
  }
}
