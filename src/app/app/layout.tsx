import { getCurrentUser, getUser } from "@/services/clerk/lib/getCurrentUser"
import { redirect } from "next/navigation"
import { ReactNode } from "react"
import { Navbar } from "./_Navbar"
import { Sidebar } from "./_Sidebar"

async function getUserWithRetry(
  userId: string,
  isNewUser: boolean
): Promise<Awaited<ReturnType<typeof getUser>> | null> {
  const maxRetries = isNewUser ? 3 : 0
  const retryDelay = 1000 // 1 second

  for (let i = 0; i <= maxRetries; i++) {
    const user = await getUser(userId)
    if (user) return user

    if (i < maxRetries) {
      await new Promise(resolve => setTimeout(resolve, retryDelay))
    }
  }

  return null
}

export default async function AppLayout({
  children,
  searchParams,
}: {
  children: ReactNode
  searchParams?: Promise<{ new?: string }>
}) {
  const { userId, redirectToSignIn } = await getCurrentUser()
  
  if (userId == null) return redirectToSignIn()

  const params = await searchParams
  const isNewUser = params?.new === "true"
  
  const user = await getUserWithRetry(userId, isNewUser)
  
  if (user == null) {
    console.error("User not found in DB after retries")
    return redirect("/sign-up?error=sync_failed")
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Navbar user={user} />
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  )
}
