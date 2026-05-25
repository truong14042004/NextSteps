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
import { JobInfoTable, QuizTable } from "@/drizzle/schema"
import { getJobInfoUserTag } from "@/features/jobInfos/dbCache"
import { getQuizGlobalTag } from "@/features/quizzes/dbCache"
import { getCurrentUser } from "@/services/clerk/lib/getCurrentUser"
import { desc, eq, sql } from "drizzle-orm"
import { cacheTag } from "next/dist/server/use-cache/cache-tag"
import Link from "next/link"

export default async function QuizzesHubPage() {
  const { userId, redirectToSignIn } = await getCurrentUser()
  if (userId == null) return redirectToSignIn()

  const items = await getJobInfosWithQuizCount(userId)

  return (
    <div className="container my-6 space-y-6 max-w-5xl">
      <div>
        <h1 className="text-3xl md:text-4xl">Trắc nghiệm</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Chọn một vị trí để xem hoặc tạo bộ đề trắc nghiệm. Mỗi bộ đề gồm 30
          câu, làm trong 45 phút, tối đa 5 lượt làm.
        </p>
      </div>

      {items.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>Chưa có job-info nào</CardTitle>
            <CardDescription>
              Bạn cần tạo một job-info (phân tích CV theo JD) trước khi tạo
              quiz.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild>
              <Link href="/app">Đi tới Phân tích CV</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {items.map(item => (
            <Link
              key={item.id}
              href={`/app/job-infos/${item.id}/quizzes`}
              className="block"
            >
              <Card className="hover:scale-[1.01] transition-transform h-full">
                <CardHeader>
                  <CardTitle className="text-lg">{item.name}</CardTitle>
                  {item.title && (
                    <CardDescription>{item.title}</CardDescription>
                  )}
                </CardHeader>
                <CardContent className="flex items-center justify-between gap-2 flex-wrap">
                  <Badge variant={item.quizCount > 0 ? "default" : "secondary"}>
                    {item.quizCount} bộ đề
                  </Badge>
                  <span className="text-sm text-muted-foreground underline">
                    {item.quizCount > 0 ? "Xem bộ đề" : "Tạo bộ đề mới"}
                  </span>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}

async function getJobInfosWithQuizCount(userId: string) {
  "use cache"
  cacheTag(getJobInfoUserTag(userId))
  cacheTag(getQuizGlobalTag())

  return db
    .select({
      id: JobInfoTable.id,
      name: JobInfoTable.name,
      title: JobInfoTable.title,
      quizCount: sql<number>`count(${QuizTable.id})::int`,
    })
    .from(JobInfoTable)
    .leftJoin(QuizTable, eq(QuizTable.jobInfoId, JobInfoTable.id))
    .where(eq(JobInfoTable.userId, userId))
    .groupBy(JobInfoTable.id)
    .orderBy(desc(JobInfoTable.updatedAt))
}
