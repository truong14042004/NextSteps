import { BackLink } from "@/components/BackLink"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { db } from "@/drizzle/db"
import {
  JobInfoTable,
  QuizAttemptTable,
  QuizTable,
} from "@/drizzle/schema"
import { getJobInfoIdTag } from "@/features/jobInfos/dbCache"
import { getQuizJobInfoTag } from "@/features/quizzes/dbCache"
import { getCurrentUser } from "@/services/clerk/lib/getCurrentUser"
import { and, desc, eq, sql } from "drizzle-orm"
import { cacheTag } from "next/dist/server/use-cache/cache-tag"
import Link from "next/link"
import { notFound } from "next/navigation"

export default async function QuizListPage({
  params,
}: {
  params: Promise<{ jobInfoId: string }>
}) {
  const { jobInfoId } = await params
  const { userId, redirectToSignIn } = await getCurrentUser()
  if (userId == null) return redirectToSignIn()

  const jobInfo = await getJobInfo(jobInfoId, userId)
  if (jobInfo == null) return notFound()

  const quizzes = await getQuizzes(jobInfoId, userId)

  return (
    <div className="container my-4 space-y-4">
      <BackLink href={`/app/job-infos/${jobInfoId}`}>{jobInfo.name}</BackLink>

      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl md:text-4xl">Trắc nghiệm</h1>
          <p className="text-muted-foreground text-sm mt-1">
            30 câu / 45 phút / tối đa 5 lượt làm trên mỗi bộ đề.
          </p>
        </div>
        <Button asChild>
          <Link href={`/app/job-infos/${jobInfoId}/quizzes/new`}>
            Tạo bộ đề mới
          </Link>
        </Button>
      </div>

      {quizzes.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>Chưa có bộ đề nào</CardTitle>
            <CardDescription>
              Tạo bộ đề đầu tiên — AI sẽ sinh 30 câu hỏi dựa trên job
              description của bạn.
            </CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {quizzes.map(quiz => (
            <Link
              key={quiz.id}
              href={`/app/job-infos/${jobInfoId}/quizzes/${quiz.id}`}
            >
              <Card className="hover:scale-[1.01] transition-transform h-full">
                <CardHeader>
                  <CardTitle className="text-lg">{quiz.title}</CardTitle>
                  <CardDescription>
                    {new Date(quiz.createdAt).toLocaleString("vi-VN")}
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex gap-2 flex-wrap">
                  <Badge variant="secondary">
                    {quiz.attemptCount}/{quiz.maxAttempts} lượt
                  </Badge>
                  {quiz.bestScore != null && (
                    <Badge>
                      Điểm cao nhất: {quiz.bestScore}/{quiz.totalQuestions}
                    </Badge>
                  )}
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
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

async function getQuizzes(jobInfoId: string, userId: string) {
  "use cache"
  cacheTag(getQuizJobInfoTag(jobInfoId))

  const rows = await db
    .select({
      id: QuizTable.id,
      title: QuizTable.title,
      createdAt: QuizTable.createdAt,
      maxAttempts: QuizTable.maxAttempts,
      totalQuestions: QuizTable.totalQuestions,
      attemptCount: sql<number>`count(${QuizAttemptTable.id})::int`,
      bestScore: sql<number | null>`max(${QuizAttemptTable.score})`,
    })
    .from(QuizTable)
    .leftJoin(QuizAttemptTable, eq(QuizAttemptTable.quizId, QuizTable.id))
    .where(
      and(eq(QuizTable.jobInfoId, jobInfoId), eq(QuizTable.userId, userId))
    )
    .groupBy(QuizTable.id)
    .orderBy(desc(QuizTable.createdAt))

  return rows
}
