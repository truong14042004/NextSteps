import { getCurrentUser } from "@/services/clerk/lib/getCurrentUser"
import { getPlanSummaryForUser } from "@/features/plans/entitlements";
import { getDashboardStats } from "@/features/dashboard/data";
import { computeXP, computeLevel } from "@/features/dashboard/xp";
import ProfileClient from "./ProfileClient"

const DEFAULT_STATS = {
  totalQuizAttempts: 0,
  totalInterviews: 0,
  totalAnalyses: 0,
  averageQuizPercent: null,
  bestQuizPercent: null,
  perfectScoreCount: 0,
  streakDays: 0,
  activeDaysLast30: 0,
};

function computeReadiness(stats: any): number {
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
  return score
}

export default async function ProfilePage() {
  const { userId, user, redirectToSignIn } = await getCurrentUser({ allData: true })

  if (!userId) {
    return redirectToSignIn()
  }

  const fullName = user?.name ?? "User"
  const email = user?.email ?? ""
  const avatar = user?.imageUrl ?? ""

  const [plan, stats] = await Promise.all([
    getPlanSummaryForUser(userId),
    getDashboardStats(userId).catch((err) => {
      console.error("[profile] failed to fetch stats", err);
      return DEFAULT_STATS;
    }),
  ]);

  const xp = computeXP(stats);
  const { level, label: levelLabel } = computeLevel(xp);
  const readinessScore = computeReadiness(stats);

  return (
    <ProfileClient
      user={{
        name: fullName,
        email,
        imageUrl: avatar,
        role: user?.role ?? "user",
      }}
      stats={{
        xp,
        level,
        levelLabel,
        totalAnalyses: stats.totalAnalyses,
        totalInterviews: stats.totalInterviews,
        totalQuizAttempts: stats.totalQuizAttempts,
        readinessScore,
      }}
      plan={plan}
    />
  )
}
