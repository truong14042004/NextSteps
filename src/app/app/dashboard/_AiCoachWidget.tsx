"use client"

import { motion } from "framer-motion"
import { ArrowRight, BrainCircuit, MessageSquare, Sparkles, TrendingUp } from "lucide-react"
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

function buildTips(stats: Stats): { icon: React.ElementType; text: string; href: string; color: string }[] {
  const tips: { icon: React.ElementType; text: string; href: string; color: string }[] = []

  if (stats.totalAnalyses === 0) {
    tips.push({ icon: Sparkles, text: "Bắt đầu bằng cách phân tích CV của bạn theo một JD để nhận đánh giá cá nhân hoá.", href: "/app/analyze", color: "text-emerald-400" })
  } else if (stats.totalQuizAttempts === 0) {
    tips.push({ icon: BrainCircuit, text: "Thử tạo bộ câu hỏi quiz AI từ CV đã phân tích để kiểm tra kiến thức của bạn.", href: "/app/quizzes", color: "text-violet-400" })
  } else if (stats.averageQuizPercent != null && stats.averageQuizPercent < 70) {
    tips.push({ icon: TrendingUp, text: `Điểm quiz trung bình của bạn là ${stats.averageQuizPercent}%. Tập trung vào các câu hỏi khó để cải thiện.`, href: "/app/quizzes", color: "text-amber-400" })
  } else {
    tips.push({ icon: TrendingUp, text: `Bạn đang tiến bộ tốt! Điểm quiz trung bình đạt ${stats.averageQuizPercent ?? 0}%. Duy trì phong độ nhé.`, href: "/app/quizzes", color: "text-emerald-400" })
  }

  if (stats.totalInterviews === 0) {
    tips.push({ icon: MessageSquare, text: "Thử một buổi mock interview AI để luyện phản xạ trả lời và nhận feedback chi tiết.", href: "/app/interview", color: "text-blue-400" })
  } else {
    tips.push({ icon: MessageSquare, text: `Bạn đã hoàn thành ${stats.totalInterviews} buổi phỏng vấn. Thêm một buổi nữa sẽ tăng điểm nhất quán của bạn!`, href: "/app/interview", color: "text-blue-400" })
  }

  if (stats.streakDays < 3) {
    tips.push({ icon: Sparkles, text: "Luyện tập mỗi ngày sẽ giúp bạn ghi nhớ tốt hơn. Hãy duy trì streak trong 7 ngày liên tiếp!", href: "/app/quizzes", color: "text-rose-400" })
  } else {
    tips.push({ icon: Sparkles, text: `🔥 Streak ${stats.streakDays} ngày! Bạn đang rất kiên trì. Tiếp tục để mở khoá thành tích mới.`, href: "/app", color: "text-rose-400" })
  }

  return tips.slice(0, 3)
}

export function AiCoachWidget({ stats, suggestion }: Props) {
  const tips = buildTips(stats)

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
      className="rounded-2xl border border-slate-200 bg-white dark:border-white/10 dark:bg-white/5 p-6 backdrop-blur-sm shadow-xl h-full flex flex-col"
    >
      {/* Header */}
      <div className="mb-5 flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-rose-500/10 to-indigo-500/10 dark:from-rose-500/20 dark:to-indigo-500/20 border border-slate-200 dark:border-white/10">
          <Sparkles className="h-4.5 w-4.5 text-rose-500 dark:text-rose-400" />
        </div>
        <div>
          <h2 className="text-base font-semibold text-slate-900 dark:text-white">AI Career Coach</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">Gợi ý cá nhân hoá từ AI</p>
        </div>
      </div>

      {/* Tips */}
      <div className="flex-1 space-y-3">
        {tips.map(({ icon: Icon, text, href, color }, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: 12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.35 + i * 0.1 }}
          >
            <Link
              href={href}
              className="group flex items-start gap-3 rounded-xl border border-slate-200/80 bg-slate-50/50 dark:border-white/8 dark:bg-white/5 p-4 transition-all hover:bg-slate-100/50 dark:hover:bg-white/10 hover:border-slate-300 dark:hover:border-white/15 hover:-translate-y-0.5"
            >
              <div className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-white dark:bg-white/8 shadow-sm dark:shadow-none`}>
                <Icon className={`h-3.5 w-3.5 ${color.replace("-400", "-600 dark:text-$&").replace("dark:text-text-", "dark:text-")}`} />
              </div>
              <p className="flex-1 text-sm text-slate-700 dark:text-slate-300 leading-relaxed">{text}</p>
              <ArrowRight className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-400 dark:text-slate-500 transition-transform group-hover:translate-x-1" />
            </Link>
          </motion.div>
        ))}
      </div>

      {/* CTA */}
      {suggestion && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
          className="mt-4 pt-4 border-t border-slate-100 dark:border-white/8"
        >
          <Button asChild size="sm" className="w-full rounded-xl bg-gradient-to-r from-rose-600 to-indigo-600 text-white border-0 hover:opacity-90 shadow-lg shadow-rose-500/15">
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
