import Link from "next/link"
import { notFound, redirect } from "next/navigation"
import { ArrowLeft, BriefcaseBusiness, FileText, MessageCircle } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ExploreHeader } from "@/components/explore/explore-header"
import { getExplorePostById } from "@/features/explore/db"
import { getPlanSummaryForUser } from "@/features/plans/entitlements"
import { getCurrentUser } from "@/services/clerk/lib/getCurrentUser"
import { getExplorePostTypeLabel, getRoleLabel } from "@/features/explore/exploreRules.mjs"
import { ExplorePostDetailComments } from "./_ExplorePostDetailComments"

export default async function ExplorePostDetailPage({
  params,
}: {
  params: Promise<{ postId: string }>
}) {
  const { userId, user } = await getCurrentUser({ allData: true })
  if (userId == null || user == null) redirect("/sign-in")

  const { postId } = await params
  const [post, plan] = await Promise.all([
    getExplorePostById(postId),
    getPlanSummaryForUser(userId),
  ])

  if (post == null) notFound()

  const canView =
    post.status === "published" || post.authorId === userId || user.role === "admin"
  if (!canView) notFound()

  const isJob = post.type === "job_post"
  const isRecruiter = user.role === "recruiter"

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,rgba(179,0,0,0.10),transparent_28%),radial-gradient(circle_at_top_right,rgba(99,102,241,0.08),transparent_24%),linear-gradient(to_bottom,var(--background),var(--background))]">
      <ExploreHeader
        user={{ name: user.name, imageUrl: user.imageUrl, role: user.role }}
        plan={plan}
      />

      <main className="container max-w-5xl space-y-6 py-8">
        <Button asChild variant="ghost" className="px-0">
          <Link href="/explore">
            <ArrowLeft className="mr-2 size-4" />
            Quay lại Khám phá
          </Link>
        </Button>

        <article className="rounded-[32px] border border-primary/10 bg-white/85 p-6 shadow-sm backdrop-blur dark:bg-card/80 md:p-8">
          <div className="flex flex-wrap items-center gap-2">
            <Badge className="rounded-full bg-gradient-to-r from-red-500 via-rose-500 to-pink-500 text-white">
              {isJob ? (
                <BriefcaseBusiness className="mr-1 size-3.5" />
              ) : (
                <FileText className="mr-1 size-3.5" />
              )}
              {getExplorePostTypeLabel(post.type)}
            </Badge>
            {post.companyName && <Badge variant="outline">{post.companyName}</Badge>}
            {post.location && <Badge variant="outline">{post.location}</Badge>}
            {post.salaryRange && <Badge variant="outline">{post.salaryRange}</Badge>}
          </div>

          <h1 className="mt-5 bg-gradient-to-r from-indigo-600 via-rose-500 to-amber-400 bg-clip-text text-3xl font-semibold tracking-tight text-transparent md:text-5xl">
            {post.title}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {post.author?.name ?? "Người dùng"} · {getRoleLabel(post.author?.role ?? "user")}
          </p>

          <div className="mt-6 whitespace-pre-line text-sm leading-7 md:text-base">
            {post.content}
          </div>

          <div className="mt-6 flex flex-wrap gap-2">
            {post.positionTitle && <Badge variant="outline">{post.positionTitle}</Badge>}
            {post.skills && <Badge variant="outline">{post.skills}</Badge>}
          </div>

          <div className="mt-8 flex flex-wrap gap-3">
            {!isRecruiter && isJob && post.status === "published" && (
              <Button asChild className="rounded-2xl bg-gradient-to-r from-red-500 via-rose-500 to-pink-500 text-white shadow-lg shadow-red-500/20">
                <Link href={`/app?source=explore&postId=${post.id}`}>
                  Phân tích CV với bài này
                </Link>
              </Button>
            )}
            {!isJob && post.cvUrl && (
              <Button asChild variant="outline" className="rounded-2xl border-primary/15 bg-white/80">
                <Link href={post.cvUrl} target="_blank">
                  Xem CV
                </Link>
              </Button>
            )}
          </div>
        </article>

        <section className="rounded-[28px] border border-primary/10 bg-white/85 p-6 shadow-sm backdrop-blur dark:bg-card/80">
          <div className="mb-4 flex items-center gap-2 font-semibold">
            <MessageCircle className="size-4 text-primary" />
            Bình luận
          </div>
          <ExplorePostDetailComments
            currentUserId={userId}
            postId={post.id}
            comments={post.comments}
            canComment={post.status === "published"}
          />
        </section>
      </main>
    </div>
  )
}
