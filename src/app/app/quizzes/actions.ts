"use server"

import { db } from "@/drizzle/db"
import { QuizAttemptTable, QuizQuestionTable, QuizTable } from "@/drizzle/schema"
import { getCurrentUser } from "@/services/clerk/lib/getCurrentUser"
import { and, asc, eq, desc } from "drizzle-orm"

export async function getQuizAttemptData(attemptId: string) {
  const { userId } = await getCurrentUser()
  if (userId == null) throw new Error("Unauthorized")

  const attempt = await db.query.QuizAttemptTable.findFirst({
    where: and(
      eq(QuizAttemptTable.id, attemptId),
      eq(QuizAttemptTable.userId, userId)
    ),
    with: {
      quiz: {
        columns: {
          id: true,
          title: true,
          jobInfoId: true,
          totalQuestions: true,
        },
      },
    },
  })

  if (!attempt) return null

  const questions = await db.query.QuizQuestionTable.findMany({
    where: eq(QuizQuestionTable.quizId, attempt.quiz.id),
    orderBy: [asc(QuizQuestionTable.order)],
  })

  const isDone = attempt.status === "submitted" || attempt.status === "expired"

  return {
    attempt,
    isDone,
    questions: questions.map(q => ({
      id: q.id,
      order: q.order,
      text: q.text,
      options: q.options,
      correctIndex: isDone ? q.correctIndex : undefined,
      explanation: isDone ? q.explanation : undefined,
    })),
  }
}

export async function getQuizForJobInfo(jobInfoId: string) {
  const { userId } = await getCurrentUser()
  if (userId == null) return null

  // Find the latest quiz for this jobInfo
  const quiz = await db.query.QuizTable.findFirst({
    where: and(
      eq(QuizTable.jobInfoId, jobInfoId),
      eq(QuizTable.userId, userId)
    ),
    orderBy: [desc(QuizTable.createdAt)],
  })

  if (!quiz) return null

  const attempts = await db.query.QuizAttemptTable.findMany({
    where: and(
      eq(QuizAttemptTable.quizId, quiz.id),
      eq(QuizAttemptTable.userId, userId)
    ),
    orderBy: [desc(QuizAttemptTable.createdAt)],
  })

  return {
    quiz,
    attempts,
  }
}
