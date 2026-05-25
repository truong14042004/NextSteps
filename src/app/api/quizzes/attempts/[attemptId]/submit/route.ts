import { db } from "@/drizzle/db"
import { QuizAttemptTable } from "@/drizzle/schema"
import { finalizeQuizAttempt } from "@/features/quizzes/db"
import { getCurrentUser } from "@/services/clerk/lib/getCurrentUser"
import { and, asc, eq } from "drizzle-orm"
import z from "zod"

const schema = z.object({
  answers: z.array(
    z.object({
      questionId: z.string().min(1),
      selectedIndex: z
        .number()
        .int()
        .min(0)
        .max(3)
        .nullable(),
    })
  ),
})

export async function POST(
  req: Request,
  ctx: { params: Promise<{ attemptId: string }> }
) {
  const { attemptId } = await ctx.params
  const body = await req.json().catch(() => null)
  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    return Response.json({ error: "Invalid payload" }, { status: 400 })
  }

  const { userId } = await getCurrentUser()
  if (userId == null) {
    return Response.json({ error: "Not logged in" }, { status: 401 })
  }

  const attempt = await db.query.QuizAttemptTable.findFirst({
    where: and(
      eq(QuizAttemptTable.id, attemptId),
      eq(QuizAttemptTable.userId, userId)
    ),
    with: {
      quiz: {
        columns: { id: true, jobInfoId: true },
        with: {
          questions: {
            columns: { id: true, correctIndex: true },
            orderBy: q => asc(q.order),
          },
        },
      },
    },
  })

  if (attempt == null) {
    return Response.json({ error: "Attempt not found" }, { status: 404 })
  }
  if (attempt.status !== "in_progress") {
    return Response.json(
      { error: "Attempt already finalized", score: attempt.score },
      { status: 409 }
    )
  }

  const isExpired = new Date() > attempt.expiresAt
  const status = isExpired ? "expired" : "submitted"

  const correctMap = new Map(
    attempt.quiz.questions.map(q => [q.id, q.correctIndex])
  )

  const normalizedAnswers = parsed.data.answers.filter(a => correctMap.has(a.questionId))
  let score = 0
  for (const a of normalizedAnswers) {
    if (a.selectedIndex != null && correctMap.get(a.questionId) === a.selectedIndex) {
      score += 1
    }
  }

  await finalizeQuizAttempt({
    attemptId,
    quizId: attempt.quiz.id,
    jobInfoId: attempt.quiz.jobInfoId,
    answers: normalizedAnswers,
    score,
    status,
  })

  return Response.json({
    score,
    total: attempt.quiz.questions.length,
    status,
  })
}
