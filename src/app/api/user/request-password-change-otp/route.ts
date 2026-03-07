import { NextResponse } from "next/server"
import { db } from "@/drizzle/db"
import { AuthCredentialTable, UserTable } from "@/drizzle/schema"
import { eq } from "drizzle-orm"
import { getSessionUserId } from "@/services/auth/lib/session"
import { verifyPassword } from "@/services/auth/lib/password"
import { randomInt } from "crypto"
import nodemailer from "nodemailer"
import { env } from "@/data/env/server"
import { storeOtp } from "@/services/auth/lib/otp-storage"

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

    // Lấy user info
    const user = await db.query.UserTable.findFirst({
      where: eq(UserTable.id, userId),
    })

    if (!user) {
      return NextResponse.json(
        { message: "Không tìm thấy tài khoản" },
        { status: 404 }
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

    // Tạo OTP code
    const otp = randomInt(100000, 1000000).toString()

    storeOtp(user.email, otp)

    // Gửi email với OTP
    const transporter = nodemailer.createTransport({
      host: env.SMTP_HOST,
      port: env.SMTP_PORT,
      secure: env.SMTP_PORT === 465,
      auth: {
        user: env.SMTP_USER,
        pass: env.SMTP_PASS,
      },
    })

    const from =
      env.SMTP_FROM_NAME.trim().length > 0
        ? `${env.SMTP_FROM_NAME} <${env.SMTP_FROM}>`
        : env.SMTP_FROM

    await transporter.sendMail({
      from,
      to: user.email,
      subject: "Mã xác thực thay đổi mật khẩu",
      text: `Mã xác thực để thay đổi mật khẩu của bạn là ${otp}. Mã có hiệu lực trong 10 phút.`,
      html: `<p>Mã xác thực để thay đổi mật khẩu của bạn là <strong>${otp}</strong>.</p><p>Mã có hiệu lực trong 10 phút.</p>`,
    })

    // Lưu OTP vào session/cache tạm thời (có thể dùng Redis hoặc session)
    // Để đơn giản, ta lưu vào response và client gửi lại khi verify
    // Hoặc tạo 1 temporary record trong DB

    return NextResponse.json({
      ok: true,
      email: user.email,
      otp, // Chỉ để test, bỏ đi ở production
    })
  } catch (error) {
    console.error("Request password change OTP error:", error)
    return NextResponse.json(
      { message: "Lỗi khi gửi OTP" },
      { status: 500 }
    )
  }
}
