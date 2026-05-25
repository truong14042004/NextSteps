import { BackLink } from "@/components/BackLink"
import { db } from "@/drizzle/db"
import { JobInfoTable } from "@/drizzle/schema"
import { getJobInfoIdTag } from "@/features/jobInfos/dbCache"
import { canStartQuizAttempt } from "@/features/quizzes/permissions"
import { getFeatureUsageSummary } from "@/features/plans/entitlements"
import { getCurrentUser } from "@/services/clerk/lib/getCurrentUser"
import { and, eq } from "drizzle-orm"
import { cacheTag } from "next/dist/server/use-cache/cache-tag"
import { notFound, redirect } from "next/navigation"
import { NewQuizClient } from "./_NewQuizClient"

export default async function NewQuizPage({
  params,
}: {
  params: Promise<{ jobInfoId: string }>
}) {
  const { jobInfoId } = await params
  const { userId, redirectToSignIn } = await getCurrentUser()
  if (userId == null) return redirectToSignIn()

  if (!(await canStartQuizAttempt())) return redirect("/app/upgrade")

  const jobInfo = await getJobInfo(jobInfoId, userId)
  if (jobInfo == null) return notFound()

  const usage = await getFeatureUsageSummary("ai_quiz")

  return (
    <div className="container my-4 space-y-4 max-w-3xl">
      <BackLink href={`/app/job-infos/${jobInfoId}/quizzes`}>
        Trắc nghiệm
      </BackLink>
      <NewQuizClient
        jobInfoId={jobInfo.id}
        jobInfoName={jobInfo.name}
        remaining={usage?.remaining ?? null}
      />
    </div>
  )
}

async function getJobInfo(id: string, userId: string) {
  "use cache"
  cacheTag(getJobInfoIdTag(id))
  return db.query.JobInfoTable.findFirst({
    where: and(eq(JobInfoTable.id, id), eq(JobInfoTable.userId, userId)),
    columns: { id: true, name: true },
  })
}
