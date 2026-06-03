"use client"

import { motion, useInView } from "framer-motion"
import { useRef } from "react"

type Props = {
  score: number          // 0-100
  resumeScore: number
  quizScore: number
  interviewScore: number
  consistencyScore: number
}

const subScores = [
  { key: "resumeScore" as const, label: "Chất lượng CV", color: "#10b981", bg: "bg-emerald-500/10 border-emerald-500/20", textColor: "text-emerald-400" },
  { key: "quizScore" as const, label: "Kết quả Quiz", color: "#8b5cf6", bg: "bg-violet-500/10 border-violet-500/20", textColor: "text-violet-400" },
  { key: "interviewScore" as const, label: "Phỏng vấn", color: "#3b82f6", bg: "bg-blue-500/10 border-blue-500/20", textColor: "text-blue-400" },
  { key: "consistencyScore" as const, label: "Tính nhất quán", color: "#f97316", bg: "bg-orange-500/10 border-orange-500/20", textColor: "text-orange-400" },
]

function CircularProgress({ score }: { score: number }) {
  const ref = useRef<SVGCircleElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const inView = useInView(containerRef, { once: true })

  const size = 160
  const strokeWidth = 12
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const dash = (score / 100) * circumference

  const scoreColor =
    score >= 75 ? "#10b981"
    : score >= 50 ? "#f97316"
    : "#f43f5e"

  const gradId = "readiness-grad"

  return (
    <div ref={containerRef} className="relative mx-auto w-fit">
      <svg width={size} height={size} className="-rotate-90">
        <defs>
          <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#f43f5e" />
            <stop offset="50%" stopColor="#8b5cf6" />
            <stop offset="100%" stopColor="#10b981" />
          </linearGradient>
        </defs>
        {/* Track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          className="text-slate-100 dark:text-white/5"
          strokeWidth={strokeWidth}
        />
        {/* Progress */}
        <motion.circle
          ref={ref}
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={`url(#${gradId})`}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={inView ? { strokeDashoffset: circumference - dash } : {}}
          transition={{ duration: 1.4, ease: "easeOut", delay: 0.2 }}
        />
      </svg>

      {/* Center text */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <motion.span
          initial={{ opacity: 0, scale: 0.5 }}
          animate={inView ? { opacity: 1, scale: 1 } : {}}
          transition={{ duration: 0.5, delay: 0.8 }}
          className="text-4xl font-bold"
          style={{ color: scoreColor }}
        >
          {score}
        </motion.span>
        <span className="text-xs text-slate-500 dark:text-slate-400">/ 100</span>
      </div>
    </div>
  )
}

export function ReadinessScore({ score, resumeScore, quizScore, interviewScore, consistencyScore }: Props) {
  const scores: Record<string, number> = { resumeScore, quizScore, interviewScore, consistencyScore }

  const readinessLabel =
    score >= 80 ? "Sẵn sàng cao" :
    score >= 60 ? "Đang tiến bộ" :
    score >= 40 ? "Cần cải thiện" : "Mới bắt đầu"

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.1 }}
      className="rounded-2xl border border-slate-200 bg-white dark:border-white/10 dark:bg-white/5 p-6 backdrop-blur-sm shadow-xl h-full"
    >
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold text-slate-900 dark:text-white">Điểm sẵn sàng nghề nghiệp</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Dựa trên hoạt động thực tế của bạn</p>
        </div>
        <span className={`rounded-full px-2.5 py-1 text-xs font-medium border
          ${score >= 80 ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400" :
            score >= 60 ? "bg-blue-500/10 border-blue-500/20 text-blue-600 dark:text-blue-400" :
            score >= 40 ? "bg-amber-500/10 border-amber-500/20 text-amber-600 dark:text-amber-400" :
            "bg-slate-500/10 border-slate-500/20 text-slate-500 dark:text-slate-400"}`}
        >
          {readinessLabel}
        </span>
      </div>

      {/* Circular chart */}
      <div className="flex justify-center my-4">
        <CircularProgress score={score} />
      </div>

      {/* Sub scores */}
      <div className="mt-4 space-y-3">
        {subScores.map(({ key, label, bg, textColor }, i) => {
          const val = scores[key] ?? 0
          return (
            <motion.div
              key={key}
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.6 + i * 0.08 }}
              className="space-y-1"
            >
              <div className="flex justify-between text-xs">
                <span className="text-slate-500 dark:text-slate-400">{label}</span>
                <span className={`font-semibold ${textColor.replace("text-", "text-").replace("-400", "-600 dark:text-$&").replace("dark:text-text-", "dark:text-")}`}>{val}%</span>
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-white/8">
                <motion.div
                  initial={{ width: "0%" }}
                  animate={{ width: `${val}%` }}
                  transition={{ duration: 0.9, ease: "easeOut", delay: 0.7 + i * 0.08 }}
                  className={`h-full rounded-full ${textColor.replace("text-", "bg-").replace("-400", "-500")}`}
                />
              </div>
            </motion.div>
          )
        })}
      </div>
    </motion.div>
  )
}
