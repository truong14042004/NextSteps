import { NextResponse } from "next/server"
import { db } from "@/drizzle/db"
import { AuthCredentialTable } from "@/drizzle/schema"
import { eq } from "drizzle-orm"
import { getSessionUserId } from "@/services/auth/lib/session"
import { hashPassword } from "@/services/auth/lib/password"
import { UserTable } from "@/drizzle/schema"
import { isOtpValid, deleteOtp } from "@/services/auth/lib/otp-storage"
import { getStoredOtp } from "@/services/auth/lib/otp-storage"

export async function POST(request: Request) {
  try {
    const userId = await getSessionUserId()

    if (!userId) {
      return NextResponse.json(
        { message: "Không xác thực được người dùng" },
        { status: 401 }
      )
    }

    const { otp, newPassword } = await request.json()

    const user = await db.query.UserTable.findFirst({
      where: eq(UserTable.id, userId),
    })

    if (!user) {
      return NextResponse.json(
        { message: "Người dùng không tồn tại" },
        { status: 404 }
      )
    }

    console.log("OTP user nhập:", otp)
    console.log("OTP trong storage:", getStoredOtp(user.email))

    if (!isOtpValid(user.email, otp)) {
      return NextResponse.json(
        { message: "OTP không đúng hoặc đã hết hạn" },
        { status: 400 }
      )
    }

    // Hash mật khẩu mới
    const newPasswordHash = await hashPassword(newPassword.trim())

    // Cập nhật mật khẩu
    const result = await db
      .update(AuthCredentialTable)
      .set({ passwordHash: newPasswordHash })
      .where(eq(AuthCredentialTable.userId, userId))
    
    console.log("Kết quả cập nhật mật khẩu:", result)

    deleteOtp(user.email)

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error("Verify password change OTP error:", error)
    return NextResponse.json(
      { message: "Lỗi khi xác nhận OTP" },
      { status: 500 }
    )
  }
}
