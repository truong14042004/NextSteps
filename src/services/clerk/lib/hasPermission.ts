import { db } from "@/drizzle/db"
import { UserRole, UserTable } from "@/drizzle/schema"
import { eq } from "drizzle-orm"
import { getCurrentUser } from "./getCurrentUser"

type Permission =
  | "unlimited_resume_analysis"
  | "unlimited_interviews"
  | "unlimited_questions"
  | "1_interview"
  | "5_questions"

const permissionByRole: Record<UserRole, Set<Permission>> = {
  admin: new Set([
    "unlimited_resume_analysis",
    "unlimited_interviews",
    "unlimited_questions",
    "1_interview",
    "5_questions",
  ]),
  pro: new Set([
    "unlimited_resume_analysis",
    "unlimited_interviews",
    "unlimited_questions",
    "1_interview",
    "5_questions",
  ]),
  user: new Set(["1_interview", "5_questions"]),
}

export async function hasPermission(permission: Permission) {
  const { userId } = await getCurrentUser()
  if (userId == null) return false

  const user = await db.query.UserTable.findFirst({
    where: eq(UserTable.id, userId),
    columns: {
      role: true,
    },
  })
  if (user == null) return false

  return permissionByRole[user.role].has(permission)
}
