import Link from "next/link"
import { CheckCircle2, EyeOff, MessageSquareOff, RotateCcw, Trash2, XCircle } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
  approveExplorePostAction,
  deleteExploreCommentAsAdminAction,
  deleteExplorePostAsAdminAction,
  hideExploreCommentAsAdminAction,
  hideExplorePostAsAdminAction,
  rejectExplorePostAction,
  restoreExplorePostAsAdminAction,
} from "@/features/admin/explore"
import { getExplorePostsForAdmin } from "@/features/explore/db"
import {
  getExplorePostStatusLabel,
  getExplorePostTypeLabel,
  getRoleLabel,
} from "@/features/explore/exploreRules.mjs"

const statuses = ["all", "pending", "published", "rejected", "hidden", "deleted"] as const

function getStatus(searchStatus?: string) {
  return statuses.includes(searchStatus as (typeof statuses)[number])
    ? (searchStatus as (typeof statuses)[number])
    : "pending"
}

export default async function AdminPostManagementPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>
}) {
  const { status: searchStatus } = await searchParams
  const status = getStatus(searchStatus)
  const posts = await getExplorePostsForAdmin(status === "all" ? undefined : status)

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Quản lý bài viết Khám phá
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Duyệt tin tuyển dụng, ẩn bài public và xử lý bình luận vi phạm.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {statuses.map(item => (
            <Button key={item} asChild variant={status === item ? "default" : "outline"} size="sm">
              <Link href={`/admin/post-management?status=${item}`}>
                {item === "all" ? "Tất cả" : getExplorePostStatusLabel(item)}
              </Link>
            </Button>
          ))}
        </div>
      </div>

      <div className="grid gap-4">
        {posts.length === 0 ? (
          <Card className="rounded-lg">
            <CardContent className="p-8 text-center text-sm text-muted-foreground">
              Chưa có bài viết phù hợp.
            </CardContent>
          </Card>
        ) : (
          posts.map(post => (
            <Card key={post.id} className="rounded-lg">
              <CardHeader>
                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                  <div>
                    <div className="mb-2 flex flex-wrap gap-2">
                      <Badge>{getExplorePostTypeLabel(post.type)}</Badge>
                      <Badge variant="outline">{getExplorePostStatusLabel(post.status)}</Badge>
                      {post.companyName && <Badge variant="outline">{post.companyName}</Badge>}
                    </div>
                    <CardTitle className="text-lg">{post.title}</CardTitle>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {post.author?.name ?? "Người dùng"} · {post.author?.email} · {getRoleLabel(post.author?.role ?? "user")}
                    </p>
                  </div>
                  <Button asChild variant="outline" size="sm">
                    <Link href={`/explore/${post.id}`}>Xem chi tiết</Link>
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="line-clamp-4 whitespace-pre-line rounded-lg bg-muted/40 p-3 text-sm leading-6">
                  {post.content}
                </p>

                {post.rejectionReason && (
                  <p className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
                    {post.rejectionReason}
                  </p>
                )}

                <div className="flex flex-wrap gap-2">
                  {post.status === "pending" && (
                    <>
                      <form
                        action={async () => {
                          "use server"
                          await approveExplorePostAction(post.id)
                        }}
                      >
                        <Button type="submit" size="sm">
                          <CheckCircle2 className="mr-2 size-4" />
                          Duyệt
                        </Button>
                      </form>
                      <form
                        action={async formData => {
                          "use server"
                          await rejectExplorePostAction(
                            post.id,
                            String(formData.get("reason") ?? "")
                          )
                        }}
                        className="flex gap-2"
                      >
                        <Input name="reason" placeholder="Lý do từ chối" className="h-9 w-56" />
                        <Button type="submit" size="sm" variant="destructive">
                          <XCircle className="mr-2 size-4" />
                          Từ chối
                        </Button>
                      </form>
                    </>
                  )}
                  {post.status === "published" && (
                    <>
                      <form
                        action={async () => {
                          "use server"
                          await hideExplorePostAsAdminAction(post.id)
                        }}
                      >
                        <Button type="submit" size="sm" variant="outline">
                          <EyeOff className="mr-2 size-4" />
                          Ẩn bài
                        </Button>
                      </form>
                      <form
                        action={async () => {
                          "use server"
                          await deleteExplorePostAsAdminAction(post.id)
                        }}
                      >
                        <Button type="submit" size="sm" variant="destructive">
                          <Trash2 className="mr-2 size-4" />
                          Xóa bài
                        </Button>
                      </form>
                    </>
                  )}
                  {(post.status === "hidden" || post.status === "rejected" || post.status === "deleted") && (
                    <form
                      action={async () => {
                        "use server"
                        await restoreExplorePostAsAdminAction(post.id)
                      }}
                    >
                      <Button type="submit" size="sm">
                        <RotateCcw className="mr-2 size-4" />
                        Hiện lại
                      </Button>
                    </form>
                  )}
                </div>

                {post.comments.length > 0 && (
                  <div className="space-y-2 border-t pt-4">
                    <div className="text-sm font-medium">Bình luận gần đây</div>
                    {post.comments.map(comment => (
                      <div key={comment.id} className="flex items-start justify-between gap-3 rounded-lg bg-muted/30 p-3 text-sm">
                        <div>
                          <span className="font-medium">{comment.author?.name ?? "Người dùng"}: </span>
                          {comment.content}
                        </div>
                        {comment.status === "published" && (
                          <div className="flex shrink-0 gap-1">
                            <form
                              action={async () => {
                                "use server"
                                await hideExploreCommentAsAdminAction(comment.id)
                              }}
                            >
                              <Button type="submit" size="icon" variant="ghost" title="Ẩn bình luận">
                                <MessageSquareOff className="size-4" />
                              </Button>
                            </form>
                            <form
                              action={async () => {
                                "use server"
                                await deleteExploreCommentAsAdminAction(comment.id)
                              }}
                            >
                              <Button type="submit" size="icon" variant="ghost" title="Xóa bình luận">
                                <Trash2 className="size-4 text-destructive" />
                              </Button>
                            </form>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}
