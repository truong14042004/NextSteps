import "server-only"

import nodemailer from "nodemailer"

import { env } from "@/data/env/server"

let cachedTransporter: nodemailer.Transporter | null = null

function getTransporter() {
  if (cachedTransporter != null) return cachedTransporter

  cachedTransporter = nodemailer.createTransport({
    host: env.SMTP_HOST,
    port: env.SMTP_PORT,
    secure: env.SMTP_PORT === 465,
    auth: {
      user: env.SMTP_USER,
      pass: env.SMTP_PASS,
    },
  })

  return cachedTransporter
}

// Kiểm tra cấu hình SMTP đã được set thật chưa (tránh gửi bằng giá trị placeholder).
export function isEmailConfigured() {
  return (
    env.SMTP_USER !== "placeholder@example.com" &&
    env.SMTP_PASS !== "placeholder"
  )
}

export async function sendEmail({
  to,
  subject,
  text,
  html,
}: {
  to: string
  subject: string
  text: string
  html?: string
}) {
  if (!isEmailConfigured()) {
    // Không cấu hình SMTP thì bỏ qua (môi trường dev) thay vì ném lỗi.
    return { sent: false as const, reason: "SMTP chưa được cấu hình" }
  }

  const from =
    env.SMTP_FROM_NAME.trim().length > 0
      ? `${env.SMTP_FROM_NAME} <${env.SMTP_FROM}>`
      : env.SMTP_FROM

  await getTransporter().sendMail({
    from,
    to,
    subject,
    text,
    html: html ?? text,
  })

  return { sent: true as const }
}
