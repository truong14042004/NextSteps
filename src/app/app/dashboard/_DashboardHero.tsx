"use client"

import { motion } from "framer-motion"
import {
  BrainCircuit,
  FileSearch,
  Flame,
  MessageSquare,
  Plus,
  Sparkles,
  Star,
  Trophy,
  Zap,
} from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"

type Props = {
  name: string
  planName: string
  streakDays: number
  xp: number
  level: number
  levelLabel: string
  readinessPercent: number
  suggestion: { text: string; href: string; cta: string } | null
}

export function DashboardHero({
  name,
  planName,
  streakDays,
  xp,
  level,
  levelLabel,
  readinessPercent,
  suggestion,
}: Props) {
  const planColor =
    planName.toLowerCase().includes("premium")
      ? "from-amber-500 to-rose-500"
      : planName.toLowerCase().includes("start")
        ? "from-blue-500 to-indigo-500"
        : "from-slate-500 to-slate-400"

  return (
    <section className="space-y-4">
      {/* Main hero card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative overflow-hidden rounded-2xl border border-slate-200/80 bg-gradient-to-br from-slate-50 via-slate-100/50 to-slate-100 dark:border-white/10 dark:from-slate-900 dark:via-slate-900 dark:to-slate-800 p-6 md:p-8 shadow-xl"
      >
        {/* Background glow blobs */}
        <div className="pointer-events-none absolute -top-20 -right-20 h-64 w-64 rounded-full bg-rose-500/8 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-16 -left-16 h-56 w-56 rounded-full bg-indigo-500/8 blur-3xl" />

        <div className="relative z-10 flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
          {/* Left: greeting + stats */}
          <div className="flex items-start gap-4">
            {/* Avatar bubble */}
            <motion.div
              initial={{ scale: 0.6, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", stiffness: 260, damping: 20, delay: 0.1 }}
              className="relative shrink-0"
            >
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-rose-500 to-indigo-500 text-2xl font-bold text-white shadow-lg shadow-rose-500/25">
                {name.charAt(0).toUpperCase()}
              </div>
              {streakDays > 0 && (
                <div className="absolute -bottom-1.5 -right-1.5 flex h-6 w-6 items-center justify-center rounded-full border-2 border-white dark:border-slate-900 bg-orange-500 text-[10px]">
                  🔥
                </div>
              )}
            </motion.div>

            <div>
              <motion.div
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.15 }}
              >
                <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">Chào mừng trở lại</p>
                <h1 className="mt-0.5 text-2xl font-bold text-slate-900 dark:text-white md:text-3xl">
                  {name} 👋
                </h1>
              </motion.div>

              {/* Badges row */}
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25 }}
                className="mt-3 flex flex-wrap items-center gap-2"
              >
                {/* Plan badge */}
                <span className={`inline-flex items-center gap-1 rounded-full bg-gradient-to-r ${planColor} px-3 py-1 text-xs font-semibold text-white shadow-md`}>
                  <Star className="h-3 w-3" />
                  {planName}
                </span>

                {/* Level badge */}
                <span className="inline-flex items-center gap-1 rounded-full border border-violet-200 dark:border-violet-500/30 bg-violet-50 dark:bg-violet-500/10 px-3 py-1 text-xs font-medium text-violet-600 dark:text-violet-300">
                  <Trophy className="h-3 w-3" />
                  Level {level} · {levelLabel}
                </span>

                {/* Streak */}
                {streakDays > 0 && (
                  <span className="inline-flex items-center gap-1 rounded-full border border-orange-200 dark:border-orange-500/30 bg-orange-50 dark:bg-orange-500/10 px-3 py-1 text-xs font-medium text-orange-600 dark:text-orange-300">
                    <Flame className="h-3 w-3" />
                    {streakDays} ngày streak
                  </span>
                )}

                {/* XP */}
                <span className="inline-flex items-center gap-1 rounded-full border border-amber-200 dark:border-amber-500/30 bg-amber-50 dark:bg-amber-500/10 px-3 py-1 text-xs font-medium text-amber-600 dark:text-amber-300">
                  <Zap className="h-3 w-3" />
                  {xp.toLocaleString("vi-VN")} XP
                </span>
              </motion.div>
            </div>
          </div>
        </div>

        {/* Readiness callout strip */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="relative z-10 mt-6 rounded-xl border border-slate-200 bg-slate-50/50 dark:border-white/8 dark:bg-white/5 px-5 py-4 backdrop-blur-sm"
        >
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-start gap-3">
              <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-rose-500/15">
                <Sparkles className="h-4 w-4 text-rose-500 dark:text-rose-400 animate-pulse" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-800 dark:text-white">
                  Bạn đang chuẩn bị{" "}
                  <span className="font-bold text-rose-600 dark:text-rose-400">{readinessPercent}%</span>{" "}
                  cho vị trí tiếp theo
                </p>
                <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                  {suggestion?.text ?? "Tiếp tục luyện tập để cải thiện điểm sẵn sàng."}
                </p>
              </div>
            </div>
            {suggestion && (
              <Button asChild size="sm" className="rounded-lg bg-slate-200/80 hover:bg-slate-300 text-slate-800 dark:bg-white/10 dark:text-white dark:hover:bg-white/20 border border-slate-300/50 dark:border-white/15 shrink-0">
                <Link href={suggestion.href}>
                  {suggestion.cta}
                </Link>
              </Button>
            )}
          </div>

          {/* Readiness progress bar */}
          <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-white/8">
            <motion.div
              initial={{ width: "0%" }}
              animate={{ width: `${readinessPercent}%` }}
              transition={{ duration: 1.2, ease: "easeOut", delay: 0.6 }}
              className="h-full rounded-full bg-gradient-to-r from-rose-500 to-indigo-500"
            />
          </div>
        </motion.div>
      </motion.div>

      {/* Quick stats strip */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.45 }}
        className="grid grid-cols-3 gap-3"
      >
        {[
          { icon: FileSearch, label: "CV đã phân tích", link: "/app/analyze", color: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-50/60 border-emerald-100 hover:bg-emerald-100/50 dark:bg-emerald-500/10 dark:border-emerald-500/20" },
          { icon: MessageSquare, label: "Mock Interview", link: "/app/interview", color: "text-blue-600 dark:text-blue-400", bg: "bg-blue-50/60 border-blue-100 hover:bg-blue-100/50 dark:bg-blue-500/10 dark:border-blue-500/20" },
          { icon: BrainCircuit, label: "Lượt Quiz", link: "/app/quizzes", color: "text-violet-600 dark:text-violet-400", bg: "bg-violet-50/60 border-violet-100 hover:bg-violet-100/50 dark:bg-violet-500/10 dark:border-violet-500/20" },
        ].map(({ icon: Icon, label, link, color, bg }) => (
          <Link key={label} href={link}
            className={`flex flex-col items-center justify-center gap-1.5 rounded-xl border ${bg} p-3 text-center transition-all hover:-translate-y-0.5 hover:shadow-lg`}
          >
            <Icon className={`h-5 w-5 ${color}`} />
            <span className="text-[11px] font-medium text-slate-600 dark:text-slate-300 leading-tight">{label}</span>
          </Link>
        ))}
      </motion.div>
    </section>
  )
}
