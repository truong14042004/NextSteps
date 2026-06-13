"use client"

import { motion } from "framer-motion"
import { Trophy, Lock, Check, FileText, Brain, Mic, Flame, Medal, Sparkles, Briefcase, BadgeCheck } from "lucide-react"

type Stats = {
  totalQuizAttempts: number
  totalInterviews: number
  totalAnalyses: number
  averageQuizPercent: number | null
  bestQuizPercent: number | null
  perfectScoreCount: number
  streakDays: number
}

type Props = { stats: Stats }

type Achievement = {
  icon: React.ElementType
  title: string
  description: string
  unlocked: boolean
  color: string
  border: string
  iconColor: string
}

function buildAchievements(stats: Stats): Achievement[] {
  return [
    {
      icon: FileText,
      title: "CV Tiên Phong",
      description: "Hoàn thành phân tích CV đầu tiên",
      unlocked: stats.totalAnalyses >= 1,
      color: "from-emerald-500/10 to-teal-500/5 dark:from-emerald-950/20 dark:to-teal-950/10",
      border: "border-emerald-200 dark:border-emerald-500/30",
      iconColor: "text-emerald-500 dark:text-emerald-400",
    },
    {
      icon: Brain,
      title: "Tập Sự Quiz",
      description: "Hoàn thành bài quiz đầu tiên",
      unlocked: stats.totalQuizAttempts >= 1,
      color: "from-purple-500/10 to-pink-500/5 dark:from-purple-950/20 dark:to-pink-950/10",
      border: "border-purple-200 dark:border-purple-500/30",
      iconColor: "text-purple-500 dark:text-purple-400",
    },
    {
      icon: Mic,
      title: "Thử Lửa Phỏng Vấn",
      description: "Hoàn thành mock interview đầu tiên",
      unlocked: stats.totalInterviews >= 1,
      color: "from-blue-500/10 to-indigo-500/5 dark:from-blue-950/20 dark:to-indigo-950/10",
      border: "border-blue-200 dark:border-blue-500/30",
      iconColor: "text-blue-500 dark:text-blue-400",
    },
    {
      icon: Flame,
      title: "Bán Chuyên Cần",
      description: "Duy trì streak 3 ngày liên tiếp",
      unlocked: stats.streakDays >= 3,
      color: "from-orange-500/10 to-amber-500/5 dark:from-orange-950/20 dark:to-amber-950/10",
      border: "border-orange-200 dark:border-orange-500/30",
      iconColor: "text-orange-500 dark:text-orange-400",
    },
    {
      icon: Medal,
      title: "Bậc Thầy Kiên Trì",
      description: "Duy trì streak 7 ngày liên tiếp",
      unlocked: stats.streakDays >= 7,
      color: "from-red-500/10 to-rose-500/5 dark:from-red-950/20 dark:to-rose-950/10",
      border: "border-red-200 dark:border-red-500/30",
      iconColor: "text-rose-500 dark:text-rose-450",
    },
    {
      icon: Sparkles,
      title: "Điểm Tuyệt Đối",
      description: "Đạt điểm 100% trong một bài quiz",
      unlocked: stats.perfectScoreCount > 0,
      color: "from-pink-500/10 to-rose-500/5 dark:from-pink-950/20 dark:to-rose-950/10",
      border: "border-pink-200 dark:border-pink-500/30",
      iconColor: "text-pink-500 dark:text-pink-400",
    },
    {
      icon: Briefcase,
      title: "Ứng Viên Thực Thụ",
      description: "Phân tích 5 hồ sơ khác nhau",
      unlocked: stats.totalAnalyses >= 5,
      color: "from-amber-500/10 to-orange-500/5 dark:from-amber-950/20 dark:to-amber-950/10",
      border: "border-amber-200 dark:border-amber-500/30",
      iconColor: "text-amber-500 dark:text-amber-450",
    },
    {
      icon: BadgeCheck,
      title: "Vượt Trội Quiz",
      description: "Đạt điểm quiz trên 90%",
      unlocked: (stats.bestQuizPercent ?? 0) >= 90,
      color: "from-indigo-500/10 to-cyan-500/5 dark:from-indigo-950/20 dark:to-cyan-950/10",
      border: "border-indigo-200 dark:border-indigo-500/30",
      iconColor: "text-indigo-500 dark:text-indigo-400",
    },
  ]
}

export function AchievementsSection({ stats }: Props) {
  const achievements = buildAchievements(stats)
  const unlocked = achievements.filter(a => a.unlocked).length

  return (
    <section className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-bold text-slate-800 dark:text-white flex items-center gap-2">
            <Trophy className="h-4.5 w-4.5 text-amber-500 fill-amber-500 stroke-[1.8]" />
            Thành tích học tập
          </h2>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
            Mở khóa các huy chương bằng cách tích cực luyện tập
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <span className="text-xs font-bold text-slate-650 dark:text-slate-300">
            {unlocked} / {achievements.length} Đã đạt
          </span>
          <div className="h-2 w-28 overflow-hidden rounded-full bg-slate-100 dark:bg-white/5">
            <motion.div
              initial={{ width: "0%" }}
              animate={{ width: `${(unlocked / achievements.length) * 100}%` }}
              transition={{ duration: 0.8, ease: "easeOut", delay: 0.3 }}
              className="h-full rounded-full bg-gradient-to-r from-amber-500 to-rose-500"
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {achievements.map((ach, i) => {
          const Icon = ach.icon
          return (
            <motion.div
              key={ach.title}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.04 * i, duration: 0.3 }}
              whileHover={{ y: -2, transition: { duration: 0.15 } }}
            >
              <div
                className={`relative flex items-center gap-3.5 rounded-2xl border p-4 h-full transition-all duration-200
                  ${ach.unlocked
                    ? `bg-gradient-to-br ${ach.color} ${ach.border} shadow-sm`
                    : "border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-white/2 opacity-55 grayscale-[40%]"
                  }`}
              >
                {ach.unlocked && (
                  <div className="absolute top-2 right-2 flex h-4.5 w-4.5 items-center justify-center rounded-full bg-emerald-500 text-white shadow-sm">
                    <Check className="h-3 w-3" strokeWidth={3} />
                  </div>
                )}
                {!ach.unlocked && (
                  <div className="absolute top-2 right-2 text-slate-350 dark:text-slate-600">
                    <Lock className="h-3 w-3.5" />
                  </div>
                )}

                <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white dark:bg-slate-900 shadow-sm border border-slate-150/40 dark:border-white/5`}>
                  <Icon className={`h-5 w-5 ${ach.iconColor} stroke-[1.8]`} />
                </div>
                <div className="min-w-0 pr-2">
                  <h4 className="text-xs font-bold text-slate-800 dark:text-white leading-tight truncate">
                    {ach.title}
                  </h4>
                  <p className="mt-1 text-[10px] text-slate-550 dark:text-slate-400 leading-normal font-medium">
                    {ach.description}
                  </p>
                </div>
              </div>
            </motion.div>
          )
        })}
      </div>
    </section>
  )
}
