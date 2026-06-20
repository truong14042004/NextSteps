"use client"

import { useTransition } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { EyeOff } from "lucide-react"

import { Button } from "@/components/ui/button"
import { hideOwnExplorePostAction } from "@/features/explore/actions"

export function RecruiterPostActions({
  postId,
  status,
}: {
  postId: string
  status: string
}) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  function hidePost() {
    startTransition(async () => {
      const result = await hideOwnExplorePostAction(postId)
      if (result.error) toast.error(result.message)
      else {
        toast.success(result.message)
        router.refresh()
      }
    })
  }

  if (status !== "published") return null

  return (
    <Button
      variant="outline"
      size="sm"
      className="rounded-lg h-8 text-muted-foreground"
      disabled={isPending}
      onClick={hidePost}
    >
      <EyeOff className="size-3.5 mr-1.5" />
      Ẩn
    </Button>
  )
}
