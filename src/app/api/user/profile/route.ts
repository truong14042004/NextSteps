import { NextResponse } from "next/server"
import { db } from "@/drizzle/db"
import { UserTable } from "@/drizzle/schema"
import { eq } from "drizzle-orm"
import { getSessionUserId } from "@/services/auth/lib/session"
import { revalidateTag } from "next/cache"
import { getUserIdTag } from "@/features/users/dbCache"

export async function PUT(request: Request) {
  try {
    const userId = await getSessionUserId()

    if (!userId) {
      return NextResponse.json(
        { message: "Không xác thực được người dùng" },
        { status: 401 }
      )
    }

    const { name, email } = await request.json()

    if (!name || !email) {
      return NextResponse.json(
        { message: "Tên và email không được để trống" },
        { status: 400 }
      )
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { message: "Email không hợp lệ" },
        { status: 400 }
      )
    }

    if (name.trim().length === 0) {
      return NextResponse.json(
        { message: "Tên không được để trống" },
        { status: 400 }
      )
    }

    const existingUser = await db.query.UserTable.findFirst({
      where: eq(UserTable.email, email),
    })

    if (existingUser && existingUser.id !== userId) {
      return NextResponse.json(
        { message: "Email này đã được sử dụng" },
        { status: 409 }
      )
    }

    await db
      .update(UserTable)
      .set({ name, email })
      .where(eq(UserTable.id, userId))

    // Invalidate cache để dashboard load lại dữ liệu mới
    revalidateTag(getUserIdTag(userId), "default")

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error("Update profile error:", error)
    return NextResponse.json(
      { message: "Lỗi khi cập nhật hồ sơ" },
      { status: 500 }
    )
  }
}
