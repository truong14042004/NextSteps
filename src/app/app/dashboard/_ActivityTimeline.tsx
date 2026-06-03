"use client"

import { motion } from "framer-motion"
import { BrainCircuit, FileSearch, MessageSquare } from "lucide-react"
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

  return (
    <div className="space-y-6">
      {groups.map((group, gi) => (
        <div key={group.day}>
          {/* Day label */}
          <motion.div
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: gi * 0.06 }}
            className="mb-3 flex items-center gap-2"
          >
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">{group.day}</span>
            <div className="flex-1 h-px bg-slate-200 dark:bg-white/8" />
          </motion.div>

          {/* Timeline items */}
          <div className="relative space-y-2 pl-5">
            {/* Vertical line */}
            <div className="absolute left-1.5 top-0 bottom-2 w-px bg-slate-200 dark:bg-white/8" />

            {group.items.map((a, ai) => {
              const meta = kindMeta[a.kind] ?? kindMeta.job_analysis
              const Icon = meta.icon

              return (
                <motion.div
                  key={`${a.kind}-${a.refId}`}
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: gi * 0.06 + ai * 0.05 }}
                >
                  <Link href={activityHref(a)} className="group flex items-start gap-3 rounded-xl border border-transparent hover:border-slate-200 dark:hover:border-white/10 hover:bg-slate-50 dark:hover:bg-white/5 p-2 transition-all -ml-1">
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
          </div>
        </div>
      ))}
    </div>
  )
}
