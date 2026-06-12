import "server-only"

import { db } from "@/drizzle/db"
import { AuthSessionTable } from "@/drizzle/schema"
import { env } from "@/data/env/server"
import { and, eq, gt, isNull } from "drizzle-orm"
import { randomBytes } from "node:crypto"
import { cookies } from "next/headers"
import { createHash } from "node:crypto"
import { logAuthInfo } from "./logger"

const SESSION_COOKIE_NAME = "ns_session"
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 7

function hashToken(token: string) {
  return createHash("sha256")
    .update(`${token}:${env.AUTH_SESSION_SECRET}`)
    .digest("hex")
}

export function getSessionCookieName() {
  return SESSION_COOKIE_NAME
}

export async function createSession(userId: string) {
  const token = randomBytes(32).toString("hex")
  const tokenHash = hashToken(token)
  const expiresAt = new Date(Date.now() + SESSION_TTL_SECONDS * 1000)

  await db.insert(AuthSessionTable).values({
    userId,
    tokenHash,
    expiresAt,
  })

  const cookieStore = await cookies()
  cookieStore.set({
    name: SESSION_COOKIE_NAME,
    value: token,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_TTL_SECONDS,
  })

  logAuthInfo("session_created", { userId })

  return token
}

export async function clearSession() {
  const cookieStore = await cookies()
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value

  if (token != null) {
    const tokenHash = hashToken(token)

    await db
      .update(AuthSessionTable)
      .set({ revokedAt: new Date() })
      .where(
        and(
          eq(AuthSessionTable.tokenHash, tokenHash),
          isNull(AuthSessionTable.revokedAt)
        )
      )

    logAuthInfo("session_revoked")
  }

  cookieStore.delete(SESSION_COOKIE_NAME)
}

export async function getSessionUserId() {
  const cookieStore = await cookies()
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value
  if (token == null) return null

  const tokenHash = hashToken(token)
  const session = await db.query.AuthSessionTable.findFirst({
    where: and(
      eq(AuthSessionTable.tokenHash, tokenHash),
      isNull(AuthSessionTable.revokedAt),
      gt(AuthSessionTable.expiresAt, new Date())
    ),
    columns: {
      id: true,
      userId: true,
      updatedAt: true,
    },
  })

  if (session != null) {
    const now = new Date()
    // Throttling to only update if last update was more than 60 seconds ago
    if (
      session.updatedAt == null ||
      now.getTime() - session.updatedAt.getTime() > 60 * 1000
    ) {
      // Run asynchronously or update inline to ensure active status is saved
      try {
        await db
          .update(AuthSessionTable)
          .set({ updatedAt: now })
          .where(eq(AuthSessionTable.id, session.id))
      } catch (err) {
        console.warn("Failed to touch session updatedAt:", err)
      }
    }
    return session.userId
  }

  return null
}
