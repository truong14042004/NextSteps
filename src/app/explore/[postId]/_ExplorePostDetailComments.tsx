"use client"

import { useState, useTransition, useMemo } from "react"
import { MessageSquareOff, Send, Trash2, ThumbsUp, Reply } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  createExploreCommentAction,
  deleteOwnCommentAction,
} from "@/features/explore/actions"
import {
  deleteExploreCommentAsAdminAction,
  hideExploreCommentAsAdminAction,
} from "@/features/admin/explore"
import type { getExplorePostById } from "@/features/explore/db"
import { getRoleLabel } from "@/features/explore/exploreRules.mjs"

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
  const [likedComments, setLikedComments] = useState<Record<string, boolean>>({})
  const [replyingTo, setReplyingTo] = useState<string | null>(null)

  function submitComment() {
    startTransition(async () => {
      const prefix = replyingTo ? `@${replyingTo} ` : ""
      const result = await createExploreCommentAction(postId, prefix + content)
      if (result.error) toast.error(result.message)
      else {
        toast.success(result.message)
        setContent("")
        setReplyingTo(null)
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

  function toggleLikeComment(commentId: string) {
    setLikedComments(prev => ({
      ...prev,
      [commentId]: !prev[commentId]
    }))
  }

  return (
    <div className="space-y-6">
      {/* Comments List */}
      <div className="space-y-4">
        {comments.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-6">Chưa có bình luận. Hãy là người đầu tiên thảo luận!</p>
        ) : (
          comments.map(comment => {
            const isLiked = !!likedComments[comment.id]
            const initials = comment.author?.name ? comment.author.name.charAt(0).toUpperCase() : "?"
            
            return (
              <div key={comment.id} className="group flex items-start gap-3 text-sm border-b last:border-b-0 border-slate-100/60 pb-4 last:pb-0">
                {/* Avatar */}
                {comment.author?.imageUrl ? (
                  <img
                    src={comment.author.imageUrl}
                    alt={comment.author.name}
                    className="w-9 h-9 rounded-full object-cover shrink-0 mt-0.5 ring-2 ring-primary/5"
                  />
                ) : (
                  <div className="w-9 h-9 rounded-full bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300 font-bold flex items-center justify-center shrink-0 mt-0.5 ring-2 ring-primary/5">
                    {initials}
                  </div>
                )}

                {/* Comment Body */}
                <div className="flex-1 space-y-1.5">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-800 dark:text-slate-200">{comment.author?.name ?? "Người dùng"}</span>
                    <Badge variant="secondary" className="rounded-full text-[9px] px-1.5 py-0 border-none font-medium bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                      {getRoleLabel(comment.author?.role ?? "user")}
                    </Badge>
                    <span className="text-[10px] text-muted-foreground">
                      {new Date(comment.createdAt).toLocaleDateString("vi-VN", { day: 'numeric', month: 'short' })}
                    </span>
                  </div>

                  <p className="text-foreground/80 leading-relaxed font-normal whitespace-pre-line text-[13px]">{comment.content}</p>

                  {/* Comment Actions: Like / Reply / Admin */}
                  <div className="flex items-center gap-3.5 pt-0.5 text-xs text-muted-foreground">
                    <button
                      type="button"
                      onClick={() => toggleLikeComment(comment.id)}
                      className={`flex items-center gap-1 hover:text-primary transition-colors ${isLiked ? "text-primary font-bold" : ""}`}
                    >
                      <ThumbsUp className={`size-3.5 ${isLiked ? "fill-primary text-primary" : ""}`} />
                      <span>{isLiked ? "Đã thích" : "Thích"}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setReplyingTo(comment.author?.name ?? "Người dùng")}
                      className="flex items-center gap-1 hover:text-indigo-600 transition-colors"
                    >
                      <Reply className="size-3.5" />
                      <span>Phản hồi</span>
                    </button>

                    {/* Admin Actions */}
                    <div className="hidden group-hover:flex items-center gap-1.5 ml-auto">
                      {isAdmin && (
                        <button
                          type="button"
                          disabled={isPending}
                          title="Ẩn bình luận"
                          onClick={() => hideCommentAsAdmin(comment.id)}
                          className="text-slate-400 hover:text-foreground text-[10px]"
                        >
                          Ẩn
                        </button>
                      )}
                      {(isAdmin || comment.authorId === currentUserId) && (
                        <button
                          type="button"
                          disabled={isPending}
                          title="Xóa bình luận"
                          onClick={() =>
                            isAdmin
                              ? deleteCommentAsAdmin(comment.id)
                              : deleteComment(comment.id)
                          }
                          className="text-rose-500/80 hover:text-rose-600 text-[10px]"
                        >
                          Xóa
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* Input Comment */}
      {canComment && (
        <div className="space-y-2 pt-4 border-t border-slate-100 dark:border-border/60">
          {replyingTo && (
            <div className="flex items-center justify-between bg-slate-50 dark:bg-slate-900/60 px-3 py-1.5 rounded-lg text-xs">
              <span className="text-muted-foreground font-semibold">
                Đang phản hồi <span className="text-primary">@{replyingTo}</span>
              </span>
              <button
                type="button"
                onClick={() => setReplyingTo(null)}
                className="text-[10px] text-rose-500 hover:underline"
              >
                Hủy
              </button>
            </div>
          )}

          <div className="flex gap-2 items-center">
            <Input
              value={content}
              onChange={event => setContent(event.target.value)}
              placeholder={replyingTo ? `Nhập phản hồi cho @${replyingTo}...` : "Viết bình luận của bạn..."}
              maxLength={1200}
              className="rounded-xl border-primary/10 bg-background/80 shadow-none py-5 focus-visible:ring-primary/20"
            />
            <Button
              type="button"
              size="icon"
              disabled={isPending || content.trim().length === 0}
              onClick={submitComment}
              className="rounded-xl bg-primary hover:bg-primary/95 text-white shrink-0 size-10"
            >
              <Send className="size-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
