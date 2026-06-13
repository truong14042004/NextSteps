"use client"

import {
  CartesianGrid,
  Area,
  AreaChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"
import { Brain, Sparkles, ArrowRight, Trophy, TrendingUp, Activity, Award, Flame, Target } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

type Point = {
  date: string
  score: number
  total: number
  percent: number
}

function getAiInsight(points: Point[]): { text: string; icon: React.ElementType; iconColor: string; bgClass: string; borderClass: string } {
  if (points.length === 0) {
    return {
      text: "",
      icon: Sparkles,
      iconColor: "text-amber-500",
      bgClass: "bg-amber-50/40 dark:bg-amber-955/5",
      borderClass: "border-amber-100/50 dark:border-amber-500/10"
    }
  }
  
  const firstPct = points[0].percent
  const lastPct = points[points.length - 1].percent
  const diff = lastPct - firstPct
  
  let streak = 0
  for (let i = points.length - 1; i >= 0; i--) {
    if (points[i].percent >= 80) {
      streak++
    } else {
      break
    }
  }

  if (streak >= 3) {
    return {
      text: `Tuyệt vời! Bạn đang có chuỗi ${streak} bài quiz liên tiếp đạt từ 80 điểm trở lên.`,
      icon: Flame,
      iconColor: "text-orange-500",
      bgClass: "bg-orange-50/40 dark:bg-orange-950/5",
      borderClass: "border-orange-100/50 dark:border-orange-500/10"
    }
  }
  
  if (diff > 5) {
    return {
      text: `Điểm số quiz của bạn đã tăng trưởng tích cực thêm ${Math.round(diff)}% trong thời gian qua.`,
      icon: TrendingUp,
      iconColor: "text-emerald-500",
      bgClass: "bg-emerald-50/40 dark:bg-emerald-950/5",
      borderClass: "border-emerald-100/50 dark:border-emerald-500/10"
    }
  }

  return {
    text: "Hãy cố gắng đạt mốc 90 điểm trong bài quiz tiếp theo để mở khóa huy chương 'Vượt Trội Quiz'!",
    icon: Target,
    iconColor: "text-rose-500",
    bgClass: "bg-rose-50/40 dark:bg-rose-950/5",
    borderClass: "border-rose-100/50 dark:border-rose-500/10"
  }
}

export function ScoreChart({ points }: { points: Point[] }) {
  if (points.length === 0) {
    return (
      <Card className="border-slate-100 bg-white dark:border-white/5 dark:bg-slate-900/40 backdrop-blur-sm shadow-sm rounded-3xl">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-bold flex items-center gap-2 text-slate-800 dark:text-white">
            <Trophy className="h-4.5 w-4.5 text-amber-500 fill-amber-500 stroke-[1.8]" />
            Lịch sử điểm quiz (30 ngày)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-12 px-4 text-center min-h-[260px]">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-purple-500/10 mb-4 animate-bounce">
              <Brain className="h-6 w-6 text-purple-500" />
            </div>
            <h3 className="text-sm font-bold text-slate-800 dark:text-white">Chưa có dữ liệu quiz</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-xs leading-relaxed">
              Làm quiz đầu tiên để theo dõi tiến độ học tập và cải thiện của bạn theo thời gian.
            </p>
            <Button asChild size="sm" className="mt-5 rounded-2xl bg-gradient-to-r from-rose-500 via-fuchsia-500 to-violet-600 hover:opacity-95 text-white font-bold text-xs h-9 px-5 shadow-md shadow-fuchsia-500/15 border-0">
              <Link href="/app/quizzes">
                Tạo quiz ngay
                <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  const totalQuizzes = points.length
  const avgScore = Math.round(points.reduce((acc, p) => acc + p.percent, 0) / totalQuizzes)
  const bestScore = Math.max(...points.map((p) => p.percent))
  const insight = getAiInsight(points)
  const InsightIcon = insight.icon

  return (
    <Card className="border-slate-100 bg-white/80 dark:border-white/5 dark:bg-slate-900/40 backdrop-blur-xl shadow-sm rounded-3xl p-2">
      {/* Header */}
      <div className="p-4 pb-3 flex items-center justify-between gap-3">
        <div className="text-sm font-bold flex items-center gap-2 text-slate-800 dark:text-white">
          <Trophy className="h-4.5 w-4.5 text-amber-500 fill-amber-500 stroke-[1.8]" />
          Lịch sử điểm quiz (30 ngày)
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <span className="rounded-full bg-violet-50 dark:bg-violet-950/20 border border-violet-100 dark:border-violet-500/20 px-2.5 py-0.5 text-[10px] font-bold text-violet-600 dark:text-violet-300">
            Avg: {avgScore}%
          </span>
          <span className="rounded-full bg-rose-50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-500/20 px-2.5 py-0.5 text-[10px] font-bold text-rose-600 dark:text-rose-455">
            Best: {bestScore}%
          </span>
        </div>
      </div>

      <div className="p-4 pt-0">
        {/* 2-Column Grid Layout: Info details on the LEFT, Chart on the RIGHT */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Left Column: KPIs & AI Insight */}
          <div className="lg:col-span-1 space-y-4 flex flex-col justify-between">
            {/* KPI Stats (Stacked Vertically) */}
            <div className="space-y-3">
              {/* Average KPI */}
              <div className="bg-purple-50/40 dark:bg-purple-950/5 border border-purple-100/50 dark:border-purple-500/10 rounded-2xl p-3 flex items-center gap-2.5 transition-all hover:translate-x-1 duration-205">
                <div className="h-8 w-8 rounded-xl bg-purple-500/10 flex items-center justify-center shrink-0">
                  <TrendingUp className="h-4 w-4 text-purple-600 dark:text-purple-400 stroke-[1.8]" />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Trung bình</p>
                  <h4 className="text-base font-bold text-slate-800 dark:text-white leading-tight mt-0.5">{avgScore}%</h4>
                </div>
              </div>

              {/* Best KPI */}
              <div className="bg-rose-50/40 dark:bg-rose-950/5 border border-rose-100/50 dark:border-rose-500/10 rounded-2xl p-3 flex items-center gap-2.5 transition-all hover:translate-x-1 duration-205">
                <div className="h-8 w-8 rounded-xl bg-rose-500/10 flex items-center justify-center shrink-0">
                  <Award className="h-4 w-4 text-rose-600 dark:text-rose-400 stroke-[1.8]" />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Tốt nhất</p>
                  <h4 className="text-base font-bold text-slate-800 dark:text-white leading-tight mt-0.5">{bestScore}%</h4>
                </div>
              </div>

              {/* Total KPI */}
              <div className="bg-blue-50/40 dark:bg-blue-950/5 border border-blue-100/50 dark:border-blue-500/10 rounded-2xl p-3 flex items-center gap-2.5 transition-all hover:translate-x-1 duration-205">
                <div className="h-8 w-8 rounded-xl bg-blue-500/10 flex items-center justify-center shrink-0">
                  <Activity className="h-4 w-4 text-blue-600 dark:text-blue-400 stroke-[1.8]" />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Tổng số</p>
                  <h4 className="text-base font-bold text-slate-800 dark:text-white leading-tight mt-0.5">{totalQuizzes} quiz</h4>
                </div>
              </div>
            </div>

            {/* AI Insight Box at Bottom Left */}
            {insight.text && (
              <div className={`${insight.bgClass} border ${insight.borderClass} rounded-2xl p-3.5 flex items-start gap-2.5`}>
                <div className="mt-0.5 h-5 w-5 shrink-0 flex items-center justify-center">
                  <InsightIcon className={`h-4.5 w-4.5 ${insight.iconColor} stroke-[1.8]`} />
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-305 font-medium leading-relaxed">
                  <span className="font-bold text-slate-700 dark:text-slate-200">AI Insight: </span>{insight.text}
                </p>
              </div>
            )}
          </div>

          {/* Right Column: Chart Canvas */}
          <div className="lg:col-span-2 h-[280px] w-full flex items-end">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={points} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                <defs>
                  <linearGradient id="scoreColorGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="lineColorGrad" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#f43f5e" />
                    <stop offset="50%" stopColor="#d946ef" />
                    <stop offset="100%" stopColor="#8b5cf6" />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" className="stroke-slate-100 dark:stroke-white/5" vertical={false} />
                <XAxis 
                  dataKey="date" 
                  tickLine={false} 
                  axisLine={false} 
                  tick={{ fontSize: 10, fill: "#888888", fontWeight: "bold" }} 
                  dy={8}
                />
                <YAxis 
                  domain={[0, 100]} 
                  tickLine={false} 
                  axisLine={false} 
                  tick={{ fontSize: 10, fill: "#888888", fontWeight: "bold" }} 
                  dx={-8}
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (!active || !payload?.length) return null
                    const p = payload[0].payload as Point
                    return (
                      <div className="rounded-2xl border border-slate-100 dark:border-white/5 bg-white dark:bg-slate-900 p-3 text-xs shadow-xl backdrop-blur-md">
                        <div className="font-bold text-slate-800 dark:text-white mb-1">{p.date}</div>
                        <div className="text-slate-550 dark:text-slate-400 font-medium">
                          Kết quả: <span className="font-bold text-rose-500">{p.score}/{p.total} câu</span> ({p.percent}%)
                        </div>
                      </div>
                    )
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="percent"
                  stroke="url(#lineColorGrad)"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#scoreColorGrad)"
                  dot={{ r: 3.5, stroke: "url(#lineColorGrad)", strokeWidth: 1.5, fill: "#ffffff" }}
                  activeDot={{ r: 6.5, stroke: "url(#lineColorGrad)", strokeWidth: 2.5, fill: "#ffffff" }}
                  animationDuration={1500}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </Card>
  )
}
