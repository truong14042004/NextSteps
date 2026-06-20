import "server-only"

import { redirect } from "next/navigation"

import { getCurrentUser } from "@/services/clerk/lib/getCurrentUser"

const RECRUITER_ROLES = new Set(["recruiter", "admin"])

export async function getRecruiterContext() {
  const { userId, user } = await getCurrentUser({ allData: true })

  if (userId == null || user == null) {
    return {
      ok: false as const,
      status: 401,
      message: "Authentication required",
    }
  }

  if (!RECRUITER_ROLES.has(user.role)) {
    return {
      ok: false as const,
      status: 403,
      message: "Recruiter permission required",
    }
  }

  return {
    ok: true as const,
    userId,
    user,
  }
}

export async function requireRecruiterForPage() {
  const context = await getRecruiterContext()

  if (!context.ok) {
    if (context.status === 401) redirect("/sign-in")
    redirect("/explore")
  }

  return context
}
