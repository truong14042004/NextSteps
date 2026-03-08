import { auth, currentUser } from "@clerk/nextjs/server"
import { db } from "@/drizzle/db"
import { UserTable } from "@/drizzle/schema"
import { eq } from "drizzle-orm"

export async function syncUser() {
  const { userId } = await auth()
  if (!userId) return null

  const existingUser = await db.query.UserTable.findFirst({
    where: eq(UserTable.id, userId),
  })

  if (!existingUser) {
    const user = await currentUser()
    const email = user?.emailAddresses[0]?.emailAddress || ""

    // Check xem email đã tồn tại chưa
    const emailExists = email ? await db.query.UserTable.findFirst({
      where: eq(UserTable.email, email),
    }) : null

    if (!emailExists) {
      await db.insert(UserTable).values({
        id: userId,
        name: user?.firstName || "User",
        email: user?.emailAddresses[0]?.emailAddress || "",
        imageUrl: user?.imageUrl || "",
      })
    }
  }

  return userId
}