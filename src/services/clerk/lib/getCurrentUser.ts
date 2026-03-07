import { db } from "@/drizzle/db"
import { UserTable } from "@/drizzle/schema"
import { getUserIdTag } from "@/features/users/dbCache"
import { eq } from "drizzle-orm"
import { cacheTag } from "next/dist/server/use-cache/cache-tag"
import { redirect } from "next/navigation"
import { getSessionUserId } from "@/services/auth/lib/session"

export async function getCurrentUser({ allData = false } = {}) {
  const userId = await getSessionUserId()

  return {
    userId,
    redirectToSignIn: () => redirect("/sign-in"),
    user: allData && userId != null ? await getUser(userId) : undefined,
  }
}

export async function getUser(id: string) {
  "use cache"
  cacheTag(getUserIdTag(id))

  return db.query.UserTable.findFirst({
    where: eq(UserTable.id, id),
  })
}
