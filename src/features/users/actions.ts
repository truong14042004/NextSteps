"use server"

import { cacheTag } from "next/dist/server/use-cache/cache-tag"
import { getUserIdTag } from "./dbCache"
import { db } from "@/drizzle/db"
import { UserTable } from "@/drizzle/schema"
import { eq } from "drizzle-orm"
import { currentUser } from "@clerk/nextjs/server"
import { upsertUser } from "./db"

export async function getUser(id: string) {
  "use cache"
  cacheTag(getUserIdTag(id))

  return db.query.UserTable.findFirst({
    where: eq(UserTable.id, id),
  })
}

export async function syncUserFromClerk() {
  const clerkUser = await currentUser()
  
  if (!clerkUser) {
    return { success: false, error: "No user found" }
  }

  const email = clerkUser.emailAddresses.find(
    e => e.id === clerkUser.primaryEmailAddressId
  )?.emailAddress

  if (!email) {
    return { success: false, error: "No email found" }
  }

  await upsertUser({
    id: clerkUser.id,
    email,
    name: `${clerkUser.firstName || ''} ${clerkUser.lastName || ''}`.trim() || 'User',
    imageUrl: clerkUser.imageUrl || '',
    createdAt: new Date(clerkUser.createdAt),
    updatedAt: new Date(clerkUser.updatedAt),
  })

  return { success: true }
}
