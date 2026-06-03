"use client"

import { motion } from "framer-motion"
import { BrainCircuit, FileSearch, MessageSquare, Zap } from "lucide-react"
import Link from "next/link"

type QuotaSummary = {
  used: number
  total: number | null
  remaining: number | null
  featureLabel: string
  resetText: string
} | null

type Props = {
  quotaResume: QuotaSummary
  quotaQuestion: QuotaSummary
  quotaInterview: QuotaSummary
  quotaQuiz: QuotaSummary
}

const QUOTA_CONFIG = [
  {
    key: "quotaResume" as const,
    label: "Phân tích CV",
    icon: FileSearch,
    href: "/app/analyze",
    gradient: "from-emerald-50/60 to-teal-50/40 dark:from-emerald-500/20 dark:to-teal-500/10",
    border: "border-emerald-100 dark:border-emerald-500/20",
    iconColor: "text-emerald-600 dark:text-emerald-400",
    barColor: "bg-emerald-500",
    trackColor: "bg-emerald-500/15",
  },
  {
    key: "quotaQuestion" as const,
    label: "Câu hỏi AI",
    icon: Zap,
    href: "/app/quizzes",
    gradient: "from-amber-50/60 to-yellow-50/40 dark:from-amber-500/20 dark:to-yellow-500/10",
    border: "border-amber-100 dark:border-amber-500/20",
    iconColor: "text-amber-600 dark:text-amber-400",
    barColor: "bg-amber-500",
    trackColor: "bg-amber-500/15",
  },
  {
    key: "quotaInterview" as const,
    label: "Mock Interview",
    icon: MessageSquare,
    href: "/app/interview",
    gradient: "from-blue-50/60 to-indigo-50/40 dark:from-blue-500/20 dark:to-indigo-500/10",
    border: "border-blue-100 dark:border-blue-500/20",
    iconColor: "text-blue-600 dark:text-blue-400",
    barColor: "bg-blue-500",
    trackColor: "bg-blue-500/15",
  },
  {
    key: "quotaQuiz" as const,
    label: "AI Quiz",
    icon: BrainCircuit,
    href: "/app/quizzes",
    gradient: "from-violet-50/60 to-purple-50/40 dark:from-violet-500/20 dark:to-purple-500/10",
    border: "border-violet-100 dark:border-violet-500/20",
    iconColor: "text-violet-600 dark:text-violet-400",
    barColor: "bg-violet-500",
    trackColor: "bg-violet-500/15",
  },
]

export function QuotaBars({ quotaResume, quotaQuestion, quotaInterview, quotaQuiz }: Props) {
  const summaries = { quotaResume, quotaQuestion, quotaInterview, quotaQuiz }

  return (
    <section>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Lượt sử dụng</h2>
        <Link href="/app/upgrade" className="text-xs text-rose-500 hover:text-rose-600 dark:text-rose-400 dark:hover:text-rose-300 transition-colors font-medium">
          Nâng cấp →
        </Link>
      </div>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {QUOTA_CONFIG.map(({ key, label, icon: Icon, href, gradient, border, iconColor, barColor, trackColor }, i) => {
          const summary = summaries[key]
          if (!summary) return null

          const unlimited = summary.total == null
          const percentUsed = !unlimited && summary.total! > 0
            ? Math.min(100, Math.round((summary.used / summary.total!) * 100))
            : 0
          const remaining = summary.remaining ?? 0
          const isLow = !unlimited && summary.total! > 0 && remaining / summary.total! < 0.3
          const isCritical = !unlimited && summary.total! > 0 && remaining / summary.total! < 0.1

          return (
            <motion.div
              key={key}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 * i, duration: 0.4 }}
              whileHover={{ y: -2, transition: { duration: 0.2 } }}
            >
              <Link href={href} className="block h-full">
                <div className={`relative h-full overflow-hidden rounded-2xl border ${border} bg-gradient-to-br ${gradient} p-4 shadow-lg backdrop-blur-sm transition-all hover:shadow-xl`}>
                  {/* Low usage warning glow */}
                  {isCritical && (
                    <div className="absolute inset-0 rounded-2xl ring-1 ring-red-500/40 animate-pulse pointer-events-none" />
                  )}

                  <div className="flex items-start justify-between mb-3">
                    <div className={`flex h-9 w-9 items-center justify-center rounded-xl bg-white dark:bg-white/10 shadow-sm dark:shadow-none`}>
                      <Icon className={`h-4.5 w-4.5 ${iconColor}`} />
                    </div>
                    {isCritical ? (
                      <span className="rounded-full bg-red-500/15 border border-red-500/30 px-2 py-0.5 text-[10px] font-semibold text-red-600 dark:text-red-400">
                        Sắp hết
                      </span>
                    ) : isLow ? (
                      <span className="rounded-full bg-amber-500/15 border border-amber-500/30 px-2 py-0.5 text-[10px] font-semibold text-amber-600 dark:text-amber-400">
                        Còn ít
                      </span>
                    ) : null}
                  </div>

                  <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">{label}</p>
                  <div className="flex items-baseline gap-1">
                    <span className="text-2xl font-bold text-slate-900 dark:text-white">
                      {unlimited ? "∞" : remaining}
                    </span>
                    {!unlimited && (
                      <span className="text-xs text-slate-400 dark:text-slate-500">/ {summary.total}</span>
                    )}
                  </div>

                  {!unlimited && (
                    <div className="mt-3">
                      <div className={`h-1.5 w-full rounded-full ${trackColor} overflow-hidden`}>
                        <motion.div
                          initial={{ width: "0%" }}
                          animate={{ width: `${percentUsed}%` }}
                          transition={{ duration: 0.9, ease: "easeOut", delay: 0.2 + 0.05 * i }}
                          className={`h-full rounded-full ${barColor} ${isCritical ? "bg-red-500" : ""}`}
                        />
                      </div>
                      <p className="mt-1.5 text-[10px] text-slate-400 dark:text-slate-500">
                        {unlimited ? "Không giới hạn" : summary.resetText}
                      </p>
                    </div>
                  )}
                </div>
              </Link>
            </motion.div>
          )
        })}
      </div>
    </section>
  )
}
