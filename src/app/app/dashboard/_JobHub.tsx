"use client"

import { motion } from "framer-motion"
import { BrainCircuit, FileSearch, MessageSquare, Plus } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"

type Job = {
  id: string
  name: string
  title: string | null
  quizCount: number
  interviewCount: number
  bestQuizScore: number | null
  bestQuizTotal: number | null
  lastActivityAt: Date
}

type Props = {
  jobs: Job[]
}

function readinessFromJob(job: Job): number {
  let score = 0
  if (job.quizCount > 0) score += 40
  if (job.interviewCount > 0) score += 40
  if (job.bestQuizScore != null && job.bestQuizTotal != null) {
    const pct = (job.bestQuizScore / job.bestQuizTotal) * 100
    score = Math.min(100, Math.round(score * (pct / 100) + pct * 0.2))
  }
  return Math.min(score, 100)
}

function readinessColor(pct: number) {
  if (pct >= 75) return { pill: "bg-emerald-500/15 border-emerald-500/25 text-emerald-400", bar: "bg-emerald-500" }
  if (pct >= 45) return { pill: "bg-blue-500/15 border-blue-500/25 text-blue-400", bar: "bg-blue-500" }
  return { pill: "bg-slate-500/15 border-slate-500/20 text-slate-400", bar: "bg-slate-500" }
}

export function JobHub({ jobs }: Props) {
  if (jobs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 dark:border-white/15 dark:bg-white/3 py-12 text-center">
        <FileSearch className="h-10 w-10 text-slate-400 dark:text-slate-600" />
        <div>
          <p className="font-medium text-slate-800 dark:text-white">Chưa có vị trí nào</p>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Bắt đầu bằng cách phân tích CV theo một Job Description.</p>
        </div>
        <Button asChild size="sm" className="rounded-xl bg-rose-600 text-white border-0 hover:bg-rose-500">
          <Link href="/app/analyze">
            <Plus className="mr-1.5 h-3.5 w-3.5" />
            Phân tích CV đầu tiên
          </Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {jobs.map((job, i) => {
        const readiness = readinessFromJob(job)
        const { pill, bar } = readinessColor(readiness)
        const bestPct = job.bestQuizScore != null && job.bestQuizTotal != null
          ? Math.round((job.bestQuizScore / job.bestQuizTotal) * 100)
          : null

        return (
          <motion.div
            key={job.id}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.06 * i, duration: 0.4 }}
            whileHover={{ y: -2, transition: { duration: 0.2 } }}
          >
            <Link href={`/app/job-infos/${job.id}`} className="block h-full">
              <div className="group relative h-full rounded-2xl border border-slate-200 bg-white dark:border-white/10 dark:bg-white/5 p-5 shadow-lg backdrop-blur-sm transition-all hover:border-slate-300 dark:hover:border-white/20 hover:bg-slate-50 dark:hover:bg-white/8 hover:shadow-xl">
                {/* Top */}
                <div className="flex items-start justify-between gap-3 mb-4">
                  <div className="min-w-0">
                    <h3 className="font-semibold text-slate-800 dark:text-white truncate">{job.name}</h3>
                    {job.title && (
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 truncate">{job.title}</p>
                    )}
                  </div>
                  <span className={`shrink-0 rounded-full border px-2.5 py-1 text-xs font-semibold ${pill.replace("-400", "-600 dark:text-$&").replace("dark:text-text-", "dark:text-")}`}>
                    {readiness}%
                  </span>
                </div>

                {/* Stats row */}
                <div className="flex items-center gap-3 mb-4">
                  <div className="flex items-center gap-1.5 rounded-lg bg-slate-50/80 dark:bg-white/5 border border-slate-200 dark:border-white/8 px-2.5 py-1.5 text-xs">
                    <BrainCircuit className="h-3 w-3 text-violet-500 dark:text-violet-400" />
                    <span className="text-slate-600 dark:text-slate-300">{job.quizCount} quiz</span>
                  </div>
                  <div className="flex items-center gap-1.5 rounded-lg bg-slate-50/80 dark:bg-white/5 border border-slate-200 dark:border-white/8 px-2.5 py-1.5 text-xs">
                    <MessageSquare className="h-3 w-3 text-blue-500 dark:text-blue-400" />
                    <span className="text-slate-600 dark:text-slate-300">{job.interviewCount} phỏng vấn</span>
                  </div>
                  {bestPct != null && (
                    <div className="flex items-center gap-1.5 rounded-lg bg-slate-50/80 dark:bg-white/5 border border-slate-200 dark:border-white/8 px-2.5 py-1.5 text-xs">
                      <span className="text-emerald-600 dark:text-emerald-400 font-medium">Best {bestPct}%</span>
                    </div>
                  )}
                </div>

                {/* Readiness bar */}
                <div className="space-y-1">
                  <div className="flex justify-between text-[10px] text-slate-450 dark:text-slate-500">
                    <span>Mức độ sẵn sàng</span>
                    <span>{readiness}%</span>
                  </div>
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-white/8">
                    <motion.div
                      initial={{ width: "0%" }}
                      animate={{ width: `${readiness}%` }}
                      transition={{ duration: 0.9, ease: "easeOut", delay: 0.1 + i * 0.06 }}
                      className={`h-full rounded-full ${bar}`}
                    />
                  </div>
                </div>
              </div>
            </Link>
          </motion.div>
        )
      })}

      {/* Add new position card */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.06 * jobs.length, duration: 0.4 }}
      >
        <Link href="/app/analyze" className="group flex h-full min-h-[140px] flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 dark:border-white/10 dark:bg-white/3 p-5 text-center transition-all hover:border-rose-500/30 hover:bg-rose-500/5 hover:border-solid hover:shadow-md">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white dark:border-white/10 dark:bg-white/5 shadow-sm dark:shadow-none transition-all group-hover:bg-rose-500/15 group-hover:border-rose-500/30">
            <Plus className="h-4.5 w-4.5 text-slate-400 group-hover:text-rose-400 transition-colors" />
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400 group-hover:text-slate-700 dark:group-hover:text-slate-300 transition-colors">Thêm vị trí mới</p>
        </Link>
      </motion.div>
    </div>
  )
}
