import { NextResponse } from "next/server"
import { db } from "@/drizzle/db"
import { UserTable } from "@/drizzle/schema"
import { eq } from "drizzle-orm"
import { randomInt } from "crypto"
import nodemailer from "nodemailer"
import { env } from "@/data/env/server"
import { storeOtp } from "@/services/auth/lib/otp-storage"

export async function POST(request: Request) {
  try {
    const { email } = await request.json()

    if (!email) {
      return NextResponse.json(
        { message: "Email không được để trống" },
        { status: 400 }
      )
    }

    // Kiểm tra user có tồn tại không
    const user = await db.query.UserTable.findFirst({
      where: eq(UserTable.email, email),
    })

    if (!user) {
      // Không tiết lộ nếu email tồn tại hay không (bảo mật)
      return NextResponse.json({
        ok: true,
        email,
        message: "Nếu email tồn tại, mã OTP sẽ được gửi",
      })
    }

    // Tạo OTP code
    const otp = randomInt(100000, 1000000).toString()

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

    // Lưu OTP
    storeOtp(email, otp)

    await transporter.sendMail({
      from,
      to: email,
      subject: "Mã OTP reset mật khẩu",
      text: `Mã OTP để reset mật khẩu của bạn là ${otp}. Mã có hiệu lực trong 10 phút.`,
      html: `<p>Mã OTP để reset mật khẩu của bạn là <strong>${otp}</strong>.</p><p>Mã có hiệu lực trong 10 phút.</p>`,
    })

    return NextResponse.json({
      ok: true,
      email,
      otp, // Chỉ để test, bỏ đi ở production
    })
  } catch (error) {
    console.error("Request password reset OTP error:", error)
    return NextResponse.json(
      { message: "Lỗi khi gửi OTP" },
      { status: 500 }
    )
  }
}
