import { BackLink } from "@/components/BackLink"
import { canRunResumeAnalysis } from "@/features/resumeAnalyses/permissions"
import { db } from "@/drizzle/db"
import { JobInfoTable } from "@/drizzle/schema"
import { getCurrentUser } from "@/services/clerk/lib/getCurrentUser"
import { and, eq } from "drizzle-orm"
import { Loader2Icon } from "lucide-react"
import { redirect } from "next/navigation"
import { Suspense } from "react"
import { ResumePageClient } from "./_client"

export default async function ResumePage({
  params,
}: {
  params: Promise<{ jobInfoId: string }>
}) {
  const { jobInfoId } = await params

  return (
    <div className="container py-4 space-y-4 h-screen-header flex flex-col items-start">
      <BackLink href="/app?tab=history">Lịch sử phân tích</BackLink>
      <Suspense
        fallback={<Loader2Icon className="animate-spin size-24 m-auto" />}
      >
        <SuspendedComponent jobInfoId={jobInfoId} />
      </Suspense>
    </div>
  )
}

async function SuspendedComponent({ jobInfoId }: { jobInfoId: string }) {
  if (!(await canRunResumeAnalysis())) return redirect("/app/upgrade")

  const { userId } = await getCurrentUser()
  const jobInfo = userId
    ? await db.query.JobInfoTable.findFirst({
        where: and(eq(JobInfoTable.id, jobInfoId), eq(JobInfoTable.userId, userId)),
        columns: { analysisResult: true, title: true, experienceLevel: true, description: true },
      })
    : null

  const storedAnalysis = jobInfo?.analysisResult
    ? (() => { try { return JSON.parse(jobInfo.analysisResult) } catch { return null } })()
    : null

  return (
    <ResumePageClient
      jobInfoId={jobInfoId}
      storedAnalysis={storedAnalysis}
      jobDetails={jobInfo ? {
        title: jobInfo.title ?? "",
        experienceLevel: jobInfo.experienceLevel,
        description: jobInfo.description,
      } : undefined}
    />
  )
}
