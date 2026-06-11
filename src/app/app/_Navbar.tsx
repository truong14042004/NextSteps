"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Crown, LogOut, User, Bell, Settings, History, HelpCircle, BrainCircuit, FileSearch, MessageSquare } from "lucide-react";
import Link from "next/link";
import { ThemeToggle } from "@/components/ThemeToggle";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { UserAvatar } from "@/features/users/components/UserAvatar";
import { cn } from "@/lib/utils";
import { ActivityItem } from "@/features/dashboard/data";

type PlanSummary = {
  planKey: string;
  planName: string;
  resetText: string;
};

type StatsProps = {
  xp: number;
  level: number;
  levelLabel: string;
  progressPercent: number;
  totalAnalyses: number;
  totalInterviews: number;
  totalQuizAttempts: number;
};

function timeAgo(date: Date): string {
  const parsedDate = typeof date === "string" ? new Date(date) : date;
  const diff = Date.now() - parsedDate.getTime();
  const min = Math.floor(diff / 60_000);
  if (min < 1) return "vừa xong";
  if (min < 60) return `${min} phút trước`;
  const hour = Math.floor(min / 60);
  if (hour < 24) return `${hour} giờ trước`;
  const day = Math.floor(hour / 24);
  if (day < 7) return `${day} ngày trước`;
  return parsedDate.toLocaleDateString("vi-VN");
}

const kindMeta: Record<string, { label: string; icon: typeof BrainCircuit; color: string; bg: string }> = {
  quiz_attempt: { label: "Nộp Quiz", icon: BrainCircuit, color: "text-violet-500", bg: "bg-violet-500/10" },
  interview: { label: "Mock Interview", icon: MessageSquare, color: "text-blue-500", bg: "bg-blue-500/10" },
  job_analysis: { label: "Phân tích CV", icon: FileSearch, color: "text-emerald-500", bg: "bg-emerald-500/10" },
};

function activityHref(a: ActivityItem): string {
  if (a.kind === "quiz_attempt") return `/app/job-infos/${a.jobInfoId}/quizzes`;
  return `/app/job-infos/${a.jobInfoId}`;
}

export function Navbar({
  user,
  plan,
  stats,
  activities = [],
}: {
  user: { name: string; imageUrl: string };
  plan: PlanSummary;
  stats?: StatsProps;
  activities?: ActivityItem[];
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const isPaidPlan = plan.planKey !== "free";
  const title = useMemo(() => resolveTitle(pathname), [pathname]);

  useEffect(() => setMounted(true), []);

  async function handleSignOut() {
    if (isSigningOut) return;
    setIsSigningOut(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.push("/");
      router.refresh();
    } finally {
      setIsSigningOut(false);
    }
  }

  return (
    <nav className="h-16 border-b border-slate-100 dark:border-slate-800/80 bg-white/80 dark:bg-slate-950/80 backdrop-blur-md sticky top-0 z-10">
      <div className="container flex h-full items-center justify-between">
        <Link href="/app" className="flex items-center gap-2">
          <span className="text-lg font-bold text-slate-800 dark:text-slate-100 tracking-tight">{title}</span>
        </Link>

        <div className="flex items-center gap-3">
          <ThemeToggle />

          {/* Plan Badge */}
          {mounted && (
            <span
              className={cn(
                "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold shadow-sm border transition-all duration-300",
                isPaidPlan
                  ? "border-amber-500/20 bg-gradient-to-r from-amber-500/10 to-orange-500/10 text-amber-600 dark:text-amber-400"
                  : "border-slate-200 bg-slate-50 text-slate-500 dark:border-white/10 dark:bg-white/5 dark:text-slate-400",
              )}
            >
              <Crown className="size-3.5 shrink-0" />
              <span>Gói {plan.planName}</span>
            </span>
          )}

          {/* Notifications Bell Dropdown */}
          {mounted && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="relative p-2 rounded-xl border border-slate-100 dark:border-white/5 hover:bg-slate-50 dark:hover:bg-white/5 text-slate-500 dark:text-slate-400 transition-colors">
                  <Bell className="size-4.5" />
                  {activities && activities.length > 0 && (
                    <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-rose-500 animate-pulse" />
                  )}
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-80 rounded-2xl p-2 border border-slate-100 dark:border-white/10 shadow-2xl bg-white dark:bg-slate-950">
                <div className="px-3 py-2 border-b border-slate-50 dark:border-white/5">
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    Lịch sử hoạt động
                  </span>
                </div>
                <div className="max-h-80 overflow-y-auto py-1 space-y-0.5">
                  {(!activities || activities.length === 0) ? (
                    <div className="px-3 py-6 text-center text-xs text-slate-400">
                      Chưa có hoạt động nào
                    </div>
                  ) : (
                    activities.map((a) => {
                      const meta = kindMeta[a.kind] ?? kindMeta.job_analysis;
                      const Icon = meta.icon;
                      return (
                        <DropdownMenuItem
                          key={a.refId}
                          onClick={() => router.push(activityHref(a))}
                          className="flex items-start gap-3 p-2 rounded-xl cursor-pointer hover:bg-slate-50 dark:hover:bg-white/5 focus:bg-slate-50 dark:focus:bg-white/5"
                        >
                          <div className={cn("flex h-8 w-8 shrink-0 items-center justify-center rounded-lg", meta.bg)}>
                            <Icon className={cn("h-4 w-4", meta.color)} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">
                              {meta.label} · <span className="text-slate-500 font-medium">{a.jobName}</span>
                            </p>
                            {a.detail && (
                              <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                                {a.detail}
                              </p>
                            )}
                            <span className="text-[9px] text-slate-400 dark:text-slate-505 block mt-0.5">
                              {timeAgo(a.occurredAt)}
                            </span>
                          </div>
                        </DropdownMenuItem>
                      );
                    })
                  )}
                </div>
              </DropdownMenuContent>
            </DropdownMenu>
          )}

          {mounted && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  className="flex items-center gap-2 rounded-full outline-none transition-all duration-200 hover:scale-105"
                  aria-label="Mở menu tài khoản"
                >
                  <UserAvatar user={user} />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-80 rounded-3xl p-4 border border-slate-100 dark:border-white/10 shadow-2xl bg-white dark:bg-slate-950">
                {/* Header Profile details */}
                <div className="flex items-center gap-3 mb-3">
                  <UserAvatar user={user} className="size-10" />
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-bold text-slate-800 dark:text-slate-100 truncate">{user.name}</h4>
                  </div>
                </div>

                {/* Quick stats grid inside dropdown */}
                {/* {stats && (
                  <div className="grid grid-cols-3 gap-2 mt-3 text-center">
                    <div className="p-2 rounded-xl bg-slate-50/50 dark:bg-white/3 border border-slate-100/50 dark:border-white/5">
                      <span className="block text-sm font-bold text-slate-800 dark:text-slate-200">{stats.totalAnalyses}</span>
                      <span className="text-[9px] text-slate-400 dark:text-slate-500 font-semibold uppercase tracking-wider">CV</span>
                    </div>
                    <div className="p-2 rounded-xl bg-slate-50/50 dark:bg-white/3 border border-slate-100/50 dark:border-white/5">
                      <span className="block text-sm font-bold text-slate-800 dark:text-slate-200">{stats.totalInterviews}</span>
                      <span className="text-[9px] text-slate-400 dark:text-slate-500 font-semibold uppercase tracking-wider">Mocks</span>
                    </div>
                    <div className="p-2 rounded-xl bg-slate-50/50 dark:bg-white/3 border border-slate-100/50 dark:border-white/5">
                      <span className="block text-sm font-bold text-slate-800 dark:text-slate-200">{stats.totalQuizAttempts}</span>
                      <span className="text-[9px] text-slate-400 dark:text-slate-500 font-semibold uppercase tracking-wider">Quizzes</span>
                    </div>
                  </div>
                )} */}

                {/* Account Plan Details Card */}
                <div
                  className={cn(
                    "mt-3 p-3 rounded-2xl border transition-all duration-300",
                    isPaidPlan
                      ? "border-amber-300/50 bg-amber-50/50 dark:border-amber-500/20 dark:bg-amber-500/5 text-amber-900 dark:text-amber-100"
                      : "border-slate-100 bg-slate-50/50 dark:border-white/5 dark:bg-white/3",
                  )}
                >
                  <div className="flex items-center gap-1.5 text-xs font-bold">
                    <Crown className="size-4 text-amber-500 shrink-0" />
                    <span>Gói: {plan.planName}</span>
                  </div>
                  <p className="mt-1 text-[10px] text-slate-500 dark:text-slate-400 font-medium">
                    {plan.resetText}
                  </p>
                </div>

                {/* Dropdown Menu Items */}
                <div className="space-y-0.5 mt-4">
                  <DropdownMenuItem
                    onClick={() => router.push("/profile")}
                    disabled={isSigningOut}
                    className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl cursor-pointer transition-colors hover:bg-slate-50 dark:hover:bg-white/5 text-slate-700 dark:text-slate-300 focus:bg-slate-50 dark:focus:bg-white/5 focus:text-slate-900 dark:focus:text-slate-100"
                  >
                    <User className="size-4 text-slate-500 shrink-0" />
                    <span className="text-sm font-medium">Hồ sơ của tôi</span>
                  </DropdownMenuItem>
                </div>

                <DropdownMenuSeparator className="my-2 border-slate-100 dark:border-white/5" />

                {/* Separated logout button */}
                <DropdownMenuItem
                  onClick={handleSignOut}
                  disabled={isSigningOut}
                  className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl cursor-pointer transition-colors text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/20 focus:bg-rose-50 dark:focus:bg-rose-950/20 focus:text-rose-700 dark:focus:text-rose-300"
                >
                  <LogOut className="size-4 shrink-0" />
                  <span className="text-sm font-bold">Đăng xuất</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>
    </nav>
  );
}

function resolveTitle(pathname: string | null): string {
  if (!pathname) return "NextStep";

  // Top-level sections
  if (pathname === "/app") return "Tổng quan";
  if (pathname.startsWith("/app/analyze")) return "Phân tích CV / JD";
  if (pathname.startsWith("/app/interview")) return "Phỏng vấn với AI";
  if (pathname.startsWith("/app/upgrade")) return "Nâng cấp gói";
  if (pathname.startsWith("/app/explore")) return "Khám phá";

  // Quiz hub (cross-job)
  if (pathname === "/app/quizzes") return "Trắc nghiệm";

  // Job-info nested
  if (pathname.startsWith("/app/job-infos/")) {
    if (/\/quizzes\/[^/]+\/attempts\//.test(pathname)) return "Làm bài quiz";
    if (pathname.endsWith("/quizzes") || /\/quizzes\/[^/]+$/.test(pathname))
      return "Trắc nghiệm";
    if (pathname.endsWith("/quizzes/new")) return "Tạo bộ đề";
    if (pathname.includes("/interviews")) return "Phỏng vấn thử";
    if (pathname.includes("/questions")) return "Câu hỏi luyện tập";
    if (pathname.includes("/resume")) return "Đánh giá CV";
    if (pathname.endsWith("/edit")) return "Sửa thông tin vị trí";
    return "Vị trí công việc";
  }

  return "NextStep";
}
