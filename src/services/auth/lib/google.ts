import "server-only"

import { db } from "@/drizzle/db"
import { AuthGoogleAccountTable, UserTable } from "@/drizzle/schema"
import { env } from "@/data/env/server"
import { eq } from "drizzle-orm"
import { randomBytes, randomUUID } from "node:crypto"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"
import { logAuthError, logAuthInfo, logAuthWarn } from "./logger"
import { createSession } from "./session"

const GOOGLE_STATE_COOKIE = "ns_google_state"
const GOOGLE_MODE_COOKIE = "ns_google_mode"
const GOOGLE_STATE_TTL_SECONDS = 60 * 10

type AuthPageMode = "sign_in" | "sign_up"

type GoogleTokenResponse = {
  access_token?: string
}

type GoogleUserInfo = {
  sub?: string
  email?: string
  email_verified?: boolean
  given_name?: string
  family_name?: string
  name?: string
  picture?: string
}

function resolveMode(value: string | null): AuthPageMode {
  return value === "sign_up" ? "sign_up" : "sign_in"
}

function isGoogleConfigured() {
  return (
    env.GOOGLE_CLIENT_ID !== "placeholder" &&
    env.GOOGLE_CLIENT_SECRET !== "placeholder"
  )
}

function buildBaseUrl(request: Request) {
  const requestUrl = new URL(request.url)
  return requestUrl.origin
}

function getGoogleRedirectUri(request: Request) {
  const configured = env.GOOGLE_REDIRECT_URI.trim()
  if (configured.length > 0) return configured
  return `${buildBaseUrl(request)}/api/auth/google/callback`
}

function getErrorPath(mode: AuthPageMode, errorCode: string) {
  const basePath = mode === "sign_up" ? "/sign-up" : "/sign-in"
  const params = new URLSearchParams({ error: errorCode })
  return `${basePath}?${params.toString()}`
}

async function getOrCreateUserFromGoogleProfile(profile: {
  googleSub: string
  email: string
  firstName: string
  lastName: string
  fullName: string
  imageUrl: string
}) {
  const linkedGoogle = await db.query.AuthGoogleAccountTable.findFirst({
    where: eq(AuthGoogleAccountTable.googleSub, profile.googleSub),
    columns: {
      userId: true,
    },
  })
  if (linkedGoogle != null) {
    return linkedGoogle.userId
  }

  let user = await db.query.UserTable.findFirst({
    where: eq(UserTable.email, profile.email),
    columns: { id: true },
  })

  if (user == null) {
    const fullName =
      profile.fullName.trim() ||
      `${profile.firstName} ${profile.lastName}`.trim() ||
      profile.email.split("@")[0] ||
      "Nguoi dung NextSteps"

    await db.insert(UserTable).values({
      id: randomUUID(),
      email: profile.email,
      name: fullName,
      imageUrl: profile.imageUrl,
    })

    user = await db.query.UserTable.findFirst({
      where: eq(UserTable.email, profile.email),
      columns: { id: true },
    })
  }

  if (user == null) {
    throw new Error("Cannot create or load user from Google profile")
  }

  const googleForUser = await db.query.AuthGoogleAccountTable.findFirst({
    where: eq(AuthGoogleAccountTable.userId, user.id),
    columns: { id: true },
  })

  if (googleForUser == null) {
    await db
      .insert(AuthGoogleAccountTable)
      .values({
        userId: user.id,
        googleSub: profile.googleSub,
        email: profile.email,
      })
      .onConflictDoNothing({
        target: [AuthGoogleAccountTable.googleSub],
      })
  }

  return user.id
}

export async function beginGoogleAuth(request: Request) {
  const requestUrl = new URL(request.url)
  const mode = resolveMode(requestUrl.searchParams.get("mode"))

  if (!isGoogleConfigured()) {
    return NextResponse.redirect(
      new URL(getErrorPath(mode, "google_not_configured"), requestUrl.origin)
    )
  }

  const state = randomBytes(16).toString("hex")
  const cookieStore = await cookies()
  cookieStore.set({
    name: GOOGLE_STATE_COOKIE,
    value: state,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: GOOGLE_STATE_TTL_SECONDS,
  })
  cookieStore.set({
    name: GOOGLE_MODE_COOKIE,
    value: mode,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: GOOGLE_STATE_TTL_SECONDS,
  })

  const authUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth")
  authUrl.searchParams.set("client_id", env.GOOGLE_CLIENT_ID)
  authUrl.searchParams.set("redirect_uri", getGoogleRedirectUri(request))
  authUrl.searchParams.set("response_type", "code")
  authUrl.searchParams.set("scope", "openid email profile")
  authUrl.searchParams.set("state", state)
  authUrl.searchParams.set("prompt", "select_account")

  logAuthInfo("google_oauth_start", {
    mode,
  })
  return NextResponse.redirect(authUrl)
}

export async function finishGoogleAuth(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get("code")
  const state = requestUrl.searchParams.get("state")
  const googleError = requestUrl.searchParams.get("error")

  const cookieStore = await cookies()
  const expectedState = cookieStore.get(GOOGLE_STATE_COOKIE)?.value ?? null
  const mode = resolveMode(cookieStore.get(GOOGLE_MODE_COOKIE)?.value ?? null)

  cookieStore.delete(GOOGLE_STATE_COOKIE)
  cookieStore.delete(GOOGLE_MODE_COOKIE)

  if (googleError != null) {
    logAuthWarn("google_oauth_provider_error", { googleError, mode })
    return NextResponse.redirect(
      new URL(getErrorPath(mode, "google_rejected"), requestUrl.origin)
    )
  }

  if (code == null || state == null || expectedState == null || state !== expectedState) {
    logAuthWarn("google_oauth_invalid_state", {
      hasCode: code != null,
      hasState: state != null,
      hasExpectedState: expectedState != null,
    })
    return NextResponse.redirect(
      new URL(getErrorPath(mode, "google_state_invalid"), requestUrl.origin)
    )
  }

  let tokenJson: GoogleTokenResponse
  try {
    const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        code,
        client_id: env.GOOGLE_CLIENT_ID,
        client_secret: env.GOOGLE_CLIENT_SECRET,
        redirect_uri: getGoogleRedirectUri(request),
        grant_type: "authorization_code",
      }),
      cache: "no-store",
    })

    if (!tokenResponse.ok) {
      logAuthWarn("google_oauth_token_exchange_failed", {
        status: tokenResponse.status,
      })
      return NextResponse.redirect(
        new URL(getErrorPath(mode, "google_token_failed"), requestUrl.origin)
      )
    }

    tokenJson = (await tokenResponse.json()) as GoogleTokenResponse
  } catch {
    logAuthWarn("google_oauth_token_request_error")
    return NextResponse.redirect(
      new URL(getErrorPath(mode, "google_token_failed"), requestUrl.origin)
    )
  }

  if (tokenJson.access_token == null) {
    logAuthWarn("google_oauth_missing_access_token")
    return NextResponse.redirect(
      new URL(getErrorPath(mode, "google_token_failed"), requestUrl.origin)
    )
  }

  let profile: GoogleUserInfo
  try {
    const userInfoResponse = await fetch(
      "https://openidconnect.googleapis.com/v1/userinfo",
      {
        headers: {
          Authorization: `Bearer ${tokenJson.access_token}`,
        },
        cache: "no-store",
      }
    )

    if (!userInfoResponse.ok) {
      logAuthWarn("google_oauth_userinfo_failed", {
        status: userInfoResponse.status,
      })
      return NextResponse.redirect(
        new URL(getErrorPath(mode, "google_profile_failed"), requestUrl.origin)
      )
    }

    profile = (await userInfoResponse.json()) as GoogleUserInfo
  } catch {
    logAuthWarn("google_oauth_userinfo_request_error")
    return NextResponse.redirect(
      new URL(getErrorPath(mode, "google_profile_failed"), requestUrl.origin)
    )
  }

  if (
    profile.sub == null ||
    profile.email == null ||
    profile.email_verified !== true
  ) {
    logAuthWarn("google_oauth_profile_invalid", {
      hasSub: profile.sub != null,
      hasEmail: profile.email != null,
      emailVerified: profile.email_verified,
    })
    return NextResponse.redirect(
      new URL(getErrorPath(mode, "google_profile_invalid"), requestUrl.origin)
    )
  }

  const normalizedEmail = profile.email.trim().toLowerCase()
  try {
    const userId = await getOrCreateUserFromGoogleProfile({
      googleSub: profile.sub,
      email: normalizedEmail,
      firstName: profile.given_name?.trim() ?? "",
      lastName: profile.family_name?.trim() ?? "",
      fullName: profile.name?.trim() ?? "",
      imageUrl: profile.picture?.trim() ?? "",
    })

    await createSession(userId)
    logAuthInfo("google_oauth_success", { userId })
    return NextResponse.redirect(new URL("/app", requestUrl.origin))
  } catch {
    logAuthError("google_oauth_db_failed")
    return NextResponse.redirect(
      new URL(getErrorPath(mode, "google_db_failed"), requestUrl.origin)
    )
  }
}
