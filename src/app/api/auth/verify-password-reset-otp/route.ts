import { NextResponse } from "next/server"
import { isOtpValid } from "@/services/auth/lib/otp-storage"

export async function POST(request: Request) {
  try {
    const { email, otp } = await request.json()

    if (!email || !otp) {
      return NextResponse.json(
        { message: "Dữ liệu không hợp lệ" },
        { status: 400 }
      )
    }

    // Verify OTP
    if (!isOtpValid(email, otp)) {
      return NextResponse.json(
        { message: "OTP không đúng hoặc đã hết hạn" },
        { status: 400 }
      )
    }

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error("Verify password reset OTP error:", error)
    return NextResponse.json(
      { message: "Lỗi khi xác nhận OTP" },
      { status: 500 }
    )
  }
}
