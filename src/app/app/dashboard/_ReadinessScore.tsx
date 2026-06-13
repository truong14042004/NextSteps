"use client"

import { motion, useInView } from "framer-motion"
import { useRef } from "react"
import { Award } from "lucide-react"

type Props = {
  score: number          // 0-100
  resumeScore: number
  quizScore: number
  interviewScore: number
  consistencyScore: number
}

const subScores = [
  { key: "resumeScore" as const, label: "Chất lượng CV", color: "#10b981", barClass: "bg-gradient-to-r from-emerald-500 to-teal-400", textColor: "text-emerald-600 dark:text-emerald-400" },
  { key: "quizScore" as const, label: "Kết quả Quiz", color: "#8b5cf6", barClass: "bg-gradient-to-r from-purple-500 to-pink-400", textColor: "text-purple-600 dark:text-purple-400" },
  { key: "interviewScore" as const, label: "Phỏng vấn", color: "#3b82f6", barClass: "bg-gradient-to-r from-blue-500 to-cyan-400", textColor: "text-blue-600 dark:text-blue-400" },
  { key: "consistencyScore" as const, label: "Tính nhất quán", color: "#f97316", barClass: "bg-gradient-to-r from-orange-500 to-amber-400", textColor: "text-orange-600 dark:text-orange-400" },
]

function CircularProgress({ score }: { score: number }) {
  const ref = useRef<SVGCircleElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const inView = useInView(containerRef, { once: true })

  const size = 150
  const strokeWidth = 10
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const dash = (score / 100) * circumference

  const scoreColor =
    score >= 80 ? "#10b981"
    : score >= 60 ? "#3b82f6"
    : score >= 40 ? "#f59e0b"
    : "#ef4444"

  const gradId = "readiness-grad-new"

  return (
    <div ref={containerRef} className="relative mx-auto w-fit">
      <svg width={size} height={size} className="-rotate-90">
        <defs>
          <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#ef4444" />
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
          className="text-4xl font-extrabold tracking-tight"
          style={{ color: scoreColor }}
        >
          {score}
        </motion.span>
        <span className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500 tracking-wider">Điểm sẵn sàng</span>
      </div>
    </div>
  )
}

export function ReadinessScore({ score, resumeScore, quizScore, interviewScore, consistencyScore }: Props) {
  const scores: Record<string, number> = { resumeScore, quizScore, interviewScore, consistencyScore }

  const readinessLabel =
    score >= 80 ? "Sẵn sàng tốt" :
    score >= 60 ? "Đang tiến bộ" :
    score >= 40 ? "Cần cải thiện" : "Mới bắt đầu"

  const labelBg =
    score >= 80 ? "bg-emerald-500/10 border-emerald-550/20 text-emerald-600 dark:text-emerald-450" :
    score >= 60 ? "bg-blue-500/10 border-blue-550/20 text-blue-600 dark:text-blue-450" :
    score >= 40 ? "bg-amber-500/10 border-amber-550/20 text-amber-600 dark:text-amber-450" :
    "bg-red-500/10 border-red-550/20 text-red-600 dark:text-red-450"

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.1 }}
      className="rounded-3xl border border-slate-100 bg-white dark:border-white/5 dark:bg-slate-900/40 p-6 shadow-sm backdrop-blur-sm h-full flex flex-col justify-between"
    >
      <div>
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-rose-500/15">
              <Award className="h-4.5 w-4.5 text-rose-500" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-800 dark:text-white">Career Readiness</h2>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">Đánh giá mức độ chuẩn bị nghề nghiệp</p>
            </div>
          </div>
          <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold border ${labelBg}`}>
            {readinessLabel}
          </span>
        </div>

        {/* Circular chart */}
        <div className="flex justify-center my-6">
          <CircularProgress score={score} />
        </div>
      </div>

      {/* Sub scores */}
      <div className="space-y-3 mt-auto">
        {subScores.map(({ key, label, barClass, textColor }, i) => {
          const val = scores[key] ?? 0
          return (
            <motion.div
              key={key}
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 + i * 0.08 }}
              className="space-y-1"
            >
              <div className="flex justify-between text-xs">
                <span className="text-slate-500 dark:text-slate-400 font-medium">{label}</span>
                <span className={`font-bold ${textColor}`}>{val}%</span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-white/5">
                <motion.div
                  initial={{ width: "0%" }}
                  animate={{ width: `${val}%` }}
                  transition={{ duration: 0.9, ease: "easeOut", delay: 0.5 + i * 0.08 }}
                  className={`h-full rounded-full ${barClass}`}
                />
              </div>
            </motion.div>
          )
        })}
      </div>
    </motion.div>
  )
}
