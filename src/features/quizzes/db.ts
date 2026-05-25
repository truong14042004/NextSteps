import { db } from "@/drizzle/db"
import {
  QuizAnswer,
  QuizAttemptTable,
  QuizQuestionTable,
  QuizTable,
} from "@/drizzle/schema"
import { GeneratedQuizQuestion } from "@/services/ai/quizzes"
import { and, eq, sql } from "drizzle-orm"
import {
  revalidateQuizAttemptCache,
  revalidateQuizCache,
} from "./dbCache"

export async function insertQuizWithQuestions({
  jobInfoId,
  userId,
  title,
  totalQuestions,
  durationSeconds,
  maxAttempts,
  questions,
}: {
  jobInfoId: string
  userId: string
  title: string
  totalQuestions: number
  durationSeconds: number
  maxAttempts: number
  questions: GeneratedQuizQuestion[]
}) {
  const quiz = await db.transaction(async tx => {
    const [created] = await tx
      .insert(QuizTable)
      .values({
        jobInfoId,
        userId,
        title,
        totalQuestions,
        durationSeconds,
        maxAttempts,
      })
      .returning({ id: QuizTable.id })

    await tx.insert(QuizQuestionTable).values(
      questions.map((q, idx) => ({
        quizId: created.id,
        order: idx,
        text: q.text,
        options: q.options,
        correctIndex: q.correctIndex,
        explanation: q.explanation,
      }))
    )

    return created
  })

  revalidateQuizCache({ id: quiz.id, jobInfoId })
  return quiz
}

export async function startQuizAttempt({
  quizId,
  jobInfoId,
  userId,
  durationSeconds,
}: {
  quizId: string
  jobInfoId: string
  userId: string
  durationSeconds: number
}) {
  const startedAt = new Date()
  const expiresAt = new Date(startedAt.getTime() + durationSeconds * 1000)

  const [attempt] = await db
    .insert(QuizAttemptTable)
    .values({
      quizId,
      userId,
      status: "in_progress",
      startedAt,
      expiresAt,
      answers: [],
    })
    .returning({ id: QuizAttemptTable.id })

  revalidateQuizAttemptCache({ attemptId: attempt.id, quizId, jobInfoId })
  return { attemptId: attempt.id, startedAt, expiresAt }
}

export async function countQuizAttempts(quizId: string, userId: string) {
  const [row] = await db
    .select({ total: sql<number>`count(*)::int` })
    .from(QuizAttemptTable)
    .where(
      and(eq(QuizAttemptTable.quizId, quizId), eq(QuizAttemptTable.userId, userId))
    )
  return Number(row?.total ?? 0)
}

export async function finalizeQuizAttempt({
  attemptId,
  quizId,
  jobInfoId,
  answers,
  score,
  status,
}: {
  attemptId: string
  quizId: string
  jobInfoId: string
  answers: QuizAnswer[]
  score: number
  status: "submitted" | "expired"
}) {
  await db
    .update(QuizAttemptTable)
    .set({
      status,
      answers,
      score,
      submittedAt: new Date(),
    })
    .where(eq(QuizAttemptTable.id, attemptId))

  revalidateQuizAttemptCache({ attemptId, quizId, jobInfoId })
}
