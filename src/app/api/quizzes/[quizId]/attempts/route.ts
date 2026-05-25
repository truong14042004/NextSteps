import { db } from "@/drizzle/db"
import { QuizTable } from "@/drizzle/schema"
import { recordFeatureUsage } from "@/features/plans/entitlements"
import { countQuizAttempts, startQuizAttempt } from "@/features/quizzes/db"
import { canStartQuizAttempt } from "@/features/quizzes/permissions"
import { PLAN_LIMIT_MESSAGE } from "@/lib/errorToast"
import { getCurrentUser } from "@/services/clerk/lib/getCurrentUser"
import { and, eq } from "drizzle-orm"

export async function POST(
  _req: Request,
  ctx: { params: Promise<{ quizId: string }> }
) {
  const { quizId } = await ctx.params

  const { userId } = await getCurrentUser()
  if (userId == null) {
    return Response.json({ error: "Not logged in" }, { status: 401 })
  }

  const quiz = await db.query.QuizTable.findFirst({
    where: and(eq(QuizTable.id, quizId), eq(QuizTable.userId, userId)),
    columns: {
      id: true,
      jobInfoId: true,
      maxAttempts: true,
      durationSeconds: true,
    },
  })

  if (quiz == null) {
    return Response.json({ error: "Quiz not found" }, { status: 404 })
  }

  if (!(await canStartQuizAttempt())) {
    return Response.json({ error: PLAN_LIMIT_MESSAGE }, { status: 403 })
  }

  const used = await countQuizAttempts(quiz.id, userId)
  if (used >= quiz.maxAttempts) {
    return Response.json(
      { error: `Bạn đã làm đủ ${quiz.maxAttempts} lần cho quiz này.` },
      { status: 403 }
    )
  }

  const { attemptId } = await startQuizAttempt({
    quizId: quiz.id,
    jobInfoId: quiz.jobInfoId,
    userId,
    durationSeconds: quiz.durationSeconds,
  })

  await recordFeatureUsage("ai_quiz")

  return Response.json({ attemptId })
}
