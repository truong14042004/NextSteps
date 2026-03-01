"use client"

import { getUser, syncUserFromClerk } from "@/features/users/actions"
import { Loader2Icon } from "lucide-react"
import { useRouter } from "next/navigation"
import { useEffect, useRef } from "react"

export function OnboardingClient({ userId }: { userId: string }) {
  const router = useRouter()
  const hasSynced = useRef(false)

  useEffect(() => {
    async function syncAndCheckUser() {
      // Sync user from Clerk on first mount
      if (!hasSynced.current) {
        hasSynced.current = true
        await syncUserFromClerk()
      }

      const intervalId = setInterval(async () => {
        const user = await getUser(userId)
        if (user == null) return

        router.replace("/app")
        clearInterval(intervalId)
      }, 250)

      return () => {
        clearInterval(intervalId)
      }
    }

    syncAndCheckUser()
  }, [userId, router])

  return <Loader2Icon className="animate-spin size-24" />
}
