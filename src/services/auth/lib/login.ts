import "server-only"

import { db } from "@/drizzle/db"
import { AuthCredentialTable, UserTable } from "@/drizzle/schema"
import { eq } from "drizzle-orm"
import { logAuthInfo, logAuthWarn } from "./logger"
import { verifyPassword } from "./password"
import { createSession } from "./session"

type LoginResult =
  | { ok: true }
  | { ok: false; status: number; message: string }

function normalizeEmail(email: string) {
  return email.trim().toLowerCase()
}

export async function loginWithPassword({
  email,
  password,
}: {
  email: string
  password: string
}): Promise<LoginResult> {
  const normalizedEmail = normalizeEmail(email)

  if (normalizedEmail.length === 0 || password.trim().length === 0) {
    return {
      ok: false,
      status: 400,
      message: "Vui lòng nhập email và mật khẩu.",
    }
  }

  const user = await db.query.UserTable.findFirst({
    where: eq(UserTable.email, normalizedEmail),
    columns: {
      id: true,
    },
  })

  if (user == null) {
    logAuthWarn("password_login_user_not_found", {
      email: normalizedEmail,
    })
    return {
      ok: false,
      status: 401,
      message: "Email hoặc mật khẩu không đúng.",
    }
  }

  const credential = await db.query.AuthCredentialTable.findFirst({
    where: eq(AuthCredentialTable.userId, user.id),
    columns: {
      userId: true,
      passwordHash: true,
    },
  })

  if (credential == null) {
    logAuthWarn("password_login_no_credential", {
      email: normalizedEmail,
      userId: user.id,
    })
    return {
      ok: false,
      status: 401,
      message: "Email hoặc mật khẩu không đúng.",
    }
  }

  const isValidPassword = await verifyPassword({
    password,
    passwordHash: credential.passwordHash,
  })
  if (!isValidPassword) {
    logAuthWarn("password_login_invalid_password", {
      userId: credential.userId,
    })
    return {
      ok: false,
      status: 401,
      message: "Email hoặc mật khẩu không đúng.",
    }
  }

  await createSession(credential.userId)
  logAuthInfo("password_login_success", {
    userId: credential.userId,
  })
  return { ok: true }
}
