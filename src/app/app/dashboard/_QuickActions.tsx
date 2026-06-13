"use client"

import { motion } from "framer-motion"
import { FileSearch, BrainCircuit, MessageSquare, ArrowRight } from "lucide-react"
import Link from "next/link"

const ACTIONS = [
  {
    title: "Phân tích CV",
    description: "Tối ưu hóa CV của bạn theo chuẩn ATS bằng AI",
    href: "/app/analyze",
    icon: FileSearch,
    bg: "bg-emerald-50/70 hover:bg-emerald-100/50 dark:bg-emerald-950/20 dark:hover:bg-emerald-950/30",
    border: "border-emerald-100 dark:border-emerald-500/20",
    textColor: "text-emerald-700 dark:text-emerald-400",
    iconBg: "bg-emerald-550/10 dark:bg-emerald-450/20 text-emerald-600 dark:text-emerald-400",
    delay: 0.1,
  },
  {
    title: "Tạo Quiz AI",
    description: "Kiểm tra kiến thức cốt lõi nhanh chóng",
    href: "/app/quizzes",
    icon: BrainCircuit,
    bg: "bg-purple-50/70 hover:bg-purple-100/50 dark:bg-purple-950/20 dark:hover:bg-purple-950/30",
    border: "border-purple-100 dark:border-purple-500/20",
    textColor: "text-purple-700 dark:text-purple-400",
    iconBg: "bg-purple-550/10 dark:bg-purple-450/20 text-purple-600 dark:text-purple-400",
    delay: 0.2,
  },
  {
    title: "Mock Interview",
    description: "Phỏng vấn AI thoại trực tiếp thời gian thực",
    href: "/app/interview",
    icon: MessageSquare,
    bg: "bg-blue-50/70 hover:bg-blue-100/50 dark:bg-blue-950/20 dark:hover:bg-blue-950/30",
    border: "border-blue-100 dark:border-blue-500/20",
    textColor: "text-blue-700 dark:text-blue-400",
    iconBg: "bg-blue-550/10 dark:bg-blue-450/20 text-blue-600 dark:text-blue-400",
    delay: 0.3,
  },
]

export function QuickActions() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {ACTIONS.map((action) => {
        const Icon = action.icon
        return (
          <motion.div
            key={action.title}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: action.delay, duration: 0.4 }}
            whileHover={{ y: -4, transition: { duration: 0.2 } }}
            className="flex"
          >
            <Link
              href={action.href}
              className={`flex flex-col justify-between w-full p-5 rounded-2xl border ${action.border} ${action.bg} shadow-sm transition-all group`}
            >
              <div>
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-4 ${action.iconBg}`}>
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className={`text-base font-bold ${action.textColor}`}>
                  {action.title}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 leading-relaxed">
                  {action.description}
                </p>
              </div>

              <div className={`mt-4 flex items-center gap-1 text-xs font-bold ${action.textColor}`}>
                <span>Luyện tập ngay</span>
                <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
              </div>
            </Link>
          </motion.div>
        )
      })}
    </div>
  )
}
