import { db } from "@/drizzle/db"
import { JobInfoTable } from "@/drizzle/schema"
import { getJobInfoIdTag } from "@/features/jobInfos/dbCache"
import { insertQuizWithQuestions } from "@/features/quizzes/db"
import { canStartQuizAttempt } from "@/features/quizzes/permissions"
import { PLAN_LIMIT_MESSAGE } from "@/lib/errorToast"
import {
  generateAiQuiz,
  QUIZ_DURATION_SECONDS,
  QUIZ_MAX_ATTEMPTS,
  QUIZ_QUESTION_COUNT,
} from "@/services/ai/quizzes"
import { getCurrentUser } from "@/services/clerk/lib/getCurrentUser"
import { and, eq } from "drizzle-orm"
import { cacheTag } from "next/dist/server/use-cache/cache-tag"
import z from "zod"

export const maxDuration = 60

const schema = z.object({
  jobInfoId: z.string().min(1),
})

export async function POST(req: Request) {
  const body = await req.json().catch(() => null)
  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    return Response.json({ error: "Invalid request" }, { status: 400 })
  }

  const { userId } = await getCurrentUser()
  if (userId == null) {
    return Response.json({ error: "You are not logged in" }, { status: 401 })
  }

  if (!(await canStartQuizAttempt())) {
    return Response.json({ error: PLAN_LIMIT_MESSAGE }, { status: 403 })
  }

  const jobInfo = await getJobInfo(parsed.data.jobInfoId, userId)
  if (jobInfo == null) {
    return Response.json(
      { error: "You do not have permission to do this" },
      { status: 403 }
    )
  }

  let generated
  try {
    generated = await generateAiQuiz({ jobInfo })
  } catch (error) {
    console.error("[quiz.generate] AI failed", error)
    const message =
      error instanceof Error ? error.message : "Unknown AI error"
    return Response.json(
      { error: `Không thể tạo quiz: ${message}` },
      { status: 502 }
    )
  }

  const titleBase = jobInfo.title?.trim() || jobInfo.name
  const title = `${titleBase} • Quiz ${new Date().toLocaleDateString("vi-VN")}`

  const quiz = await insertQuizWithQuestions({
    jobInfoId: jobInfo.id,
    userId,
    title,
    totalQuestions: QUIZ_QUESTION_COUNT,
    durationSeconds: QUIZ_DURATION_SECONDS,
    maxAttempts: QUIZ_MAX_ATTEMPTS,
    questions: generated.questions,
  })

  return Response.json({ quizId: quiz.id })
}

async function getJobInfo(id: string, userId: string) {
  "use cache"
  cacheTag(getJobInfoIdTag(id))

  return db.query.JobInfoTable.findFirst({
    where: and(eq(JobInfoTable.id, id), eq(JobInfoTable.userId, userId)),
    columns: {
      id: true,
      userId: true,
      title: true,
      name: true,
      description: true,
      experienceLevel: true,
    },
  })
}
