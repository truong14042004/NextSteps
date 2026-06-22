import Link from "next/link"
import { Newspaper, Users } from "lucide-react"

import { getRecruiterJobPosts } from "@/features/explore/db"
import { requireRecruiterForPage } from "@/features/recruiter/auth"
import {
  getExplorePostStatusLabel,
} from "@/features/explore/exploreRules.mjs"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { RecruiterPostActions } from "./_RecruiterPostActions"

export const dynamic = "force-dynamic"

const statusBadgeClass: Record<string, string> = {
  published: "bg-emerald-500/15 text-emerald-600 border-emerald-500/30",
  pending: "bg-amber-500/15 text-amber-600 border-amber-500/30",
  rejected: "bg-rose-500/15 text-rose-600 border-rose-500/30",
  hidden: "bg-slate-500/15 text-slate-500 border-slate-500/30",
}

export default async function RecruiterPostsPage() {
  const { userId } = await requireRecruiterForPage()
  const posts = await getRecruiterJobPosts(userId)

  const totalApplicants = posts.reduce((sum, p) => sum + p.applicationCount, 0)
  const publishedCount = posts.filter(p => p.status === "published").length

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Quản lý bài đăng</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Quản lý các tin tuyển dụng bạn đã đăng và theo dõi số hồ sơ ứng tuyển.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <SummaryCard label="Tổng bài đăng" value={posts.length} icon={<Newspaper className="size-5 text-rose-500" />} />
        <SummaryCard label="Đang hiển thị" value={publishedCount} icon={<Newspaper className="size-5 text-emerald-500" />} />
        <SummaryCard label="Tổng hồ sơ" value={totalApplicants} icon={<Users className="size-5 text-blue-500" />} />
      </div>

      {posts.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border p-10 text-center">
          <p className="text-sm text-muted-foreground">
            Bạn chưa có bài tuyển dụng nào. Hãy tạo bài đăng ở trang Khám phá.
          </p>
          <Button asChild className="mt-4 rounded-xl">
            <Link href="/explore">Tới trang Khám phá</Link>
          </Button>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-border">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-left text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-4 py-3 font-semibold">Tin tuyển dụng</th>
                <th className="px-4 py-3 font-semibold">Trạng thái</th>
                <th className="px-4 py-3 font-semibold text-center">Hồ sơ</th>
                <th className="px-4 py-3 font-semibold text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {posts.map(post => (
                <tr key={post.id} className="hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3">
                    <div className="font-semibold text-foreground line-clamp-1">{post.title}</div>
                    <div className="text-xs text-muted-foreground mt-0.5">
                      {[post.positionTitle, post.companyName].filter(Boolean).join(" · ")}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <Badge
                      variant="outline"
                      className={`rounded-full ${statusBadgeClass[post.status] ?? ""}`}
                    >
                      {getExplorePostStatusLabel(post.status)}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <Link
                      href={`/recruiter/applicants/${post.id}`}
                      className="inline-flex items-center gap-1.5 font-semibold text-primary hover:underline"
                    >
                      <Users className="size-3.5" />
                      {post.applicationCount}
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-2">
                      <Button asChild variant="outline" size="sm" className="rounded-lg h-8">
                        <Link href={`/recruiter/applicants/${post.id}`}>Xem hồ sơ</Link>
                      </Button>
                      <RecruiterPostActions
                        post={{
                          id: post.id,
                          status: post.status,
                          title: post.title,
                          content: post.content,
                          companyName: post.companyName,
                          positionTitle: post.positionTitle,
                          location: post.location,
                          salaryRange: post.salaryRange,
                          skills: post.skills,
                          deadline: post.deadline,
                        }}
                      />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

function SummaryCard({
  label,
  value,
  icon,
}: {
  label: string
  value: number
  icon: React.ReactNode
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
          {label}
        </span>
        {icon}
      </div>
      <div className="mt-2 text-2xl font-bold">{value}</div>
    </div>
  )
}
