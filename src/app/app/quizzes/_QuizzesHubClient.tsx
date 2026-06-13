"use client"

import { useState, useEffect, useMemo, useRef, useCallback } from "react"
import {
  SparklesIcon,
  BookOpenIcon,
  TimerIcon,
  TrophyIcon,
  FlameIcon,
  ActivityIcon,
  TargetIcon,
  CheckCircle2Icon,
  CheckIcon,
  XCircleIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  RefreshCwIcon,
  ArrowRightIcon,
  BrainIcon,
  FileTextIcon,
  Loader2Icon,
  HelpCircleIcon,
  PlayIcon,
  PlusIcon,
  HistoryIcon,
  AwardIcon
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { errorToast } from "@/lib/errorToast"
import { getQuizAttemptData } from "./actions"
import { MarkdownRenderer } from "@/components/MarkdownRenderer"
import { formatDurationSeconds } from "@/features/quizzes/formatters"
import Link from "next/link"

type Attempt = {
  id: string
  status: string
  score: number | null
  startedAt: any
  submittedAt: any
  expiresAt: any
  answers: {
    questionId: string
    selectedIndex: number | null
  }[]
  quiz?: {
    id: string
    title: string
    jobInfoId: string
    totalQuestions: number
  }
}


type Quiz = {
  id: string
  title: string
  totalQuestions: number
  durationSeconds: number
  maxAttempts: number
  createdAt: string
  attempts: Attempt[]
}

type JobInfoWithQuiz = {
  id: string
  name: string
  title: string | null
  experienceLevel: string
  description: string
  analysisResult: string | null
  quizzes: Quiz[]
}

type ClientQuestion = {
  id: string
  order: number
  text: string
  options: string[]
  correctIndex?: number
  explanation?: string
}

type Props = {
  initialJobInfos: JobInfoWithQuiz[]
}

export function QuizzesHubClient({ initialJobInfos }: Props) {
  const [jobInfos, setJobInfos] = useState<JobInfoWithQuiz[]>(initialJobInfos)
  const [view, setView] = useState<"hub" | "taking" | "result">("hub")

  // Generating state
  const [generatingJobId, setGeneratingJobId] = useState<string | null>(null)
  const [loadingProgress, setLoadingProgress] = useState(0)

  // Taking state
  const [activeQuizId, setActiveQuizId] = useState<string | null>(null)
  const [activeAttemptId, setActiveAttemptId] = useState<string | null>(null)
  const [activeJobInfoId, setActiveJobInfoId] = useState<string | null>(null)
  const [questions, setQuestions] = useState<ClientQuestion[]>([])
  const [answers, setAnswers] = useState<Record<string, number | null>>({})
  const [remainingTime, setRemainingTime] = useState(0)
  const [submitting, setSubmitting] = useState(false)
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const expiresAtRef = useRef<number>(0)

  // Result state
  const [resultAttempt, setResultAttempt] = useState<Attempt | null>(null)
  const [resultQuestions, setResultQuestions] = useState<ClientQuestion[]>([])

  // Load active quizzes from DB if any page refresh happened
  useEffect(() => {
    // Check if there are any in-progress attempts on initial load
    for (const job of jobInfos) {
      for (const quiz of job.quizzes) {
        const inProgress = quiz.attempts.find(a => a.status === "in_progress")
        if (inProgress) {
          // Check if it's expired
          const expiresTime = inProgress.expiresAt ? new Date(inProgress.expiresAt).getTime() : 0
          if (expiresTime > Date.now()) {
            // Auto resume in-progress attempt if wanted
          }
        }
      }
    }
  }, [jobInfos])

  // Timer for taking quiz
  useEffect(() => {
    if (view === "taking" && remainingTime > 0) {
      timerRef.current = setInterval(() => {
        const sec = Math.max(0, Math.floor((expiresAtRef.current - Date.now()) / 1000))
        setRemainingTime(sec)
        if (sec <= 0) {
          if (timerRef.current) clearInterval(timerRef.current)
          void handleFinalizeAttempt(true)
        }
      }, 1000)
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [view, remainingTime])

  // Progress bar animation helper for AI generation
  useEffect(() => {
    let interval: NodeJS.Timeout
    if (generatingJobId) {
      setLoadingProgress(0)
      interval = setInterval(() => {
        setLoadingProgress(prev => {
          if (prev >= 95) return 95 // Hold at 95 until finished
          return prev + Math.random() * 8
        })
      }, 1000)
    }
    return () => clearInterval(interval)
  }, [generatingJobId])

  // 1. GENERATE QUIZ FLOW
  const handleCreateQuiz = async (jobInfoId: string) => {
    setGeneratingJobId(jobInfoId)
    try {
      // 1. Generate quiz via API
      const res = await fetch("/api/ai/quizzes/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobInfoId }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        errorToast(data.error ?? "Không thể tạo bộ đề")
        setGeneratingJobId(null)
        return
      }
      const { quizId } = await res.json()

      // 2. Start the attempt immediately
      await handleStartAttempt(jobInfoId, quizId)
    } catch (e) {
      errorToast(e instanceof Error ? e.message : "Lỗi kết nối máy chủ")
      setGeneratingJobId(null)
    }
  }

  // 2. START / RESUME ATTEMPT
  const handleStartAttempt = async (jobInfoId: string, quizId: string, inProgressAttemptId?: string | null) => {
    try {
      let attemptId = inProgressAttemptId

      if (!attemptId) {
        // Call API to start attempt
        const res = await fetch(`/api/quizzes/${quizId}/attempts`, { method: "POST" })
        if (!res.ok) {
          const data = await res.json().catch(() => ({}))
          errorToast(data.error ?? "Không thể bắt đầu lượt làm bài")
          setGeneratingJobId(null)
          return
        }
        const data = await res.json()
        attemptId = data.attemptId
      }

      if (!attemptId) return

      // Load questions & details via server action
      const data = await getQuizAttemptData(attemptId)
      if (!data) {
        errorToast("Không tìm thấy thông tin lượt làm")
        setGeneratingJobId(null)
        return
      }

      // Transition to taking view
      setActiveJobInfoId(jobInfoId)
      setActiveQuizId(quizId)
      setActiveAttemptId(attemptId)
      setQuestions(data.questions)

      // Initialize answers map
      const initialAnswers: Record<string, number | null> = {}
      data.questions.forEach(q => {
        const existingAns = data.attempt.answers.find(a => a.questionId === q.id)
        initialAnswers[q.id] = existingAns ? existingAns.selectedIndex : null
      })
      setAnswers(initialAnswers)

      // Set timer
      const expiresTime = new Date(data.attempt.expiresAt).getTime()
      expiresAtRef.current = expiresTime
      setRemainingTime(Math.max(0, Math.floor((expiresTime - Date.now()) / 1000)))
      setCurrentQuestionIndex(0)
      setView("taking")
      setGeneratingJobId(null)
    } catch (e) {
      errorToast("Lỗi khi tải câu hỏi trắc nghiệm")
      setGeneratingJobId(null)
    }
  }

  // 3. SUBMIT / FINALIZE QUIZ
  const handleFinalizeAttempt = async (isAuto = false) => {
    if (!activeAttemptId) return
    setSubmitting(true)
    try {
      const payload = {
        answers: questions.map(q => ({
          questionId: q.id,
          selectedIndex: answers[q.id] ?? null,
        })),
      }
      const res = await fetch(`/api/quizzes/attempts/${activeAttemptId}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      if (!res.ok && res.status !== 409) {
        const data = await res.json().catch(() => ({}))
        errorToast(data.error ?? "Không thể nộp bài")
        return
      }

      // Load final result data
      const data = await getQuizAttemptData(activeAttemptId)
      if (data) {
        setResultAttempt(data.attempt)
        setResultQuestions(data.questions)

        setJobInfos(prevJobs => {
          return prevJobs.map(job => {
            if (job.id === activeJobInfoId) {
              return {
                ...job,
                quizzes: job.quizzes.map(quiz => {
                  if (quiz.id === activeQuizId) {
                    const attemptIndex = quiz.attempts.findIndex(a => a.id === activeAttemptId)
                    const updatedAttempt = {
                      id: data.attempt.id,
                      status: data.attempt.status,
                      score: data.attempt.score,
                      startedAt: data.attempt.startedAt,
                      submittedAt: data.attempt.submittedAt,
                      expiresAt: data.attempt.expiresAt,
                      answers: data.attempt.answers || []
                    }
                    let newAttempts = [...quiz.attempts]
                    if (attemptIndex > -1) {
                      newAttempts[attemptIndex] = updatedAttempt
                    } else {
                      newAttempts = [updatedAttempt, ...newAttempts]
                    }
                    return {
                      ...quiz,
                      attempts: newAttempts
                    }
                  }
                  return quiz
                })
              }
            }
            return job
          })
        })

        setView("result")
      }
    } catch (e) {
      errorToast("Gặp sự cố khi nộp bài")
    } finally {
      setSubmitting(false)
    }
  }

  // Fetch updated data from API to sync the hub list
  const refreshJobInfosList = async () => {
    try {
      const res = await fetch("/api/user/usage?feature=ai_quiz") // Trigger refresh or query database through page
      // Normally Next.js router.refresh() handles this, but since we are SPA we can query stats or trigger router.refresh()
      window.location.reload()
    } catch (e) {
      // ignore
    }
  }

  // 4. VIEW COMPLETED ATTEMPT
  const handleViewAttempt = async (attemptId: string) => {
    try {
      const data = await getQuizAttemptData(attemptId)
      if (data) {
        setResultAttempt(data.attempt)
        setResultQuestions(data.questions)
        setView("result")
      }
    } catch (e) {
      errorToast("Không thể tải thông tin kết quả")
    }
  }

  // CALCULATE STATS FOR SUMMARY
  const stats = useMemo(() => {
    let created = 0
    let done = 0
    let highest: number | null = null
    let totalScore = 0
    let totalQuestionsCount = 0

    jobInfos.forEach(job => {
      job.quizzes.forEach(q => {
        created += 1
        q.attempts.forEach(a => {
          if (a.status === "submitted" || a.status === "expired") {
            done += 1
            if (a.score != null) {
              const pct = Math.round((a.score / q.totalQuestions) * 100)
              if (highest === null || pct > highest) highest = pct
              totalScore += a.score
              totalQuestionsCount += q.totalQuestions
            }
          }
        })
      })
    })

    const completionRate = totalQuestionsCount > 0 ? Math.round((totalScore / totalQuestionsCount) * 100) : 0

    return {
      created,
      done,
      highest,
      completionRate
    }
  }, [jobInfos])

  // New states computed for workspace flow
  const { inProgressAttempt, lastCompletedAttempt, flatAttempts } = useMemo(() => {
    const list: (Attempt & { jobName: string; jobInfoId: string; quizId: string; totalQuestions: number; quizTitle: string })[] = []
    let inProg: any = null
    let lastComp: any = null

    jobInfos.forEach(job => {
      job.quizzes.forEach(quiz => {
        quiz.attempts.forEach(attempt => {
          const item = {
            ...attempt,
            jobName: job.name,
            jobInfoId: job.id,
            quizId: quiz.id,
            totalQuestions: quiz.totalQuestions,
            quizTitle: quiz.title
          }
          list.push(item)

          if (attempt.status === "in_progress") {
            const expiresTime = attempt.expiresAt ? new Date(attempt.expiresAt).getTime() : 0
            if (expiresTime > Date.now()) {
              if (!inProg || new Date(attempt.startedAt) > new Date(inProg.startedAt)) {
                inProg = item
              }
            }
          } else if (attempt.status === "submitted" || attempt.status === "expired") {
            if (!lastComp || new Date(attempt.submittedAt || attempt.startedAt) > new Date(lastComp.submittedAt || lastComp.startedAt)) {
              lastComp = item
            }
          }
        })
      })
    })

    list.sort((a, b) => {
      const dateA = new Date(a.submittedAt || a.startedAt).getTime()
      const dateB = new Date(b.submittedAt || b.startedAt).getTime()
      return dateB - dateA
    })

    return {
      inProgressAttempt: inProg,
      lastCompletedAttempt: lastComp,
      flatAttempts: list
    }
  }, [jobInfos])

  const handleContinueLearning = () => {
    if (inProgressAttempt) {
      void handleStartAttempt(inProgressAttempt.jobInfoId, inProgressAttempt.quizId, inProgressAttempt.id)
      return
    }
    const firstJobWithQuiz = jobInfos.find(j => j.quizzes.length > 0)
    if (firstJobWithQuiz) {
      const q = firstJobWithQuiz.quizzes[0]
      const inProg = q.attempts.find(a => a.status === "in_progress")
      void handleStartAttempt(firstJobWithQuiz.id, q.id, inProg?.id)
      return
    }
    if (jobInfos.length > 0) {
      void handleCreateQuiz(jobInfos[0].id)
    }
  }

  // RENDER SECTIONS
  if (view === "taking") {
    return (
      <QuizTakingView
        questions={questions}
        answers={answers}
        setAnswers={setAnswers}
        remainingTime={remainingTime}
        currentQuestionIndex={currentQuestionIndex}
        setCurrentQuestionIndex={setCurrentQuestionIndex}
        onSubmit={() => handleFinalizeAttempt(false)}
        submitting={submitting}
        onQuit={() => {
          if (confirm("Bạn có chắc muốn thoát? Tiến trình làm bài sẽ được lưu lại.")) {
            setView("hub")
            window.location.reload()
          }
        }}
      />
    )
  }

  if (view === "result") {
    return (
      <QuizResultView
        attempt={resultAttempt!}
        questions={resultQuestions}
        onBack={() => setView("hub")}
        onRetake={() => {
          if (resultAttempt) {
            setView("hub")
            void handleStartAttempt(activeJobInfoId!, activeQuizId!)
          }
        }}
        onGenerateNew={() => {
          setView("hub")
          if (activeJobInfoId) {
            void handleCreateQuiz(activeJobInfoId)
          }
        }}
      />
    )
  }

  return (
    <div className="container my-6 space-y-8 max-w-6xl mx-auto">
      {/* 1. Hero Section */}
      <section className="relative overflow-hidden rounded-[24px] border border-slate-200 dark:border-slate-800 bg-gradient-to-br from-rose-50/30 via-purple-50/30 to-indigo-50/40 p-6 shadow-xs dark:from-card dark:via-primary/5 dark:to-secondary/5 md:p-8">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(244,63,94,0.05),transparent_40%),radial-gradient(circle_at_bottom_left,rgba(99,102,241,0.05),transparent_40%)]" />
        
        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-3xl space-y-4 flex-1">
            <div className="inline-flex items-center gap-1.5 rounded-full border border-rose-200 bg-rose-50/50 px-2.5 py-0.5 text-xs font-semibold text-rose-600 dark:border-rose-900/30 dark:bg-rose-950/20">
              <SparklesIcon className="size-3.5 animate-pulse" />
              AI Quiz Practice Workspace
            </div>

            <h1 className="text-3xl font-bold tracking-tight text-foreground md:text-4xl">
              Trắc nghiệm AI
            </h1>

            <p className="max-w-2xl text-xs md:text-sm leading-relaxed text-slate-600 dark:text-slate-400">
              Luyện tập và củng cố kiến thức chuyên môn được cá nhân hóa hoàn toàn theo CV và mô tả công việc (JD) của bạn.
            </p>

            <div className="flex flex-wrap items-center gap-6 pt-2">
              <div className="flex items-center gap-2">
                <Button 
                  onClick={handleContinueLearning}
                  disabled={generatingJobId !== null}
                  className="rounded-xl px-4 py-2 bg-primary font-bold text-white hover:bg-primary/90 shadow-sm transition-all text-xs h-9 flex items-center gap-1.5 group"
                >
                  {inProgressAttempt ? "Tiếp tục bài đang làm" : "Bắt đầu học ngay"}
                  <ArrowRightIcon className="size-3.5 group-hover:translate-x-1 transition-transform" />
                </Button>
              </div>

              {/* Learning progress indicator */}
              <div className="space-y-1 min-w-[240px] flex-1 max-w-xs border-l border-slate-200 pl-5 dark:border-border/60">
                <div className="flex items-center justify-between text-[10px] uppercase tracking-wider font-bold text-slate-400">
                  <span className="flex items-center gap-1">
                    <ActivityIcon className="size-3 text-primary" />
                    Tổng tiến độ
                  </span>
                  <span>{stats.completionRate}% câu đúng</span>
                </div>
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-muted">
                  <div 
                    className="h-full rounded-full bg-primary transition-all duration-500" 
                    style={{ width: `${stats.completionRate}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="hidden lg:flex items-center justify-center pr-4 shrink-0">
            <div className="relative flex size-24 items-center justify-center rounded-[24px] bg-gradient-to-br from-rose-500/10 via-purple-500/10 to-indigo-500/10 p-1 shadow-inner ring-8 ring-white/50 dark:ring-card/50">
              <div className="absolute inset-0 animate-ping rounded-[24px] bg-rose-500/5 opacity-50" />
              <div className="flex size-full items-center justify-center rounded-[20px] bg-white shadow dark:bg-card">
                <BrainIcon className="size-10 text-primary" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Danh sách vị trí ứng tuyển */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-foreground">Vị trí ứng tuyển của bạn</h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Chọn vị trí để làm bài trắc nghiệm tùy chỉnh.
            </p>
          </div>
        </div>

        {jobInfos.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-8 text-center dark:border-border dark:bg-card">
            <div className="mx-auto flex size-12 items-center justify-center rounded-xl bg-slate-50 text-slate-400 dark:bg-background">
              <FileTextIcon className="size-6" />
            </div>
            <h3 className="mt-3 text-sm font-bold text-foreground">Chưa có dữ liệu để tạo quiz</h3>
            <p className="mt-1.5 text-xs text-muted-foreground max-w-sm mx-auto">
              Hãy phân tích CV/JD trước để AI tạo bộ câu hỏi sát với vị trí ứng tuyển của bạn.
            </p>
            <Button asChild className="mt-4 rounded-xl text-xs" size="sm">
              <Link href="/app">Phân tích CV ngay</Link>
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {jobInfos.map(job => {
              const isGenerating = generatingJobId === job.id
              const latestQuiz = job.quizzes[0]
              const hasQuiz = !!latestQuiz
              const attemptsCount = latestQuiz ? latestQuiz.attempts.length : 0
              const reachedMax = latestQuiz ? attemptsCount >= latestQuiz.maxAttempts : false
              const inProgress = latestQuiz ? latestQuiz.attempts.find(a => a.status === "in_progress") : null
              const bestScore = latestQuiz ? latestQuiz.attempts.reduce((max, a) => {
                if (a.score != null) {
                  return max === null ? a.score : Math.max(max, a.score)
                }
                return max
              }, null as number | null) : null

              const scorePercent = bestScore !== null && latestQuiz ? Math.round((bestScore / latestQuiz.totalQuestions) * 100) : null

              return (
                <div
                  key={job.id}
                  className={cn(
                    "flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl border border-slate-100 dark:border-border/60 bg-white dark:bg-card hover:border-primary/20 dark:hover:border-primary/30 hover:shadow-xs transition-all",
                    isGenerating && "ring-1 ring-primary/20 bg-slate-50/40"
                  )}
                >
                  {isGenerating ? (
                    <div className="flex-1 py-2">
                      <QuizGeneratingState progress={loadingProgress} />
                    </div>
                  ) : (
                    <>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold text-foreground text-sm">{job.name}</span>
                          <Badge variant="outline" className="text-[10px] py-0 px-2 rounded-full uppercase tracking-wider font-mono bg-slate-50 dark:bg-muted text-muted-foreground border-none">
                            {job.experienceLevel}
                          </Badge>
                        </div>
                        {job.title && (
                          <p className="text-xs text-muted-foreground flex items-center gap-1">
                            <BrainIcon className="size-3 text-primary" />
                            {job.title}
                          </p>
                        )}
                      </div>

                      <div className="flex items-center gap-6 flex-wrap sm:flex-nowrap">
                        {/* Progress */}
                        <div className="space-y-1 min-w-[100px]">
                          <span className="block text-[10px] text-muted-foreground uppercase tracking-wider font-bold">Lượt làm</span>
                          <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
                            <span>{attemptsCount} / {latestQuiz ? latestQuiz.maxAttempts : 3}</span>
                            <div className="w-12 h-1 rounded-full bg-slate-100 dark:bg-muted overflow-hidden">
                              <div
                                className="h-full bg-primary"
                                style={{ width: `${Math.min((attemptsCount / (latestQuiz ? latestQuiz.maxAttempts : 3)) * 100, 100)}%` }}
                              />
                            </div>
                          </div>
                        </div>

                        {/* Score */}
                        <div className="min-w-[80px]">
                          <span className="block text-[10px] text-muted-foreground uppercase tracking-wider font-bold">Điểm cao nhất</span>
                          <span className="text-xs font-bold text-foreground">
                            {scorePercent !== null ? `${scorePercent}%` : "--"}
                          </span>
                        </div>

                        {/* Status */}
                        <div className="min-w-[90px]">
                          <span className="block text-[10px] text-muted-foreground uppercase tracking-wider font-bold mb-0.5">Trạng thái</span>
                          <Badge
                            className={cn(
                              "rounded-full px-2.5 py-0 text-[10px] font-semibold border-none",
                              hasQuiz
                                ? reachedMax
                                  ? "bg-amber-500/15 text-amber-600 dark:bg-amber-950/20 dark:text-amber-400"
                                  : inProgress
                                    ? "bg-blue-500/15 text-blue-600 dark:bg-blue-950/20 dark:text-blue-400"
                                    : "bg-emerald-500/15 text-emerald-600 dark:bg-emerald-950/20 dark:text-emerald-400"
                                : "bg-slate-100 text-slate-500 dark:bg-muted dark:text-muted-foreground"
                            )}
                          >
                            {hasQuiz
                              ? reachedMax
                                ? "Hết lượt làm"
                                : inProgress
                                  ? "Đang làm dở"
                                  : "Sẵn sàng"
                              : "Chưa tạo đề"
                            }
                          </Badge>
                        </div>

                        {/* Action */}
                        <div className="pl-2">
                          {!hasQuiz || reachedMax ? (
                            <Button
                              onClick={() => handleCreateQuiz(job.id)}
                              disabled={generatingJobId !== null}
                              size="sm"
                              className="rounded-xl bg-primary text-white font-semibold hover:bg-primary/95 text-xs h-8"
                            >
                              <SparklesIcon className="mr-1 size-3" />
                              Tạo đề
                            </Button>
                          ) : (
                            <Button
                              onClick={() => handleStartAttempt(job.id, latestQuiz.id, inProgress?.id)}
                              disabled={generatingJobId !== null}
                              size="sm"
                              className={cn(
                                "rounded-xl font-semibold text-white text-xs h-8",
                                inProgress ? "bg-blue-600 hover:bg-blue-500" : "bg-emerald-600 hover:bg-emerald-500"
                              )}
                            >
                              <PlayIcon className="mr-1 size-3" />
                              {inProgress ? "Tiếp tục" : "Làm bài"}
                            </Button>
                          )}
                        </div>
                      </div>
                    </>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </section>

      {/* 3. Lịch sử làm bài */}
      <section className="space-y-4">
        <div>
          <h2 className="text-xl font-bold text-foreground">Lịch sử làm bài gần đây</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Xem lại kết quả chi tiết các bài trắc nghiệm bạn đã thực hiện.
          </p>
        </div>

        {flatAttempts.length === 0 ? (
          <div className="rounded-2xl border border-slate-100 bg-white p-6 text-center dark:border-border dark:bg-card text-xs text-muted-foreground">
            Chưa có lượt làm bài nào được ghi nhận. Hãy bắt đầu bài trắc nghiệm đầu tiên!
          </div>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-slate-100 dark:border-border/60 bg-white dark:bg-card">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-border/60 bg-slate-50/50 dark:bg-background/40 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                    <th className="p-4">Vị trí & Bộ đề</th>
                    <th className="p-4">Điểm số</th>
                    <th className="p-4">Thời gian</th>
                    <th className="p-4">Kết quả</th>
                    <th className="p-4 text-right">Hành động</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-border/60">
                  {flatAttempts.slice(0, 10).map((attempt) => {
                    const isSubmitted = attempt.status === "submitted"
                    const score = attempt.score ?? 0
                    const pct = Math.round((score / attempt.totalQuestions) * 100)
                    const isPass = pct >= 80

                    return (
                      <tr key={attempt.id} className="hover:bg-slate-50/50 dark:hover:bg-muted/10 transition-colors">
                        <td className="p-4 font-semibold text-foreground">
                          <div>{attempt.jobName}</div>
                          <div className="text-[10px] text-muted-foreground font-normal mt-0.5">{attempt.quizTitle}</div>
                        </td>
                        <td className="p-4 font-bold text-foreground">
                          {isSubmitted ? `${score}/${attempt.totalQuestions} (${pct}%)` : "--"}
                        </td>
                        <td className="p-4 text-muted-foreground">
                          {new Date(attempt.submittedAt || attempt.startedAt).toLocaleString("vi-VN", {
                            month: "short",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit"
                          })}
                        </td>
                        <td className="p-4">
                          {!isSubmitted ? (
                            <Badge className="bg-blue-500/10 text-blue-600 hover:bg-blue-500/10 border-none text-[9px]">
                              Đang làm
                            </Badge>
                          ) : isPass ? (
                            <Badge className="bg-green-500/10 text-green-600 hover:bg-green-500/10 border-none text-[9px]">
                              Đạt
                            </Badge>
                          ) : (
                            <Badge className="bg-amber-500/10 text-amber-600 hover:bg-amber-500/10 border-none text-[9px]">
                              Chưa đạt
                            </Badge>
                          )}
                        </td>
                        <td className="p-4 text-right">
                          {isSubmitted ? (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleViewAttempt(attempt.id)}
                              className="h-7 text-primary hover:text-primary/80 font-semibold text-xs px-2.5 rounded-lg"
                            >
                              Xem lại
                            </Button>
                          ) : (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleStartAttempt(attempt.jobInfoId, attempt.quizId, attempt.id)}
                              className="h-7 text-blue-600 hover:text-blue-500 font-semibold text-xs px-2.5 rounded-lg"
                            >
                              Làm tiếp
                            </Button>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </section>
    </div>
  )
}

// 4. GENERATING STATE
function QuizGeneratingState({ progress }: { progress: number }) {
  return (
    <div className="flex flex-col items-center justify-center py-6 text-center space-y-4">
      <div className="relative flex size-16 items-center justify-center rounded-2xl bg-primary/10 text-primary">
        <Loader2Icon className="size-8 animate-spin" />
      </div>
      <div className="space-y-1">
        <h4 className="font-bold text-foreground">AI đang tạo 30 câu hỏi trắc nghiệm...</h4>
        <p className="text-xs text-muted-foreground">Thường mất từ 15–40 giây. Vui lòng không đóng trang.</p>
      </div>

      {/* Progress Bar */}
      <div className="w-full max-w-xs h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-muted relative">
        <div
          className="h-full rounded-full bg-gradient-to-r from-primary to-violet-500 transition-all duration-500"
          style={{ width: `${progress}%` }}
        />
      </div>
      <span className="text-xs font-mono font-bold text-muted-foreground">{Math.round(progress)}%</span>
    </div>
  )
}

// 5. QUIZ TAKING VIEW
type QuizTakingProps = {
  questions: ClientQuestion[]
  answers: Record<string, number | null>
  setAnswers: React.Dispatch<React.SetStateAction<Record<string, number | null>>>
  remainingTime: number
  currentQuestionIndex: number
  setCurrentQuestionIndex: (idx: number) => void
  onSubmit: () => void
  submitting: boolean
  onQuit: () => void
}

function QuizTakingView({
  questions,
  answers,
  setAnswers,
  remainingTime,
  currentQuestionIndex,
  setCurrentQuestionIndex,
  onSubmit,
  submitting,
  onQuit
}: QuizTakingProps) {
  const currentQuestion = questions[currentQuestionIndex]
  const answeredCount = Object.values(answers).filter(v => v !== null).length
  const [showConfirmModal, setShowConfirmModal] = useState(false)
  const [gradingStep, setGradingStep] = useState(0)
  const [localSubmitting, setLocalSubmitting] = useState(false)
  const startTimeRef = useRef(Date.now())

  useEffect(() => {
    if (submitting || localSubmitting) {
      setGradingStep(1)
      const t1 = setTimeout(() => setGradingStep(2), 800)
      const t2 = setTimeout(() => setGradingStep(3), 1600)
      const t3 = setTimeout(() => setGradingStep(4), 2400)
      const t4 = setTimeout(() => setGradingStep(5), 3200)
      return () => {
        clearTimeout(t1)
        clearTimeout(t2)
        clearTimeout(t3)
        clearTimeout(t4)
      }
    } else {
      setGradingStep(0)
    }
  }, [submitting, localSubmitting])

  const handleConfirmSubmit = () => {
    setShowConfirmModal(false)
    setLocalSubmitting(true)
    onSubmit()
  }

  const timeSpentSeconds = Math.max(0, Math.floor((Date.now() - startTimeRef.current) / 1000))

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* 1. Modal xác nhận nộp bài */}
      {showConfirmModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-card rounded-3xl max-w-md w-full p-6 space-y-6 border border-slate-100 dark:border-border/60 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="text-center space-y-2">
              <h3 className="text-xl font-bold text-foreground flex items-center justify-center gap-2">
                📝 Xác nhận nộp bài?
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Bạn sẽ không thể chỉnh sửa đáp án sau khi nộp. AI sẽ tiến hành chấm điểm và tạo phản hồi chi tiết.
              </p>
            </div>

            {/* Metrics */}
            <div className="bg-slate-50 dark:bg-muted/30 rounded-2xl p-4 space-y-3 text-sm border border-slate-100 dark:border-border/40">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground font-medium">Số câu đã làm:</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400">{answeredCount} / {questions.length} câu</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground font-medium">Số câu chưa trả lời:</span>
                <span className="font-bold text-amber-600 dark:text-amber-400">{questions.length - answeredCount} câu</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground font-medium">Thời gian làm bài:</span>
                <span className="font-bold text-foreground font-mono">{formatDurationSeconds(timeSpentSeconds)}</span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Button 
                variant="outline" 
                onClick={() => setShowConfirmModal(false)} 
                className="flex-1 rounded-xl font-semibold h-11"
              >
                Quay lại
              </Button>
              <Button 
                onClick={handleConfirmSubmit} 
                className="flex-1 rounded-xl font-semibold bg-primary text-white hover:bg-primary/95 h-11"
              >
                Xác nhận nộp bài
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* 2. Trạng thái AI đang chấm bài */}
      {(submitting || localSubmitting) && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-50 flex flex-col items-center justify-center p-6 text-center animate-in fade-in duration-300">
          <div className="max-w-md w-full space-y-8">
            {/* Pulsing neuro brain / ring animation */}
            <div className="relative flex items-center justify-center size-28 mx-auto">
              <div className="absolute inset-0 rounded-full border-4 border-primary/20 animate-pulse" />
              <div className="absolute inset-0 rounded-full border-4 border-t-primary border-r-transparent border-b-transparent border-l-transparent animate-spin" />
              <div className="flex size-20 items-center justify-center rounded-full bg-white dark:bg-card shadow-inner">
                <BrainIcon className="size-10 text-primary animate-pulse" />
              </div>
            </div>

            <div className="space-y-2">
              <h2 className="text-2xl font-extrabold text-white">
                🤖 AI đang phân tích bài làm của bạn
              </h2>
              <p className="text-sm text-slate-300">
                Chờ một lát, AI đang đánh giá và chuẩn bị phản hồi cho bạn...
              </p>
            </div>

            {/* Checklist steps */}
            <div className="bg-white/10 dark:bg-black/25 backdrop-blur-md rounded-3xl p-6 text-left space-y-4 max-w-xs mx-auto border border-white/10">
              <div className="space-y-3.5 text-sm">
                {[
                  "Kiểm tra đáp án",
                  "Đánh giá mức độ hiểu biết",
                  "Phân tích kỹ năng còn thiếu",
                  "Tạo feedback cá nhân hóa",
                  "Đang tạo báo cáo AI..."
                ].map((step, index) => {
                  const currentIdx = index + 1
                  const isDone = gradingStep > currentIdx
                  const isCurrent = gradingStep === currentIdx

                  return (
                    <div 
                      key={step} 
                      className={cn(
                        "flex items-center gap-3 transition-opacity duration-300",
                        gradingStep >= currentIdx ? "opacity-100" : "opacity-30"
                      )}
                    >
                      {isDone ? (
                        <div className="flex size-5 shrink-0 items-center justify-center rounded-full bg-emerald-500 text-white animate-scale-in">
                          <CheckIcon className="size-3 stroke-[3]" />
                        </div>
                      ) : isCurrent ? (
                        <Loader2Icon className="size-5 shrink-0 animate-spin text-primary" />
                      ) : (
                        <div className="size-5 shrink-0 rounded-full border-2 border-slate-400/50" />
                      )}
                      <span className={cn(
                        "font-medium",
                        isDone ? "text-slate-200 line-through decoration-emerald-500/50" : isCurrent ? "text-primary font-bold" : "text-slate-300"
                      )}>
                        {index === 4 && isCurrent ? "Đang tạo báo cáo AI..." : step}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Top sticky progress/timer header */}
      <div className="sticky top-0 z-20 rounded-2xl border border-slate-100 bg-white/90 p-4 shadow-sm backdrop-blur dark:border-border/60 dark:bg-card/90 flex flex-wrap items-center justify-between gap-4">
        <div className="space-y-1">
          <span className="text-xs text-muted-foreground font-bold uppercase tracking-wider">Tiến độ bài làm</span>
          <div className="text-sm font-bold text-foreground">
            Đã trả lời: <span className="text-primary">{answeredCount}</span> / {questions.length} câu
          </div>
        </div>

        {/* Timer */}
        <div className="flex items-center gap-2 rounded-xl bg-slate-50 px-4 py-2 border dark:bg-muted/40 font-mono text-xl font-bold text-foreground">
          <TimerIcon className="size-5 text-primary" />
          {formatDurationSeconds(remainingTime)}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={onQuit} className="rounded-lg font-bold">
            Thoát
          </Button>
          <Button onClick={() => setShowConfirmModal(true)} disabled={submitting} className="rounded-lg font-bold">
            <RefreshCwIcon className={cn("mr-1.5 size-4", submitting && "animate-spin")} />
            Nộp bài
          </Button>
        </div>

        {/* Visual progress bar */}
        <div className="w-full h-1.5 overflow-hidden rounded-full bg-slate-100 dark:bg-muted mt-2">
          <div
            className="h-full rounded-full bg-primary transition-all duration-300"
            style={{ width: `${(answeredCount / questions.length) * 100}%` }}
          />
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[2.8fr_1.2fr] items-start">
        {/* Left: Current Question Card */}
        <div className="space-y-6">
          <Card className="rounded-[28px] border border-slate-100 bg-white p-6 shadow-sm dark:border-border/60 dark:bg-card md:p-8">
            <CardContent className="p-0 space-y-6">
              <div className="flex items-center justify-between">
                <span className="rounded-lg bg-primary/5 px-2.5 py-1 font-mono text-xs font-bold text-primary">
                  Câu {currentQuestion.order + 1} / {questions.length}
                </span>
              </div>

              <div className="text-base md:text-lg font-semibold text-foreground leading-relaxed">
                <MarkdownRenderer>{currentQuestion.text}</MarkdownRenderer>
              </div>

              {/* Option Cards */}
              <div className="grid gap-3 pt-2">
                {currentQuestion.options.map((option, idx) => {
                  const isSelected = answers[currentQuestion.id] === idx
                  return (
                    <button
                      key={idx}
                      onClick={() => setAnswers(prev => ({ ...prev, [currentQuestion.id]: idx }))}
                      className={cn(
                        "group flex items-start gap-4 rounded-2xl border p-4 text-left transition-all duration-200",
                        isSelected
                          ? "border-primary bg-primary/5 ring-1 ring-primary/10"
                          : "border-slate-100 bg-slate-50/30 hover:border-slate-300 hover:bg-slate-50/60 dark:border-border dark:bg-background/40 dark:hover:bg-background/80"
                      )}
                    >
                      <span className={cn(
                        "flex size-6 shrink-0 items-center justify-center rounded-lg border text-xs font-bold transition-colors",
                        isSelected
                          ? "border-primary bg-primary text-white"
                          : "border-slate-200 bg-white text-slate-500 group-hover:border-slate-400 dark:border-border dark:bg-card"
                      )}>
                        {String.fromCharCode(65 + idx)}
                      </span>
                      <span className="text-sm font-medium text-foreground leading-relaxed">
                        {option}
                      </span>
                    </button>
                  )
                })}
              </div>
            </CardContent>
          </Card>

          {/* Navigation controls */}
          <div className="flex items-center justify-between gap-4">
            <Button
              variant="outline"
              disabled={currentQuestionIndex === 0}
              onClick={() => setCurrentQuestionIndex(currentQuestionIndex - 1)}
              className="rounded-xl font-bold"
            >
              <ChevronLeftIcon className="mr-1.5 size-4" />
              Câu trước
            </Button>

            {currentQuestionIndex < questions.length - 1 ? (
              <Button
                onClick={() => setCurrentQuestionIndex(currentQuestionIndex + 1)}
                className="rounded-xl font-bold"
              >
                Câu tiếp theo
                <ChevronRightIcon className="ml-1.5 size-4" />
              </Button>
            ) : (
              <Button onClick={() => setShowConfirmModal(true)} disabled={submitting} className="rounded-xl font-bold">
                Nộp bài thi
              </Button>
            )}
          </div>
        </div>

        {/* Right: Question Navigation Panel */}
        <aside className="rounded-[28px] border border-slate-100 bg-white p-5 shadow-sm dark:border-border/60 dark:bg-card">
          <h4 className="font-bold text-foreground text-sm mb-4 flex items-center gap-2">
            <BrainIcon className="size-4 text-primary" />
            Danh sách câu hỏi
          </h4>
          <div className="grid grid-cols-5 gap-2">
            {questions.map((q, idx) => {
              const isAnswered = answers[q.id] !== null
              const isCurrent = currentQuestionIndex === idx

              return (
                <button
                  key={q.id}
                  onClick={() => setCurrentQuestionIndex(idx)}
                  className={cn(
                    "flex aspect-square items-center justify-center rounded-xl text-xs font-mono font-bold transition-all border",
                    isCurrent
                      ? "border-primary bg-primary text-white scale-105 shadow-xs"
                      : isAnswered
                        ? "border-emerald-200 bg-emerald-50 text-emerald-600 dark:border-emerald-950/40 dark:bg-emerald-950/25 dark:text-emerald-400"
                        : "border-slate-100 bg-slate-50 text-slate-500 hover:border-slate-200 dark:border-border dark:bg-background/40 dark:text-muted-foreground"
                  )}
                >
                  {idx + 1}
                </button>
              )
            })}
          </div>
        </aside>
      </div>
    </div>
  )
}

// 6. QUIZ RESULT VIEW
type QuizResultProps = {
  attempt: Attempt
  questions: ClientQuestion[]
  onBack: () => void
  onRetake: () => void
  onGenerateNew: () => void
}

function QuizResultView({
  attempt,
  questions,
  onBack,
  onRetake,
  onGenerateNew
}: QuizResultProps) {
  const selectedByQuestion = new Map(
    attempt.answers.map(a => [a.questionId, a.selectedIndex])
  )
  const score = attempt.score ?? 0
  const total = questions.length
  const percent = total === 0 ? 0 : Math.round((score / total) * 100)

  // AI Feedback Comment
  const aiComment = useMemo(() => {
    if (percent >= 80) {
      return "Xuất sắc! Bạn đã nắm vững kiến thức cốt lõi cho vị trí này. Hãy tiếp tục duy trì phong độ."
    }
    if (percent >= 60) {
      return "Khá tốt! Bạn đã có nền tảng tương đối vững vàng, hãy xem các câu sai để bổ sung thêm các điểm khuyết."
    }
    return "Cần ôn tập thêm! Đừng nản lòng, hãy xem kỹ phần giải thích chi tiết bên dưới để củng cố lại kiến thức chuyên môn."
  }, [percent])

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Kết quả trắc nghiệm</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {attempt.quiz?.title || "Bộ đề trắc nghiệm AI"}
          </p>
        </div>
        <Button variant="outline" onClick={onBack} className="rounded-xl font-bold">
          Quay lại danh sách
        </Button>
      </div>

      {/* Result Overview Cards */}
      <div className="grid gap-6 md:grid-cols-[1.5fr_2.5fr] items-stretch">
        {/* Score widget */}
        <Card className="rounded-[28px] border border-slate-100 bg-white p-6 shadow-sm dark:border-border/60 dark:bg-card flex flex-col items-center justify-center text-center">
          <span className="text-xs text-muted-foreground font-bold uppercase tracking-wider mb-4">Điểm số đạt được</span>

          <div className="relative flex size-32 items-center justify-center">
            <svg className="size-full -rotate-90" viewBox="0 0 36 36">
              <path
                className="text-slate-100 dark:text-muted/20"
                strokeWidth="3.5"
                stroke="currentColor"
                fill="none"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
              <path
                className={cn(
                  "transition-all duration-1000 ease-out",
                  percent >= 80 ? "text-emerald-500" : percent >= 60 ? "text-blue-500" : "text-amber-500"
                )}
                strokeWidth="3.5"
                strokeDasharray={`${percent}, 100`}
                strokeLinecap="round"
                stroke="currentColor"
                fill="none"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
            </svg>
            <div className="absolute flex flex-col items-center">
              <span className="text-3xl font-extrabold text-foreground">{score} / {total}</span>
              <span className="text-xs text-muted-foreground font-bold">{percent}%</span>
            </div>
          </div>

          <div className="mt-6 flex gap-4 w-full">
            <div className="flex-1 rounded-xl bg-slate-50/50 p-2.5 dark:bg-background/40">
              <span className="block text-[10px] text-muted-foreground font-bold uppercase tracking-wider">Đúng</span>
              <span className="text-sm font-bold text-emerald-600">{score} câu</span>
            </div>
            <div className="flex-1 rounded-xl bg-slate-50/50 p-2.5 dark:bg-background/40">
              <span className="block text-[10px] text-muted-foreground font-bold uppercase tracking-wider">Sai / Bỏ qua</span>
              <span className="text-sm font-bold text-destructive">{total - score} câu</span>
            </div>
          </div>
        </Card>

        {/* AI Comment & Action */}
        <Card className="rounded-[28px] border border-slate-100 bg-white p-6 shadow-sm dark:border-border/60 dark:bg-card flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <BrainIcon className="size-4.5" />
              </div>
              <div>
                <h3 className="font-bold text-foreground">Đánh giá từ AI Coach</h3>
                <p className="text-xs text-muted-foreground">Nhận xét chi tiết tổng thể</p>
              </div>
            </div>
            <p className="text-sm text-foreground leading-relaxed bg-slate-50/50 dark:bg-background/40 p-4 rounded-2xl border border-dashed">
              {aiComment}
            </p>
          </div>

          <div className="flex items-center gap-3 pt-6">
            <Button onClick={onRetake} className="flex-1 rounded-xl bg-primary text-white font-bold hover:bg-primary/95">
              <RefreshCwIcon className="mr-1.5 size-4" />
              Làm lại bài thi
            </Button>
            <Button onClick={onGenerateNew} variant="outline" className="flex-1 rounded-xl font-bold">
              <SparklesIcon className="mr-1.5 size-4 text-primary" />
              Tạo bộ đề mới
            </Button>
          </div>
        </Card>
      </div>

      {/* Questions list with correct answers & explanations */}
      <section className="space-y-4 pt-4">
        <h2 className="text-xl font-bold text-foreground">Chi tiết đáp án & Giải thích</h2>

        <ol className="space-y-4 list-none">
          {questions.map(q => {
            const selected = selectedByQuestion.get(q.id) ?? null
            const isCorrect = selected !== null && selected === q.correctIndex

            return (
              <li key={q.id}>
                <Card className="rounded-[24px] border border-slate-100 bg-white p-5 shadow-xs dark:border-border/60 dark:bg-card">
                  <CardContent className="p-0 space-y-4">
                    <div className="flex items-baseline gap-2 justify-between flex-wrap">
                      <span className="rounded-lg bg-slate-100 dark:bg-muted px-2.5 py-1 font-mono text-xs font-bold text-slate-600 dark:text-muted-foreground">
                        Câu {q.order + 1}
                      </span>
                      {selected === null ? (
                        <Badge variant="outline" className="rounded-full bg-slate-50 border-slate-200 text-slate-500 font-bold">Chưa trả lời</Badge>
                      ) : isCorrect ? (
                        <Badge className="rounded-full bg-emerald-500/15 text-emerald-600 border-none font-bold">Đúng</Badge>
                      ) : (
                        <Badge variant="destructive" className="rounded-full bg-destructive/15 text-destructive border-none font-bold">Sai</Badge>
                      )}
                    </div>

                    <div className="text-sm font-semibold text-foreground leading-relaxed">
                      <MarkdownRenderer>{q.text}</MarkdownRenderer>
                    </div>

                    <div className="grid grid-cols-1 gap-2 pt-1">
                      {q.options.map((opt, idx) => {
                        const isThisCorrect = idx === q.correctIndex
                        const isThisSelected = idx === selected

                        return (
                          <div
                            key={idx}
                            className={cn(
                              "border rounded-xl p-3 text-xs flex items-start gap-3 transition-colors",
                              isThisCorrect
                                ? "border-green-500/30 bg-green-500/[0.03] text-green-700 dark:text-green-400"
                                : isThisSelected
                                  ? "border-destructive/30 bg-destructive/[0.03] text-destructive"
                                  : "border-slate-50 bg-slate-50/30 text-muted-foreground dark:border-border/40 dark:bg-background/20"
                            )}
                          >
                            <span className={cn(
                              "flex size-5 shrink-0 items-center justify-center rounded-md text-[10px] font-bold border",
                              isThisCorrect
                                ? "border-green-500 bg-green-500 text-white"
                                : isThisSelected
                                  ? "border-destructive bg-destructive text-white"
                                  : "border-slate-200 bg-white dark:border-border dark:bg-card"
                            )}>
                              {String.fromCharCode(65 + idx)}
                            </span>
                            <span className="font-medium flex-1 pt-0.5 leading-relaxed text-foreground">
                              {opt}
                            </span>
                            {isThisCorrect && (
                              <Badge className="ml-auto bg-green-500/10 text-green-600 hover:bg-green-500/10 border-none text-[9px] rounded-md font-bold">
                                Đáp án đúng
                              </Badge>
                            )}
                            {isThisSelected && !isThisCorrect && (
                              <Badge className="ml-auto bg-destructive/10 text-destructive hover:bg-destructive/10 border-none text-[9px] rounded-md font-bold">
                                Bạn chọn
                              </Badge>
                            )}
                          </div>
                        )
                      })}
                    </div>

                    {q.explanation && (
                      <div className="text-xs bg-slate-50 dark:bg-muted/30 rounded-2xl p-4 border border-dashed border-slate-200 dark:border-border/60">
                        <span className="font-bold text-foreground block mb-1">Giải thích từ AI Coach:</span>
                        <p className="text-muted-foreground leading-relaxed">{q.explanation}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </li>
            )
          })}
        </ol>
      </section>
    </div>
  )
}
