"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { FileSearch, LayoutDashboard, ListChecks, MessageSquare, Award } from "lucide-react";
import { AppLogo } from "@/components/ui/AppLogo";

type StatsProps = {
  xp: number;
  level: number;
  levelLabel: string;
  progressPercent: number;
  totalAnalyses: number;
  totalInterviews: number;
  totalQuizAttempts: number;
};

export function Sidebar({ stats }: { stats?: StatsProps }) {
  const pathname = usePathname();

  const generalItems = [
    { id: "overview", label: "Tổng quan", icon: LayoutDashboard, href: "/app" },
  ];

  const careerToolsItems = [
    {
      id: "analyze",
      label: "Phân tích CV / JD",
      icon: FileSearch,
      href: "/app/analyze",
    },
    {
      id: "interview",
      label: "Phỏng vấn với AI",
      icon: MessageSquare,
      href: "/app/interview",
    },
    {
      id: "quizzes",
      label: "Trắc nghiệm AI",
      icon: ListChecks,
      href: "/app/quizzes",
    },
  ];

  const renderMenuItem = (item: typeof generalItems[0]) => {
    const Icon = item.icon;
    const isActive =
      item.href === "/app"
        ? pathname === item.href
        : pathname === item.href || pathname.startsWith(item.href + "/");

    return (
      <Link
        key={item.id}
        href={item.href}
        className={cn(
          "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200",
          isActive
            ? "bg-primary/10 text-primary"
            : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-slate-200",
        )}
      >
        <Icon className={cn("h-4 w-4 shrink-0 transition-transform duration-200 group-hover:scale-110", isActive ? "text-primary" : "text-slate-500")} />
        <span className="truncate">{item.label}</span>
      </Link>
    );
  };

  return (
    <aside className="hidden md:flex md:flex-col w-64 flex-shrink-0 h-screen sticky top-0 left-0 z-20 border-r border-slate-100 dark:border-slate-800/80 bg-white dark:bg-slate-950 shadow-[1px_0_10px_rgba(0,0,0,0.01)] box-border">
      {/* header area */}
      <div className="px-6 py-5 min-h-[64px] flex items-center border-b border-slate-50 dark:border-white/5">
        <AppLogo />
      </div>

      {/* nav scrollable list */}
      <nav className="flex-1 overflow-auto p-4 space-y-6">
        <div>
          <h3 className="px-3 mb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
            Chung
          </h3>
          <div className="space-y-1">
            {generalItems.map(renderMenuItem)}
          </div>
        </div>

        <div>
          <h3 className="px-3 mb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
            Công cụ phát triển
          </h3>
          <div className="space-y-1">
            {careerToolsItems.map(renderMenuItem)}
          </div>
        </div>
      </nav>

      {/* User Level + XP Card replacing the simple text */}
      {stats && (
        <div className="p-4 mx-4 my-4 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-rose-500/10 dark:bg-rose-500/20 text-rose-500">
              <Award className="h-4.5 w-4.5" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200">Cấp {stats.level}</span>
                <span className="text-[10px] font-semibold text-slate-400 dark:text-slate-500">{stats.xp} XP</span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate font-medium">
                {stats.levelLabel}
              </p>
            </div>
          </div>
          <div className="w-full h-1.5 bg-slate-200 dark:bg-white/10 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-rose-500 to-amber-500 rounded-full transition-all duration-300"
              style={{ width: `${stats.progressPercent}%` }}
            />
          </div>
        </div>
      )}

      {!stats && (
        <div className="border-t border-slate-100 dark:border-white/5 px-4 py-4 text-center text-[10px] text-slate-400">
          © 2026 NextStep
        </div>
      )}
    </aside>
  );
}
