"use client"

import { useState, useTransition } from "react"
import { MessageSquareOff, Send, Trash2 } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  createExploreCommentAction,
  deleteOwnCommentAction,
} from "@/features/explore/actions"
import {
  deleteExploreCommentAsAdminAction,
  hideExploreCommentAsAdminAction,
} from "@/features/admin/explore"
import type { getExplorePostById } from "@/features/explore/db"

type Comment = NonNullable<Awaited<ReturnType<typeof getExplorePostById>>>["comments"][number]

export function ExplorePostDetailComments({
  currentUserId,
  postId,
  comments,
  canComment,
  isAdmin,
}: {
  currentUserId: string
  postId: string
  comments: Comment[]
  canComment: boolean
  isAdmin: boolean
}) {
  const [content, setContent] = useState("")
  const [isPending, startTransition] = useTransition()

  function submitComment() {
    startTransition(async () => {
      const result = await createExploreCommentAction(postId, content)
      if (result.error) toast.error(result.message)
      else {
        toast.success(result.message)
        setContent("")
      }
    })
  }

  function deleteComment(commentId: string) {
    startTransition(async () => {
      const result = await deleteOwnCommentAction(commentId)
      if (result.error) toast.error(result.message)
      else toast.success(result.message)
    })
  }

  function hideCommentAsAdmin(commentId: string) {
    startTransition(async () => {
      const result = await hideExploreCommentAsAdminAction(commentId)
      if (result.error) toast.error(result.message)
      else toast.success(result.message)
    })
  }

  function deleteCommentAsAdmin(commentId: string) {
    startTransition(async () => {
      const result = await deleteExploreCommentAsAdminAction(commentId)
      if (result.error) toast.error(result.message)
      else toast.success(result.message)
    })
  }

  return (
    <div className="space-y-4">
      {comments.length === 0 ? (
        <p className="text-sm text-muted-foreground">Chưa có bình luận.</p>
      ) : (
        comments.map(comment => (
          <div key={comment.id} className="flex items-start justify-between gap-3 rounded-2xl border border-primary/5 bg-primary/5 p-3">
            <div className="text-sm">
              <div className="font-medium">{comment.author?.name ?? "Người dùng"}</div>
              <p className="mt-1 whitespace-pre-line leading-6">{comment.content}</p>
            </div>
            <div className="flex shrink-0 gap-1">
              {isAdmin && (
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  disabled={isPending}
                  title="Ẩn bình luận"
                  onClick={() => hideCommentAsAdmin(comment.id)}
                >
                  <MessageSquareOff className="size-4" />
                </Button>
              )}
              {(isAdmin || comment.authorId === currentUserId) && (
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  disabled={isPending}
                  title="Xóa bình luận"
                  onClick={() =>
                    isAdmin
                      ? deleteCommentAsAdmin(comment.id)
                      : deleteComment(comment.id)
                  }
                >
                  <Trash2 className="size-4 text-destructive" />
                </Button>
              )}
            </div>
          </div>
        ))
      )}

      {canComment && (
        <div className="flex gap-2">
          <Input
            value={content}
            onChange={event => setContent(event.target.value)}
            placeholder="Viết bình luận..."
            maxLength={1200}
            className="rounded-2xl border-primary/10 bg-background/80 shadow-none"
          />
          <Button type="button" size="icon" disabled={isPending || content.trim().length === 0} onClick={submitComment} className="rounded-2xl">
            <Send className="size-4" />
          </Button>
        </div>
      )}
    </div>
  )
}
