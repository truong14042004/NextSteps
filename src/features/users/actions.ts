"use server"

import { cacheTag } from "next/dist/server/use-cache/cache-tag"
import { getUserIdTag } from "./dbCache"
import { db } from "@/drizzle/db"
import { UserTable } from "@/drizzle/schema"
import { eq } from "drizzle-orm"
import { getCurrentUser } from "@/services/clerk/lib/getCurrentUser"

export async function getUser(id: string) {
  "use cache"
  cacheTag(getUserIdTag(id))

  return db.query.UserTable.findFirst({
    where: eq(UserTable.id, id),
  })
}

export async function syncUserFromClerk() {
  const { userId } = await getCurrentUser()
  if (userId == null) {
    return { success: false, error: "No active session" }
  }

  const user = await getUser(userId)
  if (user == null) {
    return { success: false, error: "User not found" }
  }

  return { success: true }
}
