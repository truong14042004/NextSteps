import { db } from "@/drizzle/db"
import { JobInfoTable, QuizTable, QuizAttemptTable } from "@/drizzle/schema"
import { getJobInfoUserTag } from "@/features/jobInfos/dbCache"
import { getQuizGlobalTag } from "@/features/quizzes/dbCache"
import { getCurrentUser } from "@/services/clerk/lib/getCurrentUser"
import { desc, eq } from "drizzle-orm"
import { cacheTag } from "next/dist/server/use-cache/cache-tag"
import { QuizzesHubClient } from "./_QuizzesHubClient"

export default async function QuizzesHubPage() {
  const { userId, redirectToSignIn } = await getCurrentUser()
  if (userId == null) return redirectToSignIn()

  const items = await getJobInfosWithQuizzesAndAttempts(userId)

  return (
    <div className="container my-6 space-y-8 max-w-6xl">
      <QuizzesHubClient initialJobInfos={items} />
    </div>
  )
}

async function getJobInfosWithQuizzesAndAttempts(userId: string) {
  "use cache"
  cacheTag(getJobInfoUserTag(userId))
  cacheTag(getQuizGlobalTag())

  const items = await db.query.JobInfoTable.findMany({
    where: eq(JobInfoTable.userId, userId),
    orderBy: [desc(JobInfoTable.updatedAt)],
    with: {
      quizzes: {
        orderBy: [desc(QuizTable.createdAt)],
        with: {
          attempts: {
            orderBy: [desc(QuizAttemptTable.createdAt)],
          }
        }
      }
    }
  })

  // Map Date objects to string for client serialization
  return items.map(job => ({
    id: job.id,
    name: job.name,
    title: job.title,
    experienceLevel: job.experienceLevel,
    description: job.description,
    analysisResult: job.analysisResult,
    quizzes: job.quizzes.map(quiz => ({
      id: quiz.id,
      title: quiz.title,
      totalQuestions: quiz.totalQuestions,
      durationSeconds: quiz.durationSeconds,
      maxAttempts: quiz.maxAttempts,
      createdAt: quiz.createdAt.toISOString(),
      attempts: quiz.attempts.map(attempt => ({
        id: attempt.id,
        status: attempt.status,
        score: attempt.score,
        startedAt: attempt.startedAt.toISOString(),
        submittedAt: attempt.submittedAt?.toISOString() ?? null,
        expiresAt: attempt.expiresAt.toISOString(),
        answers: [],
      }))
    }))
  }))
}
