import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowLeft } from "lucide-react"

import {
  getApplicationsForPost,
  getRecruiterJobPostById,
} from "@/features/explore/db"
import { requireRecruiterForPage } from "@/features/recruiter/auth"
import { ApplicantsClient } from "./_ApplicantsClient"

export const dynamic = "force-dynamic"

export default async function PostApplicantsPage({
  params,
}: {
  params: Promise<{ postId: string }>
}) {
  const { postId } = await params
  const { userId, user } = await requireRecruiterForPage()

  // Admin xem được mọi bài; recruiter chỉ xem bài của mình.
  const post =
    user.role === "admin"
      ? await getRecruiterJobPostById(postId, userId).then(
          p => p ?? getRecruiterJobPostByIdAnyOwner(postId),
        )
      : await getRecruiterJobPostById(postId, userId)

  if (post == null) notFound()

  const applications = await getApplicationsForPost(postId)

  return (
    <div className="space-y-6">
      <Link
        href="/recruiter/applicants"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="size-4" />
        Quay lại danh sách
      </Link>

      <div>
        <h1 className="text-2xl font-bold tracking-tight line-clamp-1">{post.title}</h1>
        <p className="text-sm text-muted-foreground mt-1">
          {[post.positionTitle, post.companyName].filter(Boolean).join(" · ")}
        </p>
      </div>

      <ApplicantsClient
        applications={applications.map(app => ({
          id: app.id,
          status: app.status,
          fullName: app.fullName,
          email: app.email,
          phone: app.phone,
          coverLetter: app.coverLetter,
          cvUrl: app.cvUrl,
          cvFileName: app.cvFileName,
          recruiterNote: app.recruiterNote,
          createdAt: app.createdAt.toISOString(),
          applicant: app.applicant
            ? {
                name: app.applicant.name,
                email: app.applicant.email,
                imageUrl: app.applicant.imageUrl,
              }
            : null,
        }))}
      />
    </div>
  )
}

// Fallback cho admin: lấy bài đăng bất kể chủ sở hữu.
async function getRecruiterJobPostByIdAnyOwner(postId: string) {
  const { getExplorePostById } = await import("@/features/explore/db")
  const post = await getExplorePostById(postId)
  return post && post.type === "job_post" ? post : null
}
