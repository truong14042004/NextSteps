import Link from "next/link"
import { Users } from "lucide-react"

import { getRecruiterJobPosts } from "@/features/explore/db"
import { requireRecruiterForPage } from "@/features/recruiter/auth"

export const dynamic = "force-dynamic"

export default async function RecruiterApplicantsIndexPage() {
  const { userId } = await requireRecruiterForPage()
  const posts = await getRecruiterJobPosts(userId)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Quản lý ứng viên</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Chọn một tin tuyển dụng để xem và xử lý hồ sơ ứng viên.
        </p>
      </div>

      {posts.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
          Bạn chưa có bài tuyển dụng nào.
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {posts.map(post => (
            <Link
              key={post.id}
              href={`/recruiter/applicants/${post.id}`}
              className="group rounded-2xl border border-border bg-card p-5 transition-all hover:border-primary/40 hover:shadow-md"
            >
              <div className="font-semibold text-foreground line-clamp-2 group-hover:text-primary transition-colors">
                {post.title}
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                {[post.positionTitle, post.companyName].filter(Boolean).join(" · ")}
              </div>
              <div className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-primary">
                <Users className="size-4" />
                {post.applicationCount} hồ sơ
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
