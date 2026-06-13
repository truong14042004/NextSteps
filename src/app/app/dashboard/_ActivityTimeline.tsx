"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { BrainCircuit, FileSearch, MessageSquare, ChevronLeft, ChevronRight, ChevronDown, ChevronUp } from "lucide-react"
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
  const diff = Date.now() - new Date(date).getTime()
  const min = Math.floor(diff / 60_000)
  if (min < 1) return "vừa xong"
  if (min < 60) return `${min} phút trước`
  const hour = Math.floor(min / 60)
  if (hour < 24) return `${hour} giờ trước`
  const day = Math.floor(hour / 24)
  if (day < 7) return `${day} ngày trước`
  return new Date(date).toLocaleDateString("vi-VN")
}

function dayKey(date: Date): string {
  const now = new Date()
  const diff = Math.floor((now.setHours(0, 0, 0, 0) - new Date(date).setHours(0, 0, 0, 0)) / 86_400_000)
  if (diff === 0) return "Hôm nay"
  if (diff === 1) return "Hôm qua"
  return `${diff} ngày trước`
}

const kindMeta: Record<string, { label: string; icon: typeof BrainCircuit; color: string; bg: string }> = {
  quiz_attempt: { label: "Nộp Quiz", icon: BrainCircuit, color: "text-purple-500", bg: "bg-purple-50 dark:bg-purple-950/20 border-purple-100 dark:border-purple-500/20" },
  interview: { label: "Mock Interview", icon: MessageSquare, color: "text-blue-500", bg: "bg-blue-50 dark:bg-blue-950/20 border-blue-100 dark:border-blue-500/20" },
  job_analysis: { label: "Phân tích CV", icon: FileSearch, color: "text-emerald-500", bg: "bg-emerald-50 dark:bg-emerald-950/20 border-emerald-100 dark:border-emerald-500/20" },
}

function activityHref(a: ActivityItem): string {
  if (a.kind === "quiz_attempt") return `/app/job-infos/${a.jobInfoId}/quizzes`
  return `/app/job-infos/${a.jobInfoId}`
}

export function ActivityTimeline({ activities }: Props) {
  const [activeIndex, setActiveIndex] = useState(0)
  const [isCollapsed, setIsCollapsed] = useState(false)

  if (activities.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 dark:border-white/10 dark:bg-white/3 py-10 text-center">
        <BrainCircuit className="h-8 w-8 text-slate-400 dark:text-slate-655" />
        <p className="text-xs text-slate-500 dark:text-slate-400">Chưa có hoạt động nào</p>
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

  const safeActiveIndex = Math.min(activeIndex, groups.length - 1)
  const activeGroup = groups[safeActiveIndex]

  return (
    <div className="space-y-4">
      {/* Navigation Header with Back/Forth buttons for days */}
      <div className="flex items-center justify-between border-b border-slate-100 dark:border-white/5 pb-3">
        <div className="flex flex-col">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Thời gian
          </span>
          <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
            {activeGroup.day}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Day Navigation */}
          <div className="flex items-center gap-1 bg-slate-100/80 dark:bg-white/5 p-1 rounded-xl">
            <button
              onClick={() => setActiveIndex(prev => Math.min(groups.length - 1, prev + 1))}
              disabled={safeActiveIndex === groups.length - 1}
              className="p-1 rounded-lg hover:bg-white dark:hover:bg-white/10 text-slate-600 dark:text-slate-400 disabled:opacity-30 disabled:hover:bg-transparent transition-all"
              title="Ngày trước đó"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="text-[10px] px-1 text-slate-500 font-bold">
              {safeActiveIndex + 1}/{groups.length}
            </span>
            <button
              onClick={() => setActiveIndex(prev => Math.max(0, prev - 1))}
              disabled={safeActiveIndex === 0}
              className="p-1 rounded-lg hover:bg-white dark:hover:bg-white/10 text-slate-600 dark:text-slate-400 disabled:opacity-30 disabled:hover:bg-transparent transition-all"
              title="Ngày tiếp theo"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          {/* Collapse/Expand Toggle */}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-1.5 rounded-lg border border-slate-100 dark:border-white/5 hover:bg-slate-50 dark:hover:bg-slate-900/30 text-slate-600 dark:text-slate-400 transition-all"
            title={isCollapsed ? "Mở rộng" : "Thu gọn"}
          >
            {isCollapsed ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {/* Timeline items for active day */}
      <AnimatePresence mode="wait">
        {!isCollapsed && (
          <motion.div
            key={safeActiveIndex}
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="relative space-y-3 pl-5 overflow-hidden"
          >
            {/* Vertical line */}
            <div className="absolute left-2.5 top-2.5 bottom-2.5 w-0.5 border-l-2 border-dashed border-slate-200 dark:border-white/10" />

            {activeGroup.items.map((a, ai) => {
              const meta = kindMeta[a.kind] ?? kindMeta.job_analysis
              const Icon = meta.icon

              return (
                <motion.div
                  key={`${a.kind}-${a.refId}-${ai}`}
                  initial={{ opacity: 0, x: -6 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: ai * 0.04 }}
                >
                  <Link
                    href={activityHref(a)}
                    className="group flex items-start gap-3 rounded-2xl border border-transparent hover:border-slate-100 dark:hover:border-white/5 hover:bg-slate-50/60 dark:hover:bg-slate-900/40 p-2 transition-all -ml-2"
                  >
                    {/* Dot */}
                    <div className={`relative z-10 mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border shadow-sm ${meta.bg}`}>
                      <Icon className={`h-3.5 w-3.5 ${meta.color}`} />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-bold text-slate-800 dark:text-white truncate">
                          {meta.label} · <span className="text-slate-500 dark:text-slate-400 font-medium">{a.jobName}</span>
                        </span>
                        <span
                          suppressHydrationWarning
                          className="text-[10px] text-slate-450 dark:text-slate-500 font-medium shrink-0"
                        >
                          {timeAgo(a.occurredAt)}
                        </span>
                      </div>
                      {a.detail && (
                        <p className="mt-0.5 text-[10px] text-slate-500 truncate">{a.detail}</p>
                      )}
                    </div>
                  </Link>
                </motion.div>
              )
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
