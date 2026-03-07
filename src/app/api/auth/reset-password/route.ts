import { NextResponse } from "next/server"
import { db } from "@/drizzle/db"
import { UserTable, AuthCredentialTable } from "@/drizzle/schema"
import { eq } from "drizzle-orm"
import { isOtpValid, deleteOtp } from "@/services/auth/lib/otp-storage"
import { hashPassword } from "@/services/auth/lib/password"

export async function POST(request: Request) {
  try {
    const { email, otp, newPassword } = await request.json()

    if (!email || !otp || !newPassword) {
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

    // tìm user
    const user = await db.query.UserTable.findFirst({
      where: eq(UserTable.email, email),
    })

    if (!user) {
      return NextResponse.json(
        { message: "Không tìm thấy người dùng" },
        { status: 404 }
      )
    }

    const newPasswordHash = await hashPassword(newPassword)

    // update credential table
    await db
      .update(AuthCredentialTable)
      .set({ passwordHash: newPasswordHash })
      .where(eq(AuthCredentialTable.userId, user.id))

    // xóa OTP
    deleteOtp(email)

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error("Reset password error:", error)

    return NextResponse.json(
      { message: "Lỗi khi reset mật khẩu" },
      { status: 500 }
    )
  }
}