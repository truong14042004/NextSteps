import { NextResponse } from "next/server"
import { db } from "@/drizzle/db"
import { AuthCredentialTable, UserTable } from "@/drizzle/schema"
import { eq } from "drizzle-orm"
import { getSessionUserId } from "@/services/auth/lib/session"
import { verifyPassword, hashPassword } from "@/services/auth/lib/password"

export async function POST(request: Request) {
  try {
    const userId = await getSessionUserId()

    if (!userId) {
      return NextResponse.json(
        { message: "Không xác thực được người dùng" },
        { status: 401 }
      )
    }

    const { currentPassword, newPassword } = await request.json()

    if (!currentPassword || !newPassword) {
      return NextResponse.json(
        { message: "Mật khẩu không được để trống" },
        { status: 400 }
      )
    }

    // Lấy credential của user
    const credential = await db.query.AuthCredentialTable.findFirst({
      where: eq(AuthCredentialTable.userId, userId),
    })

    if (!credential) {
      return NextResponse.json(
        { message: "Không tìm thấy tài khoản" },
        { status: 404 }
      )
    }

    // Verify mật khẩu hiện tại
    const isPasswordValid = await verifyPassword({
      password: currentPassword,
      passwordHash: credential.passwordHash,
    })

    if (!isPasswordValid) {
      return NextResponse.json(
        { message: "Mật khẩu hiện tại không đúng" },
        { status: 401 }
      )
    }

    // Hash mật khẩu mới
    const newPasswordHash = await hashPassword(newPassword.trim())

    // Cập nhật mật khẩu
    await db
      .update(AuthCredentialTable)
      .set({ passwordHash: newPasswordHash })
      .where(eq(AuthCredentialTable.userId, userId))

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error("Change password error:", error)
    return NextResponse.json(
      { message: "Lỗi khi thay đổi mật khẩu" },
      { status: 500 }
    )
  }
}
