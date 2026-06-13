"use client"

import { motion } from "framer-motion"
import { Flame, Sparkles, Star, Trophy, Zap, ArrowRight } from "lucide-react"
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
      ? "bg-amber-500 text-white"
      : planName.toLowerCase().includes("start")
        ? "bg-blue-500 text-white"
        : "bg-gradient-to-r from-slate-200 via-slate-100 to-slate-300 text-slate-700 dark:from-slate-800 dark:via-slate-750 dark:to-slate-850 dark:text-slate-200 border border-slate-300/40 shadow-sm"

  return (
    <section>
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45 }}
        className="relative overflow-hidden rounded-3xl border border-slate-100 dark:border-white/5 bg-gradient-to-br from-slate-50 via-slate-100/50 to-slate-100 dark:from-slate-900 dark:via-slate-900 dark:to-slate-800 p-6 md:p-8 shadow-sm"
      >
        {/* Top: Avatar, Greeting & Badges */}
        <div className="flex items-start gap-4">
          {/* Avatar Bubble */}
          <div className="relative shrink-0">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-rose-500 to-indigo-500 text-2xl font-bold text-white shadow-md shadow-rose-500/15">
              {name.charAt(0).toUpperCase()}
            </div>
            {streakDays > 0 && (
              <div className="absolute -bottom-1 -right-1 flex h-5.5 w-5.5 items-center justify-center rounded-full border-2 border-white dark:border-slate-900 bg-orange-500 text-white shadow-sm p-0.5">
                <Flame className="h-3 w-3 fill-white stroke-[2]" />
              </div>
            )}
          </div>

          <div className="space-y-3">
            <div>
              <p className="text-xs text-slate-400 dark:text-slate-500 font-medium">Chào mừng trở lại</p>
              <h1 className="text-2xl font-black text-slate-800 dark:text-white tracking-tight">
                {name}
              </h1>
            </div>

            {/* Row of Badges */}
            <div className="flex flex-wrap items-center gap-2">
              {/* Plan Badge */}
              <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold ${planColor} border border-transparent`}>
                <Star className="h-3 w-3 fill-current" />
                {planName}
              </span>

              {/* Level Badge */}
              <span className="inline-flex items-center gap-1 rounded-full border border-violet-100 dark:border-violet-500/20 bg-violet-50 dark:bg-violet-500/10 px-2.5 py-0.5 text-[10px] font-bold text-violet-600 dark:text-violet-300">
                <Trophy className="h-3 w-3 stroke-[2]" />
                Level {level} · {levelLabel}
              </span>

              {/* Streak Badge */}
              {streakDays > 0 && (
                <span className="inline-flex items-center gap-1 rounded-full border border-orange-100 dark:border-orange-500/20 bg-orange-50 dark:bg-orange-500/10 px-2.5 py-0.5 text-[10px] font-bold text-orange-600 dark:text-orange-300">
                  <Flame className="h-3 w-3 fill-orange-550 stroke-[2]" />
                  {streakDays} ngày streak
                </span>
              )}

              {/* XP Badge */}
              <span className="inline-flex items-center gap-1 rounded-full border border-amber-100 dark:border-amber-500/20 bg-amber-50 dark:bg-amber-500/10 px-2.5 py-0.5 text-[10px] font-bold text-amber-600 dark:text-amber-300">
                <Zap className="h-3 w-3 stroke-[2]" />
                {xp.toLocaleString("vi-VN")} XP
              </span>
            </div>
          </div>
        </div>

        {/* Readiness Callout Strip */}
        <div className="mt-6 rounded-2xl border border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-white/3 p-4 md:p-5 flex flex-col justify-between gap-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-rose-500/10">
                <Sparkles className="h-4.5 w-4.5 text-rose-500" />
              </div>
              <div>
                <p className="text-xs md:text-sm font-bold text-slate-800 dark:text-white">
                  Bạn đang chuẩn bị <span className="text-rose-600 dark:text-rose-450">{readinessPercent}%</span> cho vị trí tiếp theo
                </p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  {suggestion?.text ?? "Tiếp tục luyện tập để cải thiện điểm sẵn sàng."}
                </p>
              </div>
            </div>
            {suggestion && (
              <Button asChild size="sm" className="rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shrink-0 h-9">
                <Link href={suggestion.href}>
                  {suggestion.cta}
                  <ArrowRight className="ml-1 h-3.5 w-3.5" />
                </Link>
              </Button>
            )}
          </div>

          {/* Progress Bar */}
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-white/5 mt-1">
            <motion.div
              initial={{ width: "0%" }}
              animate={{ width: `${readinessPercent}%` }}
              transition={{ duration: 1.2, ease: "easeOut", delay: 0.2 }}
              className="h-full rounded-full bg-gradient-to-r from-rose-500 to-indigo-500"
            />
          </div>
        </div>
      </motion.div>
    </section>
  )
}
