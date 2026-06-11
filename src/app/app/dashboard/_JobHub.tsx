"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { 
  BrainCircuit, 
  FileSearch, 
  MessageSquare, 
  Plus, 
  Calendar, 
  Building2, 
  Sparkles, 
  ArrowRight, 
  Loader2, 
  FileText,
  AlertCircle
} from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AnalysisResults } from "@/app/app/AnalysisResults"
import { formatExperienceLevel } from "@/features/jobInfos/lib/formatters"

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
  const [activeJobId, setActiveJobId] = useState<string | null>(null)
  const [jobDetail, setJobDetail] = useState<any | null>(null)
  const [isLoadingDetail, setIsLoadingDetail] = useState(false)

  useEffect(() => {
    if (!activeJobId) {
      setJobDetail(null)
      return
    }
    setIsLoadingDetail(true)
    fetch(`/api/job-infos/${activeJobId}`)
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch job details")
        return res.json()
      })
      .then((data) => {
        setJobDetail(data)
      })
      .catch((err) => {
        console.error(err)
      })
      .finally(() => {
        setIsLoadingDetail(false)
      })
  }, [activeJobId])

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

  // Parse CV analysis results
  let parsedAnalysis = null
  if (jobDetail?.analysisResult) {
    try {
      parsedAnalysis = JSON.parse(jobDetail.analysisResult)
    } catch (e) {
      console.error("Failed to parse analysis result", e)
    }
  }

  return (
    <>
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
              onClick={() => setActiveJobId(job.id)}
              className="cursor-pointer"
            >
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

      {/* Modern Workspace Modal Dialog */}
      <Dialog open={activeJobId !== null} onOpenChange={(open) => !open && setActiveJobId(null)}>
        <DialogContent className="max-w-[92%] sm:max-w-4xl md:max-w-5xl h-[88vh] flex flex-col p-6 rounded-2xl md:rounded-3xl border border-slate-200 bg-white dark:border-white/10 dark:bg-slate-950 overflow-hidden shadow-2xl transition-all duration-300">
          {isLoadingDetail ? (
            <div className="flex flex-col items-center justify-center flex-1 space-y-4">
              <Loader2 className="h-8 w-8 text-rose-500 animate-spin" />
              <p className="text-sm text-slate-500 dark:text-slate-400 animate-pulse">Đang tải thông tin vị trí ứng tuyển...</p>
            </div>
          ) : jobDetail ? (
            <div className="flex flex-col flex-1 min-h-0">
              {/* Modal Header */}
              <DialogHeader className="pb-4 border-b border-slate-100 dark:border-white/10 flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1.5 min-w-0">
                  <DialogTitle className="text-xl md:text-2xl font-bold text-slate-900 dark:text-white truncate">
                    {jobDetail.name}
                  </DialogTitle>
                  <div className="flex flex-wrap items-center gap-2.5 text-xs text-slate-500 dark:text-slate-400">
                    {jobDetail.title && (
                      <span className="flex items-center gap-1.5 font-medium">
                        <Building2 className="h-3.5 w-3.5 text-slate-400" />
                        {jobDetail.title}
                      </span>
                    )}
                    <span className="inline-flex items-center rounded-md bg-slate-100 dark:bg-white/10 px-2 py-0.5 font-medium text-slate-700 dark:text-slate-300">
                      {formatExperienceLevel(jobDetail.experienceLevel)}
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3.5 w-3.5 text-slate-400" />
                      {new Date(jobDetail.createdAt).toLocaleDateString("vi-VN")}
                    </span>
                  </div>
                </div>
              </DialogHeader>

              {/* Workspace Navigation Tabs */}
              <Tabs defaultValue="overview" className="flex flex-col flex-1 min-h-0 mt-4">
                <div className="flex items-center justify-between border-b border-slate-150 dark:border-white/5 pb-2">
                  <TabsList className="bg-slate-100 dark:bg-white/5 border border-slate-200/50 dark:border-white/5 p-1 rounded-xl">
                    <TabsTrigger 
                      value="overview" 
                      className="px-4 py-1.5 text-xs font-semibold rounded-lg data-[state=active]:bg-white dark:data-[state=active]:bg-white/10 data-[state=active]:text-rose-600 dark:data-[state=active]:text-rose-450 cursor-pointer"
                    >
                      Tổng quan
                    </TabsTrigger>
                    <TabsTrigger 
                      value="analysis" 
                      className="px-4 py-1.5 text-xs font-semibold rounded-lg data-[state=active]:bg-white dark:data-[state=active]:bg-white/10 data-[state=active]:text-rose-600 dark:data-[state=active]:text-rose-450 cursor-pointer"
                    >
                      CV & Phân tích
                    </TabsTrigger>
                  </TabsList>
                </div>

                {/* Tab content 1: Overview */}
                <TabsContent value="overview" className="flex-1 flex flex-col min-h-0 pt-4 gap-4 overflow-y-auto pr-1">
                  {/* Action Cards (Quick Actions) */}
                  <div>
                    <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-3 flex items-center gap-1.5">
                      <Sparkles className="h-4 w-4 text-rose-500" />
                      Quick Actions
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      {/* CV Analysis Card */}
                      <Link href={`/app/analyze?jobId=${jobDetail.id}`}>
                        <div className="group p-4 rounded-2xl border border-slate-200 dark:border-white/8 bg-white dark:bg-white/3 hover:bg-slate-50 dark:hover:bg-white/5 transition-all duration-200 hover:border-violet-500/30 hover:shadow-md h-full flex flex-col justify-between">
                          <div>
                            <div className="w-9 h-9 rounded-xl bg-violet-500/10 text-violet-500 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                              <FileSearch className="h-4.5 w-4.5" />
                            </div>
                            <h5 className="font-semibold text-sm text-slate-800 dark:text-white group-hover:text-violet-500 dark:group-hover:text-violet-400 transition-colors">Phân tích CV</h5>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                              Nhận xét chuyên gia để gia tăng tỷ lệ lọt vào vòng tiếp theo.
                            </p>
                          </div>
                          <div className="flex items-center gap-1 text-[11px] font-semibold text-violet-500 dark:text-violet-400 mt-3">
                            Bắt đầu <ArrowRight className="h-3 w-3 group-hover:translate-x-1 transition-transform" />
                          </div>
                        </div>
                      </Link>

                      {/* Mock Interview Card */}
                      <Link href={`/app/interview?jobId=${jobDetail.id}`}>
                        <div className="group p-4 rounded-2xl border border-slate-200 dark:border-white/8 bg-white dark:bg-white/3 hover:bg-slate-50 dark:hover:bg-white/5 transition-all duration-200 hover:border-blue-500/30 hover:shadow-md h-full flex flex-col justify-between">
                          <div>
                            <div className="w-9 h-9 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                              <MessageSquare className="h-4.5 w-4.5" />
                            </div>
                            <h5 className="font-semibold text-sm text-slate-800 dark:text-white group-hover:text-blue-500 dark:group-hover:text-blue-400 transition-colors">Phỏng vấn với AI</h5>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                              Mô phỏng phỏng vấn thực tế với câu hỏi cá nhân hóa theo JD.
                            </p>
                          </div>
                          <div className="flex items-center gap-1 text-[11px] font-semibold text-blue-500 dark:text-blue-400 mt-3">
                            Luyện tập <ArrowRight className="h-3 w-3 group-hover:translate-x-1 transition-transform" />
                          </div>
                        </div>
                      </Link>

                      {/* AI Quizzes Card */}
                      <Link href={`/app/job-infos/${jobDetail.id}/quizzes`}>
                        <div className="group p-4 rounded-2xl border border-slate-200 dark:border-white/8 bg-white dark:bg-white/3 hover:bg-slate-50 dark:hover:bg-white/5 transition-all duration-200 hover:border-emerald-500/30 hover:shadow-md h-full flex flex-col justify-between">
                          <div>
                            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                              <BrainCircuit className="h-4.5 w-4.5" />
                            </div>
                            <h5 className="font-semibold text-sm text-slate-800 dark:text-white group-hover:text-emerald-500 dark:group-hover:text-emerald-400 transition-colors">Trắc nghiệm AI</h5>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                              Sinh bộ trắc nghiệm 30 câu ôn luyện kiến thức nền tảng.
                            </p>
                          </div>
                          <div className="flex items-center gap-1 text-[11px] font-semibold text-emerald-500 dark:text-emerald-400 mt-3">
                            Làm bài <ArrowRight className="h-3 w-3 group-hover:translate-x-1 transition-transform" />
                          </div>
                        </div>
                      </Link>
                    </div>
                  </div>

                  {/* Job Description panel */}
                  <div className="flex-1 flex flex-col min-h-[250px] border border-slate-200 dark:border-white/8 rounded-2xl bg-slate-50/50 dark:bg-white/1 p-4.5">
                    <h4 className="text-sm font-bold text-slate-850 dark:text-slate-200 mb-2 flex items-center gap-1.5">
                      <FileText className="h-4 w-4 text-rose-500" />
                      Mô tả công việc (Job Description)
                    </h4>
                    <div className="flex-1 overflow-y-auto pr-1 text-xs md:text-sm text-slate-650 dark:text-slate-300 whitespace-pre-line leading-relaxed">
                      {jobDetail.description}
                    </div>
                  </div>
                </TabsContent>

                {/* Tab content 2: CV & Phân tích */}
                <TabsContent value="analysis" className="flex-1 flex flex-col min-h-0 pt-4 overflow-y-auto pr-1">
                  {parsedAnalysis ? (
                    <div className="space-y-4">
                      {jobDetail.resumeUrl && (
                        <div className="flex items-center justify-between p-3.5 bg-slate-50/50 dark:bg-white/2 rounded-2xl border border-slate-200 dark:border-white/8 text-xs">
                          <span className="flex items-center gap-2 font-medium text-slate-700 dark:text-slate-350">
                            <FileText className="h-4.5 w-4.5 text-rose-500" />
                            File CV đang sử dụng
                          </span>
                          <a 
                            href={jobDetail.resumeUrl} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="font-bold text-rose-600 dark:text-rose-400 hover:underline flex items-center gap-1"
                          >
                            Tải CV về máy 
                            <ArrowRight className="h-3 w-3" />
                          </a>
                        </div>
                      )}
                      
                      <div className="border border-slate-200 dark:border-white/8 rounded-2xl p-4 md:p-6 bg-white dark:bg-transparent">
                        <AnalysisResults 
                          aiAnalysis={parsedAnalysis} 
                          isLoading={false} 
                          jobInfoId={jobDetail.id} 
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-16 px-4 text-center rounded-2xl border border-dashed border-slate-200 dark:border-white/8 bg-slate-50/50 dark:bg-white/1">
                      <AlertCircle className="h-10 w-10 text-slate-400 dark:text-slate-650 mb-3" />
                      <h4 className="font-semibold text-slate-800 dark:text-white text-base">Chưa có kết quả phân tích CV</h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mt-1 mb-5">
                        Bạn chưa tải lên hoặc phân tích CV cho vị trí ứng tuyển này. Hãy tiến hành phân tích CV để nhận phản hồi từ AI.
                      </p>
                      <Button asChild className="rounded-xl bg-rose-600 hover:bg-rose-500 text-white border-0 font-semibold text-xs">
                        <Link href={`/app/analyze?jobId=${jobDetail.id}`}>
                          Phân tích CV ngay
                          <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                        </Link>
                      </Button>
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center flex-1 text-center">
              <p className="text-sm text-slate-500 dark:text-slate-400">Không tìm thấy thông tin công việc.</p>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}

