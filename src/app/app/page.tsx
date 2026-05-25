import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import {
  getDashboardStats,
  getJobSummaries,
  getQuizScoreHistory,
  getRecentActivities,
} from "@/features/dashboard/data"
import {
  getFeatureUsageSummary,
  getPlanSummaryForUser,
} from "@/features/plans/entitlements"
import { getCurrentUser } from "@/services/clerk/lib/getCurrentUser"
import {
  Award,
  BrainCircuit,
  FileSearch,
  Flame,
  MessageSquare,
  Plus,
  Sparkles,
  Trophy,
} from "lucide-react"
import Link from "next/link"
import { ScoreChart } from "./_ScoreChart"

export default async function DashboardPage() {
  const { userId, user, redirectToSignIn } = await getCurrentUser({
    allData: true,
  })
  if (userId == null) return redirectToSignIn()

  const [
    plan,
    quotaResume,
    quotaQuestion,
    quotaInterview,
    quotaQuiz,
    jobs,
    activities,
    stats,
    scoreHistory,
  ] = await Promise.all([
    getPlanSummaryForUser(userId),
    getFeatureUsageSummary("resume_analysis"),
    getFeatureUsageSummary("ai_question"),
    getFeatureUsageSummary("mock_interview"),
    getFeatureUsageSummary("ai_quiz"),
    getJobSummaries(userId),
    getRecentActivities(userId, 8),
    getDashboardStats(userId),
    getQuizScoreHistory(userId, 30),
  ])

  const greetingName = user?.name?.split(" ").slice(-1)[0] ?? "bạn"
  const suggestion = pickNextStep({ jobs, stats })

  return (
    <div className="container my-6 space-y-6 max-w-6xl">
      {/* Hero */}
      <section className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl md:text-4xl">Xin chào, {greetingName} 👋</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {summarize(stats)} •{" "}
            <span className="text-foreground font-medium">{plan.planName}</span>{" "}
            ({plan.resetText.toLowerCase()})
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button asChild>
            <Link href="/app/analyze">
              <Plus className="size-4 mr-1" /> Phân tích CV
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/app/quizzes">
              <BrainCircuit className="size-4 mr-1" /> Làm quiz
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/app/interview">
              <MessageSquare className="size-4 mr-1" /> Phỏng vấn
            </Link>
          </Button>
        </div>
      </section>

      {/* Next step suggestion */}
      {suggestion && (
        <Card className="border-primary/40 bg-primary/5">
          <CardContent className="p-4 flex items-start gap-3">
            <Sparkles className="size-5 text-primary mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <div className="font-medium">Gợi ý bước tiếp theo</div>
              <p className="text-sm text-muted-foreground mt-0.5">
                {suggestion.text}
              </p>
            </div>
            <Button asChild size="sm">
              <Link href={suggestion.href}>{suggestion.cta}</Link>
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Quota usage */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <QuotaCard summary={quotaResume} label="Phân tích CV" />
        <QuotaCard summary={quotaQuestion} label="Câu hỏi AI" />
        <QuotaCard summary={quotaInterview} label="Mock interview" />
        <QuotaCard summary={quotaQuiz} label="Quiz" />
      </section>

      {/* Stats + Chart + Milestones (Tier 3) */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Chuỗi ngày hoạt động</CardDescription>
            <CardTitle className="text-3xl flex items-center gap-2">
              <Flame
                className={
                  stats.streakDays > 0 ? "text-orange-500" : "text-muted-foreground"
                }
              />
              {stats.streakDays}
              <span className="text-base font-normal text-muted-foreground">
                ngày
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground">
            Hoạt động {stats.activeDaysLast30}/30 ngày gần nhất
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Điểm quiz trung bình</CardDescription>
            <CardTitle className="text-3xl">
              {stats.averageQuizPercent != null
                ? `${stats.averageQuizPercent}%`
                : "—"}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground">
            {stats.totalQuizAttempts} lượt đã chấm •{" "}
            {stats.bestQuizPercent != null
              ? `cao nhất ${stats.bestQuizPercent}%`
              : "chưa có"}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Thành tích</CardDescription>
            <CardTitle className="text-base flex flex-wrap gap-1 mt-1">
              {computeMilestones(stats).map(m => (
                <Badge key={m} variant="secondary" className="font-normal">
                  {m}
                </Badge>
              ))}
              {computeMilestones(stats).length === 0 && (
                <span className="text-sm font-normal text-muted-foreground">
                  Làm bài để mở khoá huy hiệu
                </span>
              )}
            </CardTitle>
          </CardHeader>
        </Card>
      </section>

      {/* Score chart */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Trophy className="size-4" /> Điểm quiz 30 ngày gần nhất
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ScoreChart points={scoreHistory} />
        </CardContent>
      </Card>

      {/* Two-col: jobs + activity */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Jobs */}
        <div className="lg:col-span-2 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Vị trí của bạn</h2>
            <Button asChild variant="ghost" size="sm">
              <Link href="/app/analyze">
                <Plus className="size-4 mr-1" /> Thêm
              </Link>
            </Button>
          </div>
          {jobs.length === 0 ? (
            <Card>
              <CardContent className="p-6 text-center">
                <FileSearch className="size-8 mx-auto text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground">
                  Chưa có vị trí nào. Bắt đầu bằng cách phân tích CV theo JD.
                </p>
                <Button asChild className="mt-3" size="sm">
                  <Link href="/app/analyze">Phân tích CV đầu tiên</Link>
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {jobs.map(j => (
                <Link
                  key={j.id}
                  href={`/app/job-infos/${j.id}`}
                  className="block"
                >
                  <Card className="hover:scale-[1.01] transition-transform h-full">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base">{j.name}</CardTitle>
                      {j.title && (
                        <CardDescription className="line-clamp-1">
                          {j.title}
                        </CardDescription>
                      )}
                    </CardHeader>
                    <CardContent className="flex flex-wrap gap-2 text-xs">
                      <Badge variant="secondary">{j.quizCount} quiz</Badge>
                      <Badge variant="secondary">
                        {j.interviewCount} interview
                      </Badge>
                      {j.bestQuizScore != null && j.bestQuizTotal != null && (
                        <Badge>
                          Best: {j.bestQuizScore}/{j.bestQuizTotal}
                        </Badge>
                      )}
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Activity */}
        <div className="space-y-3">
          <h2 className="text-xl font-semibold">Hoạt động gần đây</h2>
          <Card>
            <CardContent className="p-0">
              {activities.length === 0 ? (
                <div className="p-6 text-center text-sm text-muted-foreground">
                  Chưa có hoạt động
                </div>
              ) : (
                <ul className="divide-y">
                  {activities.map(a => (
                    <li key={`${a.kind}-${a.refId}`} className="p-3 text-sm">
                      <Link
                        href={activityHref(a)}
                        className="flex items-start gap-2 hover:bg-muted/40 -m-3 p-3 rounded"
                      >
                        <span className="mt-0.5">{activityIcon(a.kind)}</span>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium truncate">
                            {activityLabel(a.kind)} · {a.jobName}
                          </div>
                          {a.detail && (
                            <div className="text-xs text-muted-foreground">
                              {a.detail}
                            </div>
                          )}
                          <div className="text-xs text-muted-foreground">
                            {timeAgo(a.occurredAt)}
                          </div>
                        </div>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  )
}

type QuotaSummary = {
  used: number
  total: number | null
  remaining: number | null
  featureLabel: string
  resetText: string
} | null

function QuotaCard({
  summary,
  label,
}: {
  summary: QuotaSummary
  label: string
}) {
  if (summary == null) return null
  const unlimited = summary.total == null
  const percentUsed =
    !unlimited && summary.total! > 0
      ? Math.min(100, Math.round((summary.used / summary.total!) * 100))
      : 0
  const low =
    !unlimited &&
    summary.remaining != null &&
    summary.total! > 0 &&
    summary.remaining / summary.total! < 0.2

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardDescription className="text-xs">{label}</CardDescription>
        <CardTitle className="text-2xl">
          {unlimited ? "∞" : `${summary.remaining}`}
          {!unlimited && (
            <span className="text-sm text-muted-foreground font-normal">
              {" "}/ {summary.total}
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-1">
        {!unlimited && <Progress value={percentUsed} className="h-1.5" />}
        <p
          className={
            low ? "text-xs text-orange-600 dark:text-orange-400" : "text-xs text-muted-foreground"
          }
        >
          {unlimited ? "Không giới hạn" : low ? "Sắp hết lượt" : summary.resetText}
        </p>
      </CardContent>
    </Card>
  )
}

function pickNextStep({
  jobs,
  stats,
}: {
  jobs: Awaited<ReturnType<typeof getJobSummaries>>
  stats: Awaited<ReturnType<typeof getDashboardStats>>
}): { text: string; href: string; cta: string } | null {
  if (jobs.length === 0) {
    return {
      text: "Bắt đầu bằng cách phân tích CV của bạn theo một JD.",
      href: "/app/analyze",
      cta: "Phân tích ngay",
    }
  }
  const jobNoQuiz = jobs.find(j => j.quizCount === 0)
  if (jobNoQuiz) {
    return {
      text: `Thử tạo quiz cho vị trí "${jobNoQuiz.name}" để luyện kiến thức.`,
      href: `/app/job-infos/${jobNoQuiz.id}/quizzes/new`,
      cta: "Tạo quiz",
    }
  }
  const jobNoInterview = jobs.find(j => j.interviewCount === 0)
  if (jobNoInterview) {
    return {
      text: `Thử mock interview cho "${jobNoInterview.name}" để rèn phản xạ trả lời.`,
      href: `/app/job-infos/${jobNoInterview.id}/interviews/new`,
      cta: "Phỏng vấn thử",
    }
  }
  if (stats.averageQuizPercent != null && stats.averageQuizPercent < 70) {
    return {
      text: "Điểm trung bình quiz dưới 70%. Thử làm lại bộ đề khó nhất để cải thiện.",
      href: "/app/quizzes",
      cta: "Đi tới quiz",
    }
  }
  return {
    text: "Bạn đang đi đúng hướng. Thử thêm một vị trí mới?",
    href: "/app/analyze",
    cta: "Phân tích mới",
  }
}

function summarize(stats: Awaited<ReturnType<typeof getDashboardStats>>): string {
  if (
    stats.totalQuizAttempts === 0 &&
    stats.totalInterviews === 0 &&
    stats.totalAnalyses === 0
  ) {
    return "Bắt đầu hành trình ôn luyện của bạn."
  }
  const parts: string[] = []
  if (stats.totalAnalyses > 0) parts.push(`${stats.totalAnalyses} CV đã phân tích`)
  if (stats.totalQuizAttempts > 0) parts.push(`${stats.totalQuizAttempts} lượt quiz`)
  if (stats.totalInterviews > 0)
    parts.push(`${stats.totalInterviews} mock interview`)
  return parts.join(" · ")
}

function computeMilestones(
  stats: Awaited<ReturnType<typeof getDashboardStats>>
): string[] {
  const out: string[] = []
  const quizThresholds = [50, 25, 10, 5, 1]
  for (const t of quizThresholds) {
    if (stats.totalQuizAttempts >= t) {
      out.push(`${t}+ quiz`)
      break
    }
  }
  if (stats.perfectScoreCount > 0) out.push("Điểm tuyệt đối")
  if (stats.streakDays >= 7) out.push("Streak 7 ngày")
  else if (stats.streakDays >= 3) out.push("Streak 3 ngày")
  if (stats.totalInterviews >= 5) out.push("5+ interview")
  if (stats.totalAnalyses >= 5) out.push("5+ CV phân tích")
  return out.slice(0, 4)
}

function activityHref(a: {
  kind: string
  jobInfoId: string
  refId: string
}): string {
  switch (a.kind) {
    case "quiz_attempt":
      return `/app/job-infos/${a.jobInfoId}/quizzes`
    case "interview":
      return `/app/job-infos/${a.jobInfoId}`
    case "job_analysis":
      return `/app/job-infos/${a.jobInfoId}`
    default:
      return `/app/job-infos/${a.jobInfoId}`
  }
}

function activityLabel(kind: string): string {
  switch (kind) {
    case "quiz_attempt":
      return "Nộp quiz"
    case "interview":
      return "Mock interview"
    case "job_analysis":
      return "Phân tích CV"
    default:
      return "Hoạt động"
  }
}

function activityIcon(kind: string) {
  switch (kind) {
    case "quiz_attempt":
      return <BrainCircuit className="size-4 text-primary" />
    case "interview":
      return <MessageSquare className="size-4 text-blue-500" />
    case "job_analysis":
      return <FileSearch className="size-4 text-green-600" />
    default:
      return <Award className="size-4" />
  }
}

function timeAgo(date: Date): string {
  const diff = Date.now() - date.getTime()
  const min = Math.floor(diff / 60_000)
  if (min < 1) return "vừa xong"
  if (min < 60) return `${min} phút trước`
  const hour = Math.floor(min / 60)
  if (hour < 24) return `${hour} giờ trước`
  const day = Math.floor(hour / 24)
  if (day < 7) return `${day} ngày trước`
  return date.toLocaleDateString("vi-VN")
}
