import { otpPurposeEnum } from "@/drizzle/schema"
import { requestOtp } from "@/services/auth/lib/otp"
import { logAuthError } from "@/services/auth/lib/logger"
import { NextResponse } from "next/server"
import z from "zod"

const STRONG_PASSWORD =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).{8,200}$/

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

  // Server-side strength check (mirrors the client rule) — protects against
  // direct API calls that skip the UI validator.
  if (
    parsed.data.purpose === "sign_up" &&
    parsed.data.password != null &&
    !STRONG_PASSWORD.test(parsed.data.password)
  ) {
    return NextResponse.json(
      {
        message:
          "Mật khẩu phải có ít nhất 8 ký tự gồm chữ hoa, chữ thường, số và ký tự đặc biệt.",
      },
      { status: 400 }
    )
  }

  try {
    const result = await requestOtp(parsed.data)
    if (!result.ok) {
      return NextResponse.json({ message: result.message }, { status: result.status })
    }

    return NextResponse.json({ ok: true })
  } catch (error) {
    logAuthError("otp_request_failed", {
      purpose: parsed.data.purpose,
      message: error instanceof Error ? error.message : String(error),
    })
    return NextResponse.json(
      {
        message:
          "Không gửi được OTP. Vui lòng thử lại sau ít phút hoặc liên hệ hỗ trợ.",
      },
      { status: 500 }
    )
  }
}
