import "server-only"

import { NextResponse } from "next/server"
import { redirect } from "next/navigation"

import { getCurrentUser } from "@/services/clerk/lib/getCurrentUser"

const ADMIN_ROLE = "admin"

export async function getAdminContext() {
  const { userId, user } = await getCurrentUser({ allData: true })

  if (userId == null) {
    return {
      ok: false as const,
      status: 401,
      message: "Authentication required",
    }
  }

  if (user?.role !== ADMIN_ROLE) {
    return {
      ok: false as const,
      status: 403,
      message: "Admin permission required",
    }
  }

  return {
    ok: true as const,
    userId,
    user,
  }
}

export async function requireAdminForApi() {
  const context = await getAdminContext()

  if (!context.ok) {
    return {
      ok: false as const,
      response: NextResponse.json(
        { message: context.message },
        { status: context.status }
      ),
    }
  }

  return context
}

export async function requireAdminForPage() {
  const context = await getAdminContext()

  if (!context.ok) {
    if (context.status === 401) redirect("/sign-in")
    redirect("/app")
  }

  return context
}
