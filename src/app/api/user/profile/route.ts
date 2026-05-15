import { NextResponse } from "next/server"
import { db } from "@/drizzle/db"
import { UserTable } from "@/drizzle/schema"
import { eq } from "drizzle-orm"
import { getSessionUserId } from "@/services/auth/lib/session"
import { revalidateUserCache } from "@/features/users/dbCache"

export async function PUT(request: Request) {
  try {
    const userId = await getSessionUserId()

    if (!userId) {
      return NextResponse.json(
        { message: "Không xác thực được người dùng" },
        { status: 401 }
      )
    }

    const { name, email, imageUrl } = await request.json()

    if (!name || !email) {
      return NextResponse.json(
        { message: "Tên và email không được để trống" },
        { status: 400 }
      )
    }

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

    const nextImageUrl =
      typeof imageUrl === "string" ? imageUrl.trim() : undefined

    if (nextImageUrl != null && nextImageUrl !== "") {
      try {
        new URL(nextImageUrl)
      } catch {
        return NextResponse.json(
          { message: "Avatar URL không hợp lệ" },
          { status: 400 }
        )
      }
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
      .set({
        name,
        email,
        ...(nextImageUrl != null ? { imageUrl: nextImageUrl } : {}),
      })
      .where(eq(UserTable.id, userId))

    revalidateUserCache(userId)

    const updatedUser = await db.query.UserTable.findFirst({
      where: eq(UserTable.id, userId),
      columns: {
        name: true,
        email: true,
        imageUrl: true,
      },
    })

    return NextResponse.json({ ok: true, user: updatedUser })
  } catch (error) {
    console.error("Update profile error:", error)
    return NextResponse.json(
      { message: "Lỗi khi cập nhật hồ sơ" },
      { status: 500 }
    )
  }
}
