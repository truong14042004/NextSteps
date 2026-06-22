import Link from "next/link"
import { notFound, redirect } from "next/navigation"
import { EyeOff, Trash2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { ExploreHeader } from "@/components/explore/explore-header"
import {
  deleteExplorePostAsAdminAction,
  hideExplorePostAsAdminAction,
} from "@/features/admin/explore"
import { getExplorePostById, getMyActiveApplicationPostIds } from "@/features/explore/db"
import { getPlanSummaryForUser } from "@/features/plans/entitlements"
import { getCurrentUser } from "@/services/clerk/lib/getCurrentUser"
import { canApplyToJob } from "@/features/explore/exploreRules.mjs"
import { ExplorePostDetailClient } from "./ExplorePostDetailClient"

export default async function ExplorePostDetailPage({
  params,
}: {
  params: Promise<{ postId: string }>
}) {
  const { userId, user } = await getCurrentUser({ allData: true })
  if (userId == null || user == null) redirect("/sign-in")

  const { postId } = await params
  const [post, plan, appliedPostIds] = await Promise.all([
    getExplorePostById(postId),
    getPlanSummaryForUser(userId),
    getMyActiveApplicationPostIds(userId),
  ])

  if (post == null) notFound()

  const canView =
    post.status === "published" || post.authorId === userId || user.role === "admin"
  if (!canView) notFound()

  const isJob = post.type === "job_post"
  const isRecruiter = user.role === "recruiter"
  const isAdmin = user.role === "admin"
  // Bài đã quá hạn nộp CV thì không cho ứng tuyển nữa (khớp với lọc ở trang Khám phá).
  const isExpired = post.deadline != null && new Date(post.deadline) < new Date()
  const canApply = canApplyToJob(user.role) && post.authorId !== userId && !isExpired
  const alreadyApplied = appliedPostIds.includes(post.id)

  const adminActions = isAdmin && isJob ? (
    <div className="flex flex-wrap gap-2 pt-4 border-t border-slate-100 dark:border-border/60">
      <form
        action={async () => {
          "use server"
          await hideExplorePostAsAdminAction(post.id)
        }}
      >
        <Button type="submit" variant="outline" className="rounded-xl text-xs">
          <EyeOff className="mr-1.5 size-3.5" />
          Ẩn bài (Admin)
        </Button>
      </form>
      <form
        action={async () => {
          "use server"
          await deleteExplorePostAsAdminAction(post.id)
        }}
      >
        <Button type="submit" variant="destructive" className="rounded-xl text-xs">
          <Trash2 className="mr-1.5 size-3.5" />
          Xóa bài (Admin)
        </Button>
      </form>
    </div>
  ) : null

  return (
    <div className="min-h-screen bg-background text-foreground bg-[radial-gradient(circle_at_top,rgba(179,0,0,0.06),transparent_35%),radial-gradient(circle_at_top_right,rgba(99,102,241,0.05),transparent_25%),linear-gradient(to_bottom,var(--background),var(--background))]">
      <ExploreHeader
        user={{ name: user.name, imageUrl: user.imageUrl, role: user.role }}
        plan={plan}
      />

      <ExplorePostDetailClient
        post={post}
        currentUserId={userId}
        isAdmin={isAdmin}
        isRecruiter={isRecruiter}
        adminActions={adminActions}
        canApply={canApply && post.status === "published"}
        alreadyApplied={alreadyApplied}
        applicantName={user.name}
      />
    </div>
  )
}
