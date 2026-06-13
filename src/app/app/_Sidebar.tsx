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
          "group relative flex w-full items-center gap-3 overflow-hidden rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200",
          isActive
            ? "bg-gradient-to-r from-primary/10 to-primary/5 text-primary shadow-sm shadow-primary/5"
            : "text-slate-600 dark:text-slate-400 hover:bg-slate-50/50 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-slate-200",
        )}
      >
        {/* Left Active Indicator */}
        <span
          className={cn(
            "absolute left-0 top-1/2 w-[3px] -translate-y-1/2 rounded-r-full bg-primary transition-all duration-300 ease-out",
            isActive ? "h-6" : "h-0 group-hover:h-4",
          )}
        />

        {/* Icon Wrapper */}
        <span
          className={cn(
            "flex h-8 w-8 items-center justify-center rounded-lg transition-all duration-200",
            isActive
              ? "bg-gradient-to-br from-primary/15 to-primary/5 text-primary shadow-sm"
              : "text-slate-500 dark:text-slate-450 group-hover:bg-slate-50 dark:group-hover:bg-white/5 group-hover:text-slate-800 dark:group-hover:text-slate-200",
          )}
        >
          <Icon
            className={cn(
              "h-4.5 w-4.5 shrink-0 transition-transform duration-200 group-hover:scale-105",
              isActive && "scale-105",
            )}
          />
        </span>

        <span className="truncate tracking-wide">{item.label}</span>
      </Link>
    );
  };

  return (
    <aside className="hidden md:block fixed top-0 left-0 h-screen w-60 border-r border-border/40 bg-card/60 backdrop-blur-md shadow-sm z-50">
      <div className="flex h-full flex-col">
        {/* header area */}
        <div className="px-6 h-16 flex items-center border-b border-border/40">
          <AppLogo
            textClassName="text-base font-bold tracking-tight bg-gradient-to-r from-red-600 to-rose-500 bg-clip-text text-transparent"
            imageSize={30}
          />
        </div>

        {/* nav scrollable list */}
        <nav className="flex-1 overflow-y-auto p-4 space-y-6 scrollbar-thin">
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

        {/* User Level + XP Card */}
        {stats && (
          <div className="p-4 mx-4 my-4 rounded-2xl bg-slate-50/50 dark:bg-white/3 border border-slate-100 dark:border-white/5 shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-rose-500/10 dark:bg-rose-500/20 text-rose-500 shrink-0">
                <Award className="h-4.5 w-4.5 stroke-[1.8]" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-850 dark:text-slate-200">Cấp {stats.level}</span>
                  <span className="text-[10px] font-semibold text-slate-400 dark:text-slate-500">{stats.xp} XP</span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate font-medium mt-0.5">
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
          <div className="border-t border-border/40 px-6 py-4 flex items-center justify-between text-xs text-muted-foreground/80">
            <span>© 2026 NextStep</span>
            <span className="rounded-full bg-muted px-2 py-0.5 font-mono text-[10px] border border-border/30">
              v1.2.0
            </span>
          </div>
        )}
      </div>
    </aside>
  );
}
