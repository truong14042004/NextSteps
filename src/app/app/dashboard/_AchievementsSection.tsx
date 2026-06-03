"use client"

import { motion } from "framer-motion"

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
  emoji: string
  title: string
  description: string
  unlocked: boolean
  color: string
  border: string
}

function buildAchievements(stats: Stats): Achievement[] {
  return [
    {
      emoji: "📄",
      title: "Phân tích đầu tiên",
      description: "Hoàn thành lần phân tích CV đầu tiên",
      unlocked: stats.totalAnalyses >= 1,
      color: "from-emerald-500/20 to-teal-500/10",
      border: "border-emerald-500/25",
    },
    {
      emoji: "🧠",
      title: "Quiz đầu tiên",
      description: "Hoàn thành bài quiz đầu tiên",
      unlocked: stats.totalQuizAttempts >= 1,
      color: "from-violet-500/20 to-purple-500/10",
      border: "border-violet-500/25",
    },
    {
      emoji: "🎤",
      title: "Phỏng vấn đầu tiên",
      description: "Hoàn thành buổi mock interview đầu tiên",
      unlocked: stats.totalInterviews >= 1,
      color: "from-blue-500/20 to-indigo-500/10",
      border: "border-blue-500/25",
    },
    {
      emoji: "🔥",
      title: "Streak 3 ngày",
      description: "Hoạt động 3 ngày liên tiếp",
      unlocked: stats.streakDays >= 3,
      color: "from-orange-500/20 to-amber-500/10",
      border: "border-orange-500/25",
    },
    {
      emoji: "🔥🔥",
      title: "Streak 7 ngày",
      description: "Hoạt động 7 ngày liên tiếp",
      unlocked: stats.streakDays >= 7,
      color: "from-orange-500/25 to-rose-500/10",
      border: "border-rose-500/25",
    },
    {
      emoji: "⭐",
      title: "Quiz 10 lần",
      description: "Hoàn thành 10 bài quiz",
      unlocked: stats.totalQuizAttempts >= 10,
      color: "from-amber-500/20 to-yellow-500/10",
      border: "border-amber-500/25",
    },
    {
      emoji: "🎯",
      title: "Điểm tuyệt đối",
      description: "Đạt điểm 100% trong một bài quiz",
      unlocked: stats.perfectScoreCount > 0,
      color: "from-rose-500/20 to-pink-500/10",
      border: "border-rose-500/25",
    },
    {
      emoji: "🏆",
      title: "5 CV phân tích",
      description: "Phân tích 5 hồ sơ khác nhau",
      unlocked: stats.totalAnalyses >= 5,
      color: "from-amber-500/20 to-orange-500/10",
      border: "border-amber-500/25",
    },
    {
      emoji: "🚀",
      title: "Quiz 90%+",
      description: "Đạt điểm quiz trên 90%",
      unlocked: (stats.bestQuizPercent ?? 0) >= 90,
      color: "from-indigo-500/20 to-blue-500/10",
      border: "border-indigo-500/25",
    },
  ]
}

export function AchievementsSection({ stats }: Props) {
  const achievements = buildAchievements(stats)
  const unlocked = achievements.filter(a => a.unlocked).length

  return (
    <section>
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Thành tích</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {unlocked}/{achievements.length} đã mở khoá
          </p>
        </div>
        <div className="h-1.5 w-24 overflow-hidden rounded-full bg-slate-100 dark:bg-white/8">
          <motion.div
            initial={{ width: "0%" }}
            animate={{ width: `${(unlocked / achievements.length) * 100}%` }}
            transition={{ duration: 1, ease: "easeOut", delay: 0.3 }}
            className="h-full rounded-full bg-gradient-to-r from-amber-500 to-rose-500"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
        {achievements.map((ach, i) => (
          <motion.div
            key={ach.title}
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.04 * i, duration: 0.35 }}
            whileHover={{ y: -2, transition: { duration: 0.15 } }}
          >
            <div
              className={`relative flex flex-col items-center gap-2 rounded-2xl border p-4 text-center transition-all h-full justify-center
                ${ach.unlocked
                  ? `bg-gradient-to-br ${ach.color.replace("-500/20", "-50/80 dark:$&").replace("-500/25", "-50/80 dark:$&").replace("-500/10", "-100/40 dark:$&")} ${ach.border.replace("-500/25", "-100 dark:$&").replace("-500/20", "-100 dark:$&")} shadow-lg`
                  : "border-slate-200 bg-slate-50/50 dark:border-white/8 dark:bg-white/3 opacity-40 grayscale"
                }`}
            >
              {ach.unlocked && (
                <motion.div
                  animate={{ scale: [1, 1.15, 1] }}
                  transition={{ duration: 2.5, repeat: Infinity, delay: i * 0.3 }}
                  className="absolute inset-0 rounded-2xl bg-gradient-to-br from-white/5 to-transparent pointer-events-none"
                />
              )}

              <span className="text-2xl">{ach.emoji}</span>
              <div>
                <p className="text-xs font-semibold text-slate-800 dark:text-white leading-tight">{ach.title}</p>
                <p className="mt-0.5 text-[10px] text-slate-500 dark:text-slate-400 leading-tight">{ach.description}</p>
              </div>

              {ach.unlocked && (
                <div className="absolute -top-1.5 -right-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-amber-500 text-[9px] text-white font-bold shadow-md">
                  ✓
                </div>
              )}
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  )
}
