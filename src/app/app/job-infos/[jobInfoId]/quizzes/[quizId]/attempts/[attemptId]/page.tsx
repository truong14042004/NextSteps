import { BackLink } from "@/components/BackLink"
import { db } from "@/drizzle/db"
import { QuizAttemptTable, QuizQuestionTable } from "@/drizzle/schema"
import { getCurrentUser } from "@/services/clerk/lib/getCurrentUser"
import { and, asc, eq } from "drizzle-orm"
import { notFound } from "next/navigation"
import { TakeQuizClient } from "./_TakeQuizClient"
import { ResultView } from "./_ResultView"

export default async function AttemptPage({
  params,
}: {
  params: Promise<{ jobInfoId: string; quizId: string; attemptId: string }>
}) {
  const { jobInfoId, quizId, attemptId } = await params
  const { userId, redirectToSignIn } = await getCurrentUser()
  if (userId == null) return redirectToSignIn()

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

  if (
    attempt == null ||
    attempt.quiz.id !== quizId ||
    attempt.quiz.jobInfoId !== jobInfoId
  ) {
    return notFound()
  }

  const questions = await db.query.QuizQuestionTable.findMany({
    where: eq(QuizQuestionTable.quizId, quizId),
    orderBy: [asc(QuizQuestionTable.order)],
  })

  const isDone =
    attempt.status === "submitted" || attempt.status === "expired"

  return (
    <div className="container my-4 space-y-4 max-w-5xl">
      <BackLink href={`/app/job-infos/${jobInfoId}/quizzes/${quizId}`}>
        {attempt.quiz.title}
      </BackLink>

      {isDone ? (
        <ResultView
          score={attempt.score ?? 0}
          total={attempt.quiz.totalQuestions}
          status={attempt.status}
          answers={attempt.answers}
          questions={questions.map(q => ({
            id: q.id,
            order: q.order,
            text: q.text,
            options: q.options,
            correctIndex: q.correctIndex,
            explanation: q.explanation,
          }))}
        />
      ) : (
        <TakeQuizClient
          attemptId={attempt.id}
          quizId={quizId}
          jobInfoId={jobInfoId}
          expiresAt={attempt.expiresAt.toISOString()}
          questions={questions.map(q => ({
            id: q.id,
            order: q.order,
            text: q.text,
            options: q.options,
          }))}
        />
      )}
    </div>
  )
}
