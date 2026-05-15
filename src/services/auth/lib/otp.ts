import "server-only"

import { db } from "@/drizzle/db"
import {
  AuthCredentialTable,
  AuthOtpTable,
  OtpPurpose,
  UserTable,
} from "@/drizzle/schema"
import { env } from "@/data/env/server"
import { and, desc, eq, gt, isNull, ne } from "drizzle-orm"
import { createHash, randomInt, randomUUID } from "node:crypto"
import nodemailer from "nodemailer"
import { logAuthError, logAuthInfo, logAuthWarn } from "./logger"
import { hashPassword } from "./password"
import { createSession } from "./session"

const OTP_EXPIRY_MINUTES = env.OTP_CODE_EXPIRY_MINUTES
const OTP_RESEND_SECONDS = 60
const OTP_MAX_ATTEMPTS = 5
const PASSWORD_MIN_LENGTH = 8
const USERNAME_REGEX = /^[a-z0-9._-]{4,32}$/

type OtpServiceResult =
  | { ok: true }
  | { ok: false; status: number; message: string }

type OtpVerificationResult =
  | { ok: true; isNewUser: boolean }
  | { ok: false; status: number; message: string }

type AuthOtpRow = typeof AuthOtpTable.$inferSelect

function normalizeEmail(email: string) {
  return email.trim().toLowerCase()
}

function normalizeUsername(username: string) {
  return username.trim().toLowerCase()
}

function buildFullName(firstName: string, lastName: string) {
  return `${firstName.trim()} ${lastName.trim()}`.trim()
}

function normalizeUsernameSeed(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\u0111/g, "d")
    .replace(/\u0110/g, "d")
    .toLowerCase()
    .replace(/[^a-z0-9._-]/g, "")
    .replace(/[._-]{2,}/g, "-")
    .replace(/^[._-]+|[._-]+$/g, "")
    .slice(0, 32)
}

function buildSignupUsername(email: string, firstName: string, lastName: string) {
  const localPart = email.split("@")[0] ?? ""
  let username = normalizeUsernameSeed(localPart)

  if (username.length < 4) {
    username = normalizeUsernameSeed(`${firstName}${lastName}`)
  }

  if (username.length < 4) {
    username = `user${randomInt(1000, 10000)}`
  }

  return username.slice(0, 32)
}

function hashOtpCode(email: string, code: string) {
  return createHash("sha256")
    .update(`${normalizeEmail(email)}:${code}:${env.AUTH_OTP_SECRET}`)
    .digest("hex")
}

function buildOtpEmailBody(code: string) {
  return {
    subject: "Mã xác thực NextSteps",
    text: `Mã xác thực của bạn là ${code}. Mã có hiệu lực trong ${OTP_EXPIRY_MINUTES} phút.`,
    html: `<p>Mã xác thực của bạn là <strong>${code}</strong>.</p><p>Mã có hiệu lực trong ${OTP_EXPIRY_MINUTES} phút.</p>`,
  }
}

async function sendOtpEmail(to: string, code: string) {
  const transporter = nodemailer.createTransport({
    host: env.SMTP_HOST,
    port: env.SMTP_PORT,
    secure: env.SMTP_PORT === 465,
    auth: {
      user: env.SMTP_USER,
      pass: env.SMTP_PASS,
    },
  })

  const body = buildOtpEmailBody(code)
  const from =
    env.SMTP_FROM_NAME.trim().length > 0
      ? `${env.SMTP_FROM_NAME} <${env.SMTP_FROM}>`
      : env.SMTP_FROM

  await transporter.sendMail({
    from,
    to,
    subject: body.subject,
    text: body.text,
    html: body.html,
  })
}

async function getLatestUsableOtp(email: string, purpose: OtpPurpose) {
  return db.query.AuthOtpTable.findFirst({
    where: and(
      eq(AuthOtpTable.email, normalizeEmail(email)),
      eq(AuthOtpTable.purpose, purpose),
      isNull(AuthOtpTable.consumedAt)
    ),
    orderBy: [desc(AuthOtpTable.createdAt)],
  })
}

async function verifyOtpCode({
  email,
  code,
  purpose,
}: {
  email: string
  code: string
  purpose: OtpPurpose
}): Promise<
  | { ok: true; otpRow: AuthOtpRow }
  | { ok: false; status: number; message: string }
> {
  const normalizedEmail = normalizeEmail(email)
  const safeEmail = normalizedEmail.replace(/(.{2}).+(@.+)/, "$1***$2")
  const otpRow = await getLatestUsableOtp(normalizedEmail, purpose)

  if (otpRow == null || otpRow.expiresAt <= new Date()) {
    return {
      ok: false,
      status: 400,
      message: "Mã OTP không hợp lệ hoặc đã hết hạn.",
    }
  }

  if (otpRow.attempts >= OTP_MAX_ATTEMPTS) {
    return {
      ok: false,
      status: 429,
      message: "Bạn đã nhập sai quá nhiều lần. Vui lòng yêu cầu mã mới.",
    }
  }

  const inputHash = hashOtpCode(normalizedEmail, code)
  if (inputHash !== otpRow.codeHash) {
    await db
      .update(AuthOtpTable)
      .set({ attempts: otpRow.attempts + 1 })
      .where(eq(AuthOtpTable.id, otpRow.id))

    logAuthWarn("otp_verify_invalid_code", {
      purpose,
      email: safeEmail,
      attempts: otpRow.attempts + 1,
    })

    return {
      ok: false,
      status: 400,
      message: "Mã OTP không hợp lệ hoặc đã hết hạn.",
    }
  }

  return { ok: true, otpRow }
}

export async function requestPasswordResetOtp({
  email,
}: {
  email: string
}): Promise<OtpServiceResult> {
  const normalizedEmail = normalizeEmail(email)
  const safeEmail = normalizedEmail.replace(/(.{2}).+(@.+)/, "$1***$2")
  const now = new Date()
  const user = await db.query.UserTable.findFirst({
    where: and(eq(UserTable.email, normalizedEmail), ne(UserTable.status, "deleted")),
    columns: { id: true },
  })

  if (user == null) {
    logAuthInfo("password_reset_request_ignored", { email: safeEmail })
    return { ok: true }
  }

  const recentOtp = await db.query.AuthOtpTable.findFirst({
    where: and(
      eq(AuthOtpTable.email, normalizedEmail),
      eq(AuthOtpTable.purpose, "password_reset"),
      gt(AuthOtpTable.createdAt, new Date(now.getTime() - OTP_RESEND_SECONDS * 1000))
    ),
    orderBy: [desc(AuthOtpTable.createdAt)],
  })

  if (recentOtp != null) {
    return {
      ok: false,
      status: 429,
      message: "Bạn đã yêu cầu quá nhanh. Vui lòng đợi 60 giây rồi thử lại.",
    }
  }

  const code = randomInt(100000, 1000000).toString()
  await db.insert(AuthOtpTable).values({
    email: normalizedEmail,
    purpose: "password_reset",
    codeHash: hashOtpCode(normalizedEmail, code),
    expiresAt: new Date(now.getTime() + OTP_EXPIRY_MINUTES * 60 * 1000),
  })

  await sendOtpEmail(normalizedEmail, code)
  logAuthInfo("password_reset_otp_sent", { email: safeEmail, userId: user.id })
  return { ok: true }
}

export async function verifyPasswordResetOtp({
  email,
  code,
}: {
  email: string
  code: string
}): Promise<OtpServiceResult> {
  const user = await db.query.UserTable.findFirst({
    where: and(eq(UserTable.email, normalizeEmail(email)), ne(UserTable.status, "deleted")),
    columns: { id: true },
  })

  if (user == null) {
    return { ok: false, status: 400, message: "Mã OTP không hợp lệ hoặc đã hết hạn." }
  }

  const result = await verifyOtpCode({ email, code, purpose: "password_reset" })
  return result.ok ? { ok: true } : result
}

export async function resetPasswordWithOtp({
  email,
  code,
  newPassword,
}: {
  email: string
  code: string
  newPassword: string
}): Promise<OtpServiceResult> {
  const normalizedEmail = normalizeEmail(email)
  const password = newPassword.trim()

  if (password.length < PASSWORD_MIN_LENGTH) {
    return {
      ok: false,
      status: 400,
      message: `Mật khẩu phải có ít nhất ${PASSWORD_MIN_LENGTH} ký tự.`,
    }
  }

  const result = await verifyOtpCode({
    email: normalizedEmail,
    code,
    purpose: "password_reset",
  })
  if (!result.ok) return result

  const user = await db.query.UserTable.findFirst({
    where: and(eq(UserTable.email, normalizedEmail), ne(UserTable.status, "deleted")),
    columns: { id: true },
  })

  if (user == null) {
    return { ok: false, status: 400, message: "Mã OTP không hợp lệ hoặc đã hết hạn." }
  }

  const passwordHash = await hashPassword(password)
  await db.transaction(async tx => {
    await tx
      .insert(AuthCredentialTable)
      .values({
        userId: user.id,
        username: normalizedEmail,
        passwordHash,
      })
      .onConflictDoUpdate({
        target: [AuthCredentialTable.userId],
        set: {
          username: normalizedEmail,
          passwordHash,
          updatedAt: new Date(),
        },
      })

    await tx
      .update(AuthOtpTable)
      .set({ consumedAt: new Date() })
      .where(eq(AuthOtpTable.id, result.otpRow.id))
  })

  logAuthInfo("password_reset_success", {
    email: normalizedEmail.replace(/(.{2}).+(@.+)/, "$1***$2"),
    userId: user.id,
  })
  return { ok: true }
}

function isDuplicateConstraint(
  error: unknown,
  constraintNames: readonly string[]
) {
  if (typeof error !== "object" || error == null) return false

  const source =
    "cause" in error && typeof error.cause === "object" && error.cause != null
      ? error.cause
      : error

  if (typeof source !== "object" || source == null) return false
  if (!("code" in source) || source.code !== "23505") return false
  if (!("constraint" in source) || typeof source.constraint !== "string") {
    return false
  }

  return constraintNames.includes(source.constraint)
}

export async function requestOtp({
  email,
  purpose,
  firstName,
  lastName,
  password,
}: {
  email: string
  purpose: OtpPurpose
  firstName?: string
  lastName?: string
  password?: string
}): Promise<OtpServiceResult> {
  const normalizedEmail = normalizeEmail(email)
  if (purpose === "password_reset") {
    return requestPasswordResetOtp({ email: normalizedEmail })
  }

  const safeEmail = normalizedEmail.replace(/(.{2}).+(@.+)/, "$1***$2")
  const now = new Date()
  const resendCutoff = new Date(now.getTime() - OTP_RESEND_SECONDS * 1000)

  let signUpFirstName: string | null = null
  let signUpLastName: string | null = null
  let signUpUsername: string | null = null
  let signUpPasswordHash: string | null = null

  if (purpose === "sign_up") {
    signUpFirstName = firstName?.trim() ?? ""
    signUpLastName = lastName?.trim() ?? ""
    const rawPassword = password?.trim() ?? ""

    if (
      signUpFirstName.length === 0 ||
      signUpLastName.length === 0 ||
      rawPassword.length === 0
    ) {
      return {
        ok: false,
        status: 400,
        message:
          "Vui lòng nhập đầy đủ tên, họ và mật khẩu để đăng ký.",
      }
    }

    signUpUsername = buildSignupUsername(
      normalizedEmail,
      signUpFirstName,
      signUpLastName
    )

    if (!USERNAME_REGEX.test(signUpUsername)) {
      return {
        ok: false,
        status: 400,
        message:
          "Không thể tạo tên đăng nhập. Vui lòng sử dụng email khác.",
      }
    }

    if (rawPassword.length < PASSWORD_MIN_LENGTH) {
      return {
        ok: false,
        status: 400,
        message: `Mật khẩu phải có ít nhất ${PASSWORD_MIN_LENGTH} ký tự.`,
      }
    }

    const existingUser = await db.query.UserTable.findFirst({
      where: eq(UserTable.email, normalizedEmail),
      columns: { id: true, status: true },
    })
    if (existingUser != null && existingUser.status !== "deleted") {
      return {
        ok: false,
        status: 409,
        message: "Email này đã được đăng ký.",
      }
    }

    const existingCredential = await db.query.AuthCredentialTable.findFirst({
      where: eq(AuthCredentialTable.username, signUpUsername),
      columns: { userId: true },
    })
    if (
      existingCredential != null &&
      existingCredential.userId !== existingUser?.id
    ) {
      return {
        ok: false,
        status: 409,
        message: "Tên đăng nhập đã tồn tại.",
      }
    }

    signUpPasswordHash = await hashPassword(rawPassword)
  }

  const recentOtp = await db.query.AuthOtpTable.findFirst({
    where: and(
      eq(AuthOtpTable.email, normalizedEmail),
      eq(AuthOtpTable.purpose, purpose),
      gt(AuthOtpTable.createdAt, resendCutoff)
    ),
    orderBy: [desc(AuthOtpTable.createdAt)],
  })

  if (recentOtp != null) {
    logAuthWarn("otp_request_rate_limited", {
      purpose,
      email: safeEmail,
    })
    return {
      ok: false,
      status: 429,
      message: "Bạn đã yêu cầu quá nhanh. Vui lòng đợi 60 giây rồi thử lại.",
    }
  }

  const code = randomInt(100000, 1000000).toString()
  const codeHash = hashOtpCode(normalizedEmail, code)
  const expiresAt = new Date(now.getTime() + OTP_EXPIRY_MINUTES * 60 * 1000)

  await db.insert(AuthOtpTable).values({
    email: normalizedEmail,
    purpose,
    name:
      purpose === "sign_up" && signUpFirstName != null && signUpLastName != null
        ? buildFullName(signUpFirstName, signUpLastName)
        : null,
    firstName: signUpFirstName,
    lastName: signUpLastName,
    username: signUpUsername,
    passwordHash: signUpPasswordHash,
    codeHash,
    expiresAt,
  })

  await sendOtpEmail(normalizedEmail, code)

  logAuthInfo("otp_request_sent", {
    purpose,
    email: safeEmail,
  })

  return { ok: true }
}

export async function verifyOtp({
  email,
  code,
  purpose,
}: {
  email: string
  code: string
  purpose: OtpPurpose
}): Promise<OtpVerificationResult> {
  const normalizedEmail = normalizeEmail(email)
  if (purpose === "password_reset") {
    const result = await verifyPasswordResetOtp({ email: normalizedEmail, code })
    return result.ok ? { ok: true, isNewUser: false } : result
  }

  const safeEmail = normalizedEmail.replace(/(.{2}).+(@.+)/, "$1***$2")
  const otpRow = await db.query.AuthOtpTable.findFirst({
    where: and(
      eq(AuthOtpTable.email, normalizedEmail),
      eq(AuthOtpTable.purpose, purpose),
      isNull(AuthOtpTable.consumedAt)
    ),
    orderBy: [desc(AuthOtpTable.createdAt)],
  })

  if (otpRow == null) {
    return {
      ok: false,
      status: 400,
      message: "Mã OTP không hợp lệ hoặc đã hết hạn.",
    }
  }

  if (otpRow.expiresAt <= new Date()) {
    return {
      ok: false,
      status: 400,
      message: "Mã OTP không hợp lệ hoặc đã hết hạn.",
    }
  }

  if (otpRow.attempts >= OTP_MAX_ATTEMPTS) {
    return {
      ok: false,
      status: 429,
      message: "Bạn đã nhập sai quá nhiều lần. Vui lòng yêu cầu mã mới.",
    }
  }

  const inputHash = hashOtpCode(normalizedEmail, code)
  if (inputHash !== otpRow.codeHash) {
    await db
      .update(AuthOtpTable)
      .set({ attempts: otpRow.attempts + 1 })
      .where(eq(AuthOtpTable.id, otpRow.id))

    logAuthWarn("otp_verify_invalid_code", {
      purpose,
      email: safeEmail,
      attempts: otpRow.attempts + 1,
    })

    return {
      ok: false,
      status: 400,
      message: "Mã OTP không hợp lệ hoặc đã hết hạn.",
    }
  }

  if (purpose === "sign_up") {
    if (
      otpRow.firstName == null ||
      otpRow.lastName == null ||
      otpRow.username == null ||
      otpRow.passwordHash == null
    ) {
      logAuthError("otp_verify_signup_data_missing", {
        email: safeEmail,
      })
      return {
        ok: false,
        status: 400,
        message: "Dữ liệu đăng ký không hợp lệ. Vui lòng đăng ký lại.",
      }
    }

    const existingDeletedUser = await db.query.UserTable.findFirst({
      where: eq(UserTable.email, normalizedEmail),
      columns: { id: true, status: true },
    })
    const userId =
      existingDeletedUser?.status === "deleted"
        ? existingDeletedUser.id
        : randomUUID()
    const normalizedUsername = normalizeUsername(otpRow.username)

    try {
      await db.transaction(async tx => {
        if (existingDeletedUser?.status === "deleted") {
          await tx
            .update(UserTable)
            .set({
              email: normalizedEmail,
              name: buildFullName(otpRow.firstName!, otpRow.lastName!),
              imageUrl: "",
              role: "user",
              status: "active",
              updatedAt: new Date(),
            })
            .where(eq(UserTable.id, userId))
        } else {
          await tx.insert(UserTable).values({
            id: userId,
            email: normalizedEmail,
            name: buildFullName(otpRow.firstName!, otpRow.lastName!),
            imageUrl: "",
          })
        }

        await tx
          .insert(AuthCredentialTable)
          .values({
            userId,
            username: normalizedUsername,
            passwordHash: otpRow.passwordHash!,
          })
          .onConflictDoUpdate({
            target: [AuthCredentialTable.userId],
            set: {
              username: normalizedUsername,
              passwordHash: otpRow.passwordHash!,
              updatedAt: new Date(),
            },
          })

        await tx
          .update(AuthOtpTable)
          .set({ consumedAt: new Date() })
          .where(eq(AuthOtpTable.id, otpRow.id))
      })
    } catch (error) {
      if (isDuplicateConstraint(error, ["users_email_unique"])) {
        return {
          ok: false,
          status: 409,
          message: "Email này đã được đăng ký.",
        }
      }

      if (
        isDuplicateConstraint(error, [
          "auth_credentials_username_unique",
          "auth_credentials_userId_unique",
          "auth_credentials_pkey",
        ])
      ) {
        return {
          ok: false,
          status: 409,
          message: "Tên đăng nhập đã tồn tại.",
        }
      }

      logAuthError("otp_verify_signup_failed", {
        email: safeEmail,
      })
      throw error
    }

    await createSession(userId)
    logAuthInfo("otp_verify_signup_success", {
      email: safeEmail,
      username: normalizedUsername,
    })

    return { ok: true, isNewUser: true }
  }

  const user = await db.query.UserTable.findFirst({
    where: and(
      eq(UserTable.email, normalizedEmail),
      ne(UserTable.status, "deleted")
    ),
    columns: { id: true },
  })

  if (user == null) {
    return {
      ok: false,
      status: 404,
      message: "Không tìm thấy tài khoản với email này.",
    }
  }

  await db
    .update(AuthOtpTable)
    .set({ consumedAt: new Date() })
    .where(eq(AuthOtpTable.id, otpRow.id))

  await createSession(user.id)
  logAuthInfo("otp_verify_signin_success", {
    email: safeEmail,
    userId: user.id,
  })

  return { ok: true, isNewUser: false }
}
