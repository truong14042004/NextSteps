import { getCurrentUser } from "@/services/clerk/lib/getCurrentUser";
import { getPlanSummaryForUser } from "@/features/plans/entitlements";
import { redirect } from "next/navigation";
import { ReactNode } from "react";
import { Navbar } from "./_Navbar";
import { Sidebar } from "./_Sidebar";
import { ServiceReviewButton } from "@/components/service-reviews/service-review-button";
import { getDashboardStats, getRecentActivities } from "@/features/dashboard/data";
import { computeXP, computeLevel, getLevelProgress } from "@/features/dashboard/xp";

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

export default async function AppLayout({ children }: { children: ReactNode }) {
  const { userId, user, redirectToSignIn } = await getCurrentUser({
    allData: true,
  });

  if (userId == null) return redirectToSignIn();
  if (user == null) return redirect("/sign-up");

  const userAccess = user as {
    publicMetadata?: { role?: unknown };
    role?: unknown;
    isAdmin?: unknown;
  };
  const isAdmin =
    userAccess.publicMetadata?.role === "admin" ||
    userAccess.role === "admin" ||
    userAccess.isAdmin === true;

  if (isAdmin) return redirect("/admin");
  if (user.role === "recruiter") return redirect("/explore");

  const [plan, stats, activities] = await Promise.all([
    getPlanSummaryForUser(userId),
    getDashboardStats(userId).catch((err) => {
      console.error("[layout] failed to fetch stats", err);
      return DEFAULT_STATS;
    }),
    getRecentActivities(userId, 8).catch((err) => {
      console.error("[layout] failed to fetch activities", err);
      return [];
    }),
  ]);

  const xp = computeXP(stats);
  const { level, label: levelLabel } = computeLevel(xp);
  const { progressPercent } = getLevelProgress(xp);

  const statsProps = {
    xp,
    level,
    levelLabel,
    progressPercent,
    totalAnalyses: stats.totalAnalyses,
    totalInterviews: stats.totalInterviews,
    totalQuizAttempts: stats.totalQuizAttempts,
  };

  return (
    <div className="min-h-screen bg-background relative flex">
      {/* Sidebar is fixed left-0 top-0 h-screen */}
      <Sidebar stats={statsProps} />

      {/* Right Column: topbar + scrollable content area */}
      <div className="flex-1 flex flex-col min-h-screen md:pl-60">
        {/* Topbar fixed top, spans to the right of sidebar */}
        <Navbar user={user} plan={plan} stats={statsProps} activities={activities} />

        {/* Main section scrollable independently */}
        <main className="flex-1 overflow-y-auto pt-16 min-h-0">
          {children}
        </main>
      </div>

      {/* Floating review button */}
      <ServiceReviewButton />
    </div>
  );
}
