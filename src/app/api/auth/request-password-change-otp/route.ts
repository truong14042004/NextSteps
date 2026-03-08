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

    const { currentPassword } = await request.json()

    if (!currentPassword) {
      return NextResponse.json(
        { message: "Mật khẩu không được để trống" },
        { status: 400 }
      )
    }

    // Lấy thông tin user
    const user = await db.query.UserTable.findFirst({
      where: eq(UserTable.id, userId),
    })

    if (!user) {
      return NextResponse.json(
        { message: "Không tìm thấy người dùng" },
        { status: 404 }
      )
    }

    // Lấy credential
    const credential = await db.query.AuthCredentialTable.findFirst({
      where: eq(AuthCredentialTable.userId, userId),
    })

    if (!credential) {
      return NextResponse.json(
        { message: "Không tìm thấy thông tin đăng nhập" },
        { status: 404 }
      )
    }

    // Kiểm tra mật khẩu hiện tại
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

    // Tạo OTP
    const otp = randomInt(100000, 1000000).toString()

    // Lưu OTP
    storeOtp(user.email, otp)

    console.log("OTP saved:", otp)

    // Tạo transporter gửi mail
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

    // Gửi email
    await transporter.sendMail({
      from,
      to: user.email,
      subject: "Mã xác thực thay đổi mật khẩu",
      text: `Mã OTP của bạn là ${otp}. Mã có hiệu lực trong 10 phút.`,
      html: `<p>Mã OTP của bạn là <strong>${otp}</strong>.</p><p>Mã có hiệu lực trong 10 phút.</p>`,
    })

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error("Request password change OTP error:", error)

    return NextResponse.json(
      { message: "Lỗi khi gửi OTP" },
      { status: 500 }
    )
  }
}