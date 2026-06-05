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
import Link from "next/link"
import { Trophy } from "lucide-react"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { ScoreChart } from "./dashboard/_ScoreChart"
import { DashboardHero } from "./dashboard/_DashboardHero"
import { ReadinessScore } from "./dashboard/_ReadinessScore"
import { AiCoachWidget } from "./dashboard/_AiCoachWidget"
import { QuotaBars } from "./dashboard/_QuotaBars"
import { JobHub } from "./dashboard/_JobHub"
import { ActivityTimeline } from "./dashboard/_ActivityTimeline"
import { AchievementsSection } from "./dashboard/_AchievementsSection"

import type { DashboardStats } from "@/features/dashboard/data"

const DEFAULT_STATS: DashboardStats = {
  totalQuizAttempts: 0,
  totalInterviews: 0,
  totalAnalyses: 0,
  averageQuizPercent: null,
  bestQuizPercent: null,
  perfectScoreCount: 0,
  streakDays: 0,
  activeDaysLast30: 0,
}

async function safe<T>(label: string, p: Promise<T>, fallback: T): Promise<T> {
  try {
    return await p
  } catch (e) {
    console.error(`[dashboard] ${label} failed`, e)
    return fallback
  }
}

/** Compute a 0-100 readiness score from available stats */
function computeReadiness(stats: DashboardStats): {
  score: number
  resumeScore: number
  quizScore: number
  interviewScore: number
  consistencyScore: number
} {
  const resumeScore = Math.min(100, stats.totalAnalyses * 25)
  const quizScore = stats.averageQuizPercent ?? (stats.totalQuizAttempts > 0 ? 40 : 0)
  const interviewScore = Math.min(100, stats.totalInterviews * 33)
  const consistencyScore = Math.min(100, stats.activeDaysLast30 * 4)
  const score = Math.round(
    resumeScore * 0.25 +
    quizScore * 0.35 +
    interviewScore * 0.25 +
    consistencyScore * 0.15
  )
  return { score, resumeScore, quizScore, interviewScore, consistencyScore }
}

/** Compute XP from activity counts */
function computeXP(stats: DashboardStats): number {
  return (
    stats.totalAnalyses * 80 +
    stats.totalQuizAttempts * 50 +
    stats.totalInterviews * 120 +
    stats.activeDaysLast30 * 10 +
    stats.perfectScoreCount * 200 +
    stats.streakDays * 15
  )
}

/** Compute level (1-20) from XP */
function computeLevel(xp: number): { level: number; label: string } {
  const levels = [
    { threshold: 0,    label: "Career Starter" },
    { threshold: 200,  label: "CV Builder" },
    { threshold: 500,  label: "Quiz Apprentice" },
    { threshold: 1000, label: "Interview Prep" },
    { threshold: 2000, label: "Career Builder" },
    { threshold: 3500, label: "Top Candidate" },
    { threshold: 5500, label: "Interview Pro" },
    { threshold: 8000, label: "Career Expert" },
  ]
  let level = 1
  let label = levels[0].label
  for (const l of levels) {
    if (xp >= l.threshold) {
      level++
      label = l.label
    }
  }
  return { level: Math.min(level, 20), label }
}

function pickNextStep({
  jobs,
  stats,
}: {
  jobs: Awaited<ReturnType<typeof getJobSummaries>>
  stats: Awaited<ReturnType<typeof getDashboardStats>>
}): { text: string; href: string; cta: string } | null {
  if (jobs.length === 0) {
    return { text: "Bắt đầu bằng cách phân tích CV của bạn theo một JD.", href: "/app/analyze", cta: "Phân tích ngay" }
  }
  const jobNoQuiz = jobs.find(j => j.quizCount === 0)
  if (jobNoQuiz) {
    return { text: `Thử tạo quiz cho vị trí "${jobNoQuiz.name}" để luyện kiến thức.`, href: `/app/job-infos/${jobNoQuiz.id}/quizzes/new`, cta: "Tạo quiz" }
  }
  const jobNoInterview = jobs.find(j => j.interviewCount === 0)
  if (jobNoInterview) {
    return { text: `Thử mock interview cho "${jobNoInterview.name}" để rèn phản xạ trả lời.`, href: `/app/job-infos/${jobNoInterview.id}/interviews/new`, cta: "Phỏng vấn thử" }
  }

  if (stats.averageQuizPercent != null && stats.averageQuizPercent < 70) {
    return { text: "Điểm trung bình quiz dưới 70%. Thử làm lại bộ đề khó nhất để cải thiện.", href: "/app/quizzes", cta: "Đi tới quiz" }
  }
  return { text: "Bạn đang đi đúng hướng. Thử thêm một vị trí mới?", href: "/app/analyze", cta: "Phân tích mới" }
}

export default async function DashboardPage() {
  const { userId, user, redirectToSignIn } = await getCurrentUser({ allData: true })
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
    safe("quotaResume", getFeatureUsageSummary("resume_analysis"), null),
    safe("quotaQuestion", getFeatureUsageSummary("ai_question"), null),
    safe("quotaInterview", getFeatureUsageSummary("mock_interview"), null),
    safe("quotaQuiz", getFeatureUsageSummary("ai_quiz"), null),
    safe("jobs", getJobSummaries(userId), []),
    safe("activities", getRecentActivities(userId, 10), []),
    safe("stats", getDashboardStats(userId), DEFAULT_STATS),
    safe("scoreHistory", getQuizScoreHistory(userId, 30), []),
  ])

  const greetingName = user?.name?.split(" ").slice(-1)[0] ?? "bạn"
  const suggestion = pickNextStep({ jobs, stats })
  const readiness = computeReadiness(stats)
  const xp = computeXP(stats)
  const { level, label: levelLabel } = computeLevel(xp)

  return (
    <div className="container my-6 space-y-8 max-w-6xl">

      {/* 1 — Hero */}
      <DashboardHero
        name={greetingName}
        planName={plan.planName}
        streakDays={stats.streakDays}
        xp={xp}
        level={level}
        levelLabel={levelLabel}
        readinessPercent={readiness.score}
        suggestion={suggestion}
      />

      {/* 2 — Readiness + AI Coach */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ReadinessScore
          score={readiness.score}
          resumeScore={readiness.resumeScore}
          quizScore={readiness.quizScore}
          interviewScore={readiness.interviewScore}
          consistencyScore={readiness.consistencyScore}
        />
        <AiCoachWidget stats={stats} suggestion={suggestion} />
      </section>

      {/* 3 — Quota Bars */}
      <QuotaBars
        quotaResume={quotaResume}
        quotaQuestion={quotaQuestion}
        quotaInterview={quotaInterview}
        quotaQuiz={quotaQuiz}
      />

      {/* 4 — Quiz Score Chart */}
      <Card className="border-slate-200/80 bg-white dark:border-white/10 dark:bg-white/5 backdrop-blur-sm shadow-xl">
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2 text-slate-900 dark:text-white">
            <Trophy className="h-4 w-4 text-amber-400" />
            Lịch sử điểm quiz (30 ngày)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ScoreChart points={scoreHistory} />
        </CardContent>
      </Card>

      {/* 5 — Job Hub + Activity Timeline */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Vị trí ứng tuyển</h2>
            <Link href="/app/analyze" className="text-xs text-rose-500 hover:text-rose-600 dark:text-rose-400 dark:hover:text-rose-300 transition-colors font-medium">
              + Thêm vị trí
            </Link>
          </div>
          <JobHub jobs={jobs} />
        </div>

        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Hoạt động gần đây</h2>
          <ActivityTimeline activities={activities} />
        </div>
      </section>

      {/* 6 — Achievements */}
      <AchievementsSection stats={stats} />

    </div>
  )
}
