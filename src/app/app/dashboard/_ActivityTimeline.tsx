"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { BrainCircuit, FileSearch, MessageSquare, ChevronLeft, ChevronRight } from "lucide-react"
import Link from "next/link"

type ActivityItem = {
  kind: string
  jobInfoId: string
  jobName: string
  occurredAt: Date
  refId: string
  detail: string | null
}

type Props = {
  activities: ActivityItem[]
}

function timeAgo(date: Date): string {
  const diff = Date.now() - date.getTime()
  const min = Math.floor(diff / 60_000)
  if (min < 1) return "vừa xong"
  if (min < 60) return `${min} phút trước`
  const hour = Math.floor(min / 60)
  if (hour < 24) return `${hour} giờ trước`
  const day = Math.floor(hour / 24)
  if (day < 7) return `${day} ngày trước`
  return date.toLocaleDateString("vi-VN")
}

function dayKey(date: Date): string {
  const now = new Date()
  const diff = Math.floor((now.setHours(0,0,0,0) - new Date(date).setHours(0,0,0,0)) / 86_400_000)
  if (diff === 0) return "Hôm nay"
  if (diff === 1) return "Hôm qua"
  return `${diff} ngày trước`
}

const kindMeta: Record<string, { label: string; icon: typeof BrainCircuit; color: string; bg: string }> = {
  quiz_attempt: { label: "Nộp Quiz", icon: BrainCircuit, color: "text-violet-400", bg: "bg-violet-500/15 border-violet-500/25" },
  interview:    { label: "Mock Interview", icon: MessageSquare, color: "text-blue-400", bg: "bg-blue-500/15 border-blue-500/25" },
  job_analysis: { label: "Phân tích CV", icon: FileSearch, color: "text-emerald-400", bg: "bg-emerald-500/15 border-emerald-500/25" },
}

function activityHref(a: ActivityItem): string {
  if (a.kind === "quiz_attempt") return `/app/job-infos/${a.jobInfoId}/quizzes`
  return `/app/job-infos/${a.jobInfoId}`
}

export function ActivityTimeline({ activities }: Props) {
  const [activeIndex, setActiveIndex] = useState(0)

  if (activities.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 dark:border-white/10 dark:bg-white/3 py-10 text-center">
        <BrainCircuit className="h-8 w-8 text-slate-400 dark:text-slate-600" />
        <p className="text-sm text-slate-500 dark:text-slate-400">Chưa có hoạt động nào</p>
      </div>
    )
  }

  // Group by day label
  const groups: { day: string; items: ActivityItem[] }[] = []
  for (const a of activities) {
    const day = dayKey(a.occurredAt)
    const last = groups[groups.length - 1]
    if (last && last.day === day) {
      last.items.push(a)
    } else {
      groups.push({ day, items: [a] })
    }
  }

  // Ensure activeIndex is bounded
  const safeActiveIndex = Math.min(activeIndex, groups.length - 1)
  const activeGroup = groups[safeActiveIndex]

  return (
    <div className="space-y-4">
      {/* Navigation Header */}
      <div className="flex items-center justify-between border-b border-slate-100 dark:border-white/5 pb-3">
        <div className="flex flex-col">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Thời gian
          </span>
          <span className="text-sm font-semibold text-slate-800 dark:text-slate-200">
            {activeGroup.day}
          </span>
        </div>
        <div className="flex items-center gap-1 bg-slate-100/80 dark:bg-white/5 p-1 rounded-lg">
          <button
            onClick={() => setActiveIndex(prev => Math.min(groups.length - 1, prev + 1))}
            disabled={safeActiveIndex === groups.length - 1}
            className="p-1.5 rounded-md hover:bg-white dark:hover:bg-white/10 text-slate-600 dark:text-slate-400 disabled:opacity-40 disabled:hover:bg-transparent transition-all"
            title="Ngày trước đó"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <span className="text-xs px-1 text-slate-500 font-medium">
            {safeActiveIndex + 1} / {groups.length}
          </span>
          <button
            onClick={() => setActiveIndex(prev => Math.max(0, prev - 1))}
            disabled={safeActiveIndex === 0}
            className="p-1.5 rounded-md hover:bg-white dark:hover:bg-white/10 text-slate-600 dark:text-slate-400 disabled:opacity-40 disabled:hover:bg-transparent transition-all"
            title="Ngày tiếp theo"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Timeline items for active day */}
      <AnimatePresence mode="wait">
        <motion.div
          key={safeActiveIndex}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.15 }}
          className="relative space-y-2 pl-5"
        >
          {/* Vertical line */}
          <div className="absolute left-1.5 top-0 bottom-2 w-px bg-slate-200 dark:bg-white/8" />

          {activeGroup.items.map((a, ai) => {
            const meta = kindMeta[a.kind] ?? kindMeta.job_analysis
            const Icon = meta.icon

            return (
              <motion.div
                key={`${a.kind}-${a.refId}`}
                initial={{ opacity: 0, x: -6 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: ai * 0.04 }}
              >
                <Link
                  href={activityHref(a)}
                  className="group flex items-start gap-3 rounded-xl border border-transparent hover:border-slate-200 dark:hover:border-white/10 hover:bg-slate-50 dark:hover:bg-white/5 p-2 transition-all -ml-1"
                >
                  {/* Dot */}
                  <div className={`relative z-10 mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border ${meta.bg.replace("-400", "-600 dark:text-$&").replace("dark:text-text-", "dark:text-")}`}>
                    <Icon className={`h-3 w-3 ${meta.color.replace("-400", "-600 dark:text-$&").replace("dark:text-text-", "dark:text-")}`} />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <span className="text-sm font-medium text-slate-800 dark:text-slate-200 truncate">
                        {meta.label} · <span className="text-slate-500 dark:text-slate-400">{a.jobName}</span>
                      </span>
                      <span className="text-xs text-slate-500 shrink-0">{timeAgo(a.occurredAt)}</span>
                    </div>
                    {a.detail && (
                      <p className="mt-0.5 text-xs text-slate-500">{a.detail}</p>
                    )}
                  </div>
                </Link>
              </motion.div>
            )
          })}
        </motion.div>
      </AnimatePresence>
    </div>
  )
}
