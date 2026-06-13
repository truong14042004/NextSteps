"use client"

import { motion } from "framer-motion"
import { ArrowRight, BrainCircuit, MessageSquare, Sparkles, TrendingUp, UserCheck } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"

type Stats = {
  totalQuizAttempts: number
  totalInterviews: number
  totalAnalyses: number
  averageQuizPercent: number | null
  bestQuizPercent: number | null
  streakDays: number
  activeDaysLast30: number
}

type Props = {
  stats: Stats
  suggestion: { text: string; href: string; cta: string } | null
}

function buildTips(stats: Stats): { icon: React.ElementType; text: string; href: string; color: string; bg: string; border: string }[] {
  const tips: { icon: React.ElementType; text: string; href: string; color: string; bg: string; border: string }[] = []

  if (stats.totalAnalyses === 0) {
    tips.push({
      icon: Sparkles,
      text: "Bắt đầu bằng cách phân tích CV của bạn theo một JD để nhận đánh giá cá nhân hoá.",
      href: "/app/analyze",
      color: "text-emerald-600 dark:text-emerald-400",
      bg: "bg-emerald-50/50 dark:bg-emerald-950/10",
      border: "border-emerald-100 dark:border-emerald-500/20"
    })
  } else if (stats.totalQuizAttempts === 0) {
    tips.push({
      icon: BrainCircuit,
      text: "Thử tạo bộ câu hỏi quiz AI từ CV đã phân tích để kiểm tra kiến thức của bạn.",
      href: "/app/quizzes",
      color: "text-purple-650 dark:text-purple-400",
      bg: "bg-purple-50/50 dark:bg-purple-950/10",
      border: "border-purple-100 dark:border-purple-550/20"
    })
  } else if (stats.averageQuizPercent != null && stats.averageQuizPercent < 70) {
    tips.push({
      icon: TrendingUp,
      text: `Điểm quiz trung bình của bạn là ${stats.averageQuizPercent}%. Tập trung vào các câu hỏi khó để cải thiện.`,
      href: "/app/quizzes",
      color: "text-amber-600 dark:text-amber-400",
      bg: "bg-amber-50/50 dark:bg-amber-950/10",
      border: "border-amber-100 dark:border-amber-550/20"
    })
  } else {
    tips.push({
      icon: TrendingUp,
      text: `Bạn đang tiến bộ tốt! Điểm quiz trung bình đạt ${stats.averageQuizPercent ?? 0}%. Duy trì phong độ nhé.`,
      href: "/app/quizzes",
      color: "text-emerald-600 dark:text-emerald-400",
      bg: "bg-emerald-50/50 dark:bg-emerald-950/10",
      border: "border-emerald-100 dark:border-emerald-550/20"
    })
  }

  if (stats.totalInterviews === 0) {
    tips.push({
      icon: MessageSquare,
      text: "Thử một buổi mock interview AI để luyện phản xạ trả lời và nhận feedback chi tiết.",
      href: "/app/interview",
      color: "text-blue-650 dark:text-blue-400",
      bg: "bg-blue-50/50 dark:bg-blue-950/10",
      border: "border-blue-100 dark:border-blue-550/20"
    })
  } else {
    tips.push({
      icon: MessageSquare,
      text: `Bạn đã hoàn thành ${stats.totalInterviews} buổi phỏng vấn. Thêm một buổi nữa sẽ tăng điểm nhất quán của bạn!`,
      href: "/app/interview",
      color: "text-blue-650 dark:text-blue-400",
      bg: "bg-blue-50/50 dark:bg-blue-950/10",
      border: "border-blue-100 dark:border-blue-550/20"
    })
  }

  if (stats.streakDays < 3) {
    tips.push({
      icon: Sparkles,
      text: "Luyện tập mỗi ngày sẽ giúp bạn ghi nhớ tốt hơn. Hãy duy trì streak trong 7 ngày liên tiếp!",
      href: "/app/quizzes",
      color: "text-rose-600 dark:text-rose-400",
      bg: "bg-rose-50/50 dark:bg-rose-950/10",
      border: "border-rose-100 dark:border-rose-550/20"
    })
  } else {
    tips.push({
      icon: Sparkles,
      text: `Streak ${stats.streakDays} ngày! Bạn đang rất kiên trì. Tiếp tục để mở khoá thành tích mới.`,
      href: "/app",
      color: "text-rose-600 dark:text-rose-400",
      bg: "bg-rose-50/50 dark:bg-rose-950/10",
      border: "border-rose-100 dark:border-rose-550/20"
    })
  }

  return tips.slice(0, 2) // Limit to maximum 2 tips to avoid clutter
}

export function AiCoachWidget({ stats, suggestion }: Props) {
  const tips = buildTips(stats)

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
      className="rounded-3xl border border-slate-100 bg-white dark:border-white/5 dark:bg-slate-900/40 p-6 shadow-sm backdrop-blur-sm h-full flex flex-col justify-between"
    >
      {/* Header with AI Avatar */}
      <div className="mb-5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-tr from-rose-500 to-indigo-500 text-white shadow-md">
              <Sparkles className="h-5 w-5 animate-pulse" />
            </div>
            <div className="absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full border-2 border-white dark:border-slate-900 bg-emerald-500" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-800 dark:text-white">AI Career Coach</h2>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">Trợ lý học tập cá nhân của bạn</p>
          </div>
        </div>
      </div>

      {/* Suggested Notes */}
      <div className="flex-1 space-y-3">
        {tips.map(({ icon: Icon, text, href, color, bg, border }, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: 12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 + i * 0.1 }}
          >
            <Link
              href={href}
              className={`group flex items-start gap-3 rounded-2xl border ${border} ${bg} p-4 transition-all hover:translate-x-1 duration-200`}
            >
              <div className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-xl bg-white dark:bg-slate-900 shadow-sm`}>
                <Icon className={`h-4 w-4 ${color}`} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-slate-700 dark:text-slate-350 leading-relaxed font-medium">
                  {text}
                </p>
              </div>
              <ArrowRight className="mt-1 h-3.5 w-3.5 shrink-0 text-slate-400 dark:text-slate-500 transition-transform group-hover:translate-x-1" />
            </Link>
          </motion.div>
        ))}
      </div>

      {/* Primary CTA at bottom */}
      {suggestion && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-4 pt-4 border-t border-slate-100 dark:border-white/5"
        >
          <Button asChild size="sm" className="w-full rounded-2xl bg-gradient-to-r from-rose-600 to-indigo-650 hover:opacity-95 text-white font-bold text-xs h-9 shadow-md shadow-rose-500/10">
            <Link href={suggestion.href}>
              <Sparkles className="mr-1.5 h-3.5 w-3.5" />
              {suggestion.cta}
            </Link>
          </Button>
        </motion.div>
      )}
    </motion.div>
  )
}
