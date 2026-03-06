import "server-only"

import { db } from "@/drizzle/db"
import { AuthCredentialTable } from "@/drizzle/schema"
import { eq } from "drizzle-orm"
import { logAuthInfo, logAuthWarn } from "./logger"
import { verifyPassword } from "./password"
import { createSession } from "./session"

type LoginResult =
  | { ok: true }
  | { ok: false; status: number; message: string }

function normalizeUsername(username: string) {
  return username.trim().toLowerCase()
}

export async function loginWithPassword({
  username,
  password,
}: {
  username: string
  password: string
}): Promise<LoginResult> {
  const normalizedUsername = normalizeUsername(username)

  if (normalizedUsername.length === 0 || password.trim().length === 0) {
    return {
      ok: false,
      status: 400,
      message: "Vui lòng nhập tên đăng nhập và mật khẩu.",
    }
  }

  const credential = await db.query.AuthCredentialTable.findFirst({
    where: eq(AuthCredentialTable.username, normalizedUsername),
    columns: {
      userId: true,
      passwordHash: true,
    },
  })

  if (credential == null) {
    logAuthWarn("password_login_user_not_found", {
      username: normalizedUsername,
    })
    return {
      ok: false,
      status: 401,
      message: "Tên đăng nhập hoặc mật khẩu không đúng.",
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
      message: "Tên đăng nhập hoặc mật khẩu không đúng.",
    }
  }

  await createSession(credential.userId)
  logAuthInfo("password_login_success", {
    userId: credential.userId,
  })
  return { ok: true }
}
