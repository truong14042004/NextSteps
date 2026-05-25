import { BackLink } from "@/components/BackLink"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { db } from "@/drizzle/db"
import { QuizAttemptTable, QuizTable } from "@/drizzle/schema"
import { getQuizIdTag } from "@/features/quizzes/dbCache"
import {
  formatDurationSeconds,
  formatQuizAttemptStatus,
} from "@/features/quizzes/formatters"
import { getCurrentUser } from "@/services/clerk/lib/getCurrentUser"
import { and, desc, eq } from "drizzle-orm"
import { cacheTag } from "next/dist/server/use-cache/cache-tag"
import Link from "next/link"
import { notFound } from "next/navigation"
import { StartAttemptButton } from "./_StartAttemptButton"

export default async function QuizDetailPage({
  params,
}: {
  params: Promise<{ jobInfoId: string; quizId: string }>
}) {
  const { jobInfoId, quizId } = await params
  const { userId, redirectToSignIn } = await getCurrentUser()
  if (userId == null) return redirectToSignIn()

  const quiz = await getQuiz(quizId, userId)
  if (quiz == null) return notFound()

  const attempts = await getAttempts(quizId, userId)
  const inProgress = attempts.find(a => a.status === "in_progress")
  const reachedMax = attempts.length >= quiz.maxAttempts

  return (
    <div className="container my-4 space-y-4 max-w-4xl">
      <BackLink href={`/app/job-infos/${jobInfoId}/quizzes`}>
        Trắc nghiệm
      </BackLink>

      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl md:text-3xl">{quiz.title}</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {quiz.totalQuestions} câu • {Math.floor(quiz.durationSeconds / 60)}{" "}
            phút • Tối đa {quiz.maxAttempts} lượt
          </p>
        </div>
        <StartAttemptButton
          jobInfoId={jobInfoId}
          quizId={quizId}
          inProgressAttemptId={inProgress?.id ?? null}
          disabled={!inProgress && reachedMax}
          reachedMax={reachedMax}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Lịch sử làm bài</CardTitle>
          <CardDescription>
            Đã làm {attempts.length}/{quiz.maxAttempts} lượt.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {attempts.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Chưa có lượt làm nào. Bấm "Bắt đầu làm bài" để thử.
            </p>
          ) : (
            <ul className="space-y-2">
              {attempts.map((a, idx) => {
                const remainSec = Math.max(
                  0,
                  Math.floor((a.expiresAt.getTime() - Date.now()) / 1000)
                )
                return (
                  <li
                    key={a.id}
                    className="flex items-center justify-between gap-2 border rounded-md p-3"
                  >
                    <div className="flex flex-col">
                      <span className="font-medium">
                        Lượt {attempts.length - idx}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {new Date(a.startedAt).toLocaleString("vi-VN")}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge
                        variant={
                          a.status === "submitted"
                            ? "default"
                            : a.status === "in_progress"
                              ? "secondary"
                              : "destructive"
                        }
                      >
                        {formatQuizAttemptStatus(a.status)}
                      </Badge>
                      {a.score != null && (
                        <Badge variant="outline">
                          {a.score}/{quiz.totalQuestions}
                        </Badge>
                      )}
                      <Link
                        href={`/app/job-infos/${jobInfoId}/quizzes/${quizId}/attempts/${a.id}`}
                        className="text-sm underline"
                      >
                        {a.status === "in_progress"
                          ? `Tiếp tục (${formatDurationSeconds(remainSec)})`
                          : "Xem"}
                      </Link>
                    </div>
                  </li>
                )
              })}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

async function getQuiz(quizId: string, userId: string) {
  "use cache"
  cacheTag(getQuizIdTag(quizId))
  return db.query.QuizTable.findFirst({
    where: and(eq(QuizTable.id, quizId), eq(QuizTable.userId, userId)),
    columns: {
      id: true,
      title: true,
      totalQuestions: true,
      durationSeconds: true,
      maxAttempts: true,
    },
  })
}

async function getAttempts(quizId: string, userId: string) {
  return db.query.QuizAttemptTable.findMany({
    where: and(
      eq(QuizAttemptTable.quizId, quizId),
      eq(QuizAttemptTable.userId, userId)
    ),
    orderBy: [desc(QuizAttemptTable.createdAt)],
    columns: {
      id: true,
      status: true,
      startedAt: true,
      expiresAt: true,
      submittedAt: true,
      score: true,
    },
  })
}
