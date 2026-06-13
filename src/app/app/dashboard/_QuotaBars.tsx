"use client"

import { motion } from "framer-motion"
import { BrainCircuit, FileSearch, MessageSquare, AlertCircle, ArrowUpCircle } from "lucide-react"
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
    bgClass: "bg-emerald-50/40 dark:bg-emerald-950/10",
    borderClass: "border-emerald-100 dark:border-emerald-500/20",
    iconColor: "text-emerald-650 dark:text-emerald-400",
    barColor: "bg-emerald-500",
    trackColor: "bg-emerald-500/10",
  },
  {
    key: "quotaInterview" as const,
    label: "Mock Interview",
    icon: MessageSquare,
    href: "/app/interview",
    bgClass: "bg-blue-50/40 dark:bg-blue-950/10",
    borderClass: "border-blue-100 dark:border-blue-550/20",
    iconColor: "text-blue-650 dark:text-blue-400",
    barColor: "bg-blue-500",
    trackColor: "bg-blue-500/10",
  },
  {
    key: "quotaQuiz" as const,
    label: "AI Quiz",
    icon: BrainCircuit,
    href: "/app/quizzes",
    bgClass: "bg-purple-50/40 dark:bg-purple-950/10",
    borderClass: "border-purple-100 dark:border-purple-550/20",
    iconColor: "text-purple-650 dark:text-purple-400",
    barColor: "bg-purple-500",
    trackColor: "bg-purple-500/10",
  },
]

export function QuotaBars({ quotaResume, quotaQuestion, quotaInterview, quotaQuiz }: Props) {
  const summaries = { quotaResume, quotaQuestion, quotaInterview, quotaQuiz }

  // Check if all quotas are null or empty
  const hasData = QUOTA_CONFIG.some(({ key }) => summaries[key] !== null)

  if (!hasData) {
    return (
      <section className="space-y-3">
        <h2 className="text-sm font-bold text-slate-800 dark:text-white">Lượt sử dụng</h2>
        <div className="flex items-center gap-2 p-4 rounded-2xl border border-slate-100 bg-slate-50 dark:bg-slate-900/40 dark:border-white/5">
          <AlertCircle className="h-4.5 w-4.5 text-slate-400" />
          <span className="text-xs text-slate-500 dark:text-slate-400">Không có dữ liệu giới hạn sử dụng.</span>
        </div>
      </section>
    )
  }

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-bold text-slate-800 dark:text-white">Lượt sử dụng còn lại</h2>
          <p className="text-[11px] text-slate-550 dark:text-slate-400">Hạn mức các tính năng trong tháng này</p>
        </div>
        <Link href="/#pricing" className="flex items-center gap-1 text-xs text-rose-500 hover:text-rose-600 font-bold transition-colors">
          <ArrowUpCircle className="h-3.5 w-3.5" />
          Nâng cấp gói
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {QUOTA_CONFIG.map(({ key, label, icon: Icon, href, bgClass, borderClass, iconColor, barColor, trackColor }, i) => {
          const summary = summaries[key]
          if (!summary) return null

          const unlimited = summary.total == null
          const percentUsed = !unlimited && summary.total! > 0
            ? Math.min(100, Math.round((summary.used / summary.total!) * 100))
            : 0
          const remaining = summary.remaining ?? 0
          const isLow = !unlimited && summary.total! > 0 && remaining <= 2
          const isCritical = !unlimited && summary.total! > 0 && remaining === 0

          return (
            <motion.div
              key={key}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 * i, duration: 0.35 }}
              whileHover={{ y: -2, transition: { duration: 0.15 } }}
              className="flex"
            >
              <Link href={href} className="w-full flex">
                <div className={`relative w-full flex flex-col justify-between overflow-hidden rounded-2xl border ${borderClass} ${bgClass} p-4 shadow-sm backdrop-blur-sm transition-all hover:shadow-md`}>
                  {isCritical && (
                    <div className="absolute inset-0 rounded-2xl ring-1 ring-red-500/25 animate-pulse pointer-events-none" />
                  )}

                  <div>
                    <div className="flex items-center justify-between gap-3 mb-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-white dark:bg-slate-900 shadow-sm border border-slate-100 dark:border-white/5">
                        <Icon className={`h-4.5 w-4.5 ${iconColor}`} />
                      </div>

                      {isCritical ? (
                        <span className="rounded-full bg-red-500/10 border border-red-500/20 px-2 py-0.5 text-[9px] font-bold text-red-600 dark:text-red-400">
                          Hết lượt
                        </span>
                      ) : isLow ? (
                        <span className="rounded-full bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 text-[9px] font-bold text-amber-600 dark:text-amber-400">
                          Sắp hết
                        </span>
                      ) : null}
                    </div>

                    <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">{label}</p>
                    <div className="flex items-baseline gap-1 mt-1">
                      <span className="text-xl font-black text-slate-800 dark:text-white">
                        {unlimited ? "Không giới hạn" : remaining}
                      </span>
                      {!unlimited && (
                        <span className="text-xs text-slate-400">/ {summary.total}</span>
                      )}
                    </div>
                  </div>

                  {!unlimited && (
                    <div className="mt-3.5">
                      <div className={`h-1.5 w-full rounded-full ${trackColor} overflow-hidden`}>
                        <motion.div
                          initial={{ width: "0%" }}
                          animate={{ width: `${percentUsed}%` }}
                          transition={{ duration: 0.8, ease: "easeOut", delay: 0.2 }}
                          className={`h-full rounded-full ${barColor} ${isCritical ? "bg-red-500" : ""}`}
                        />
                      </div>
                      <div className="mt-1.5 flex justify-between items-center text-[9px] text-slate-400 dark:text-slate-500 font-medium">
                        <span>Đã dùng {percentUsed}%</span>
                        <span>{summary.resetText}</span>
                      </div>
                    </div>
                  )}

                  {unlimited && (
                    <p className="mt-4 text-[9px] text-slate-400 dark:text-slate-500 font-medium">
                      Tính năng không giới hạn sử dụng
                    </p>
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
