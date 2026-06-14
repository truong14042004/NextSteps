"use client"

import { useState, useEffect, useTransition } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import {
  ArrowLeftIcon,
  CalendarIcon,
  ClockIcon,
  SparklesIcon,
  MessageSquareIcon,
  BrainIcon,
  UserIcon,
  BotIcon,
  CheckCircle2Icon,
  AwardIcon,
  Share2Icon,
  DownloadIcon,
  Loader2Icon,
  FileCheck2Icon,
  ZapIcon
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { MarkdownRenderer } from "@/components/MarkdownRenderer"
import { formatDateTime } from "@/lib/formatters"
import { generateInterviewFeedback } from "@/features/interviews/actions"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface JobInfo {
  id: string
  title: string | null
  description: string | null
  experienceLevel: string | null
}

interface Interview {
  id: string
  createdAt: Date
  duration: string
  feedback: string | null
  humeChatId: string | null
  vapiTranscript: string | null
  jobInfo: JobInfo
}

interface Message {
  isUser: boolean
  content: string[]
}

interface InterviewWorkspaceProps {
  interview: Interview
  user: { name: string; imageUrl: string }
  messages: Message[]
}

const LOADING_STEPS = [
  "Đang đọc transcript",
  "Đang phân tích câu trả lời",
  "Đang đánh giá kỹ năng",
  "Đang tạo nhận xét cải thiện"
]

export function InterviewWorkspace({ interview, user, messages }: InterviewWorkspaceProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [feedback, setFeedback] = useState<string | null>(interview.feedback)
  const [progress, setProgress] = useState(0)
  const [stepIndex, setStepIndex] = useState(0)
  const [activeTab, setActiveTab] = useState("overview")

  // Parse overall rating
  const overallRating = feedback ? parseScore(feedback) : null
  const parsedCategoryScores = feedback ? getCategoryScores(feedback) : []

  // Progress simulation for loading
  useEffect(() => {
    let interval: NodeJS.Timeout
    if (isPending) {
      setProgress(0)
      setStepIndex(0)

      interval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 98) {
            return 98
          }
          const next = prev + Math.floor(Math.random() * 6) + 1

          if (next < 25) setStepIndex(0)
          else if (next < 50) setStepIndex(1)
          else if (next < 75) setStepIndex(2)
          else setStepIndex(3)

          return Math.min(next, 98)
        })
      }, 500)
    } else {
      setProgress(0)
    }

    return () => clearInterval(interval)
  }, [isPending])

  const handleGenerateFeedback = () => {
    startTransition(async () => {
      try {
        const res = await generateInterviewFeedback(interview.id)
        if (res.error) {
          toast.error(res.message || "Không thể tạo đánh giá")
          return
        }

        setProgress(100)
        setStepIndex(3)
        setFeedback(res.feedback ?? null)
        toast.success("Đã tạo đánh giá AI thành công!")
        router.refresh()
      } catch (err) {
        toast.error("Có lỗi xảy ra khi tạo đánh giá")
      }
    })
  }

  function parseScore(markdown: string | null) {
    if (!markdown) return null
    const match = markdown.match(/(?:Overall Rating|Overall Score|Điểm tổng hợp|Điểm tổng|Đánh giá chung)[\s\*:]*(\d+(\.\d+)?)\/10/i)
    return match ? parseFloat(match[1]) : null
  }

  function getCategoryScores(markdown: string) {
    const categories = [
      { key: "communication", label: "Giao tiếp & Truyền đạt", icon: MessageSquareIcon, color: "text-blue-600 bg-blue-500/10 border-blue-500/20 dark:text-blue-400" },
      { key: "confidence", label: "Tự tin & Cảm xúc", icon: BrainIcon, color: "text-indigo-650 bg-indigo-500/10 border-indigo-500/20 dark:text-indigo-400" },
      { key: "response", label: "Chất lượng câu trả lời", icon: AwardIcon, color: "text-emerald-605 bg-emerald-500/10 border-emerald-500/20 dark:text-emerald-400" },
      { key: "pacing", label: "Nhịp độ & Thời gian", icon: ClockIcon, color: "text-amber-600 bg-amber-500/10 border-amber-500/20 dark:text-amber-400" },
      { key: "engagement", label: "Tương tác & Gắn kết", icon: ZapIcon, color: "text-pink-600 bg-pink-500/10 border-pink-500/20 dark:text-pink-400" },
      { key: "fit", label: "Phù hợp vai trò", icon: CheckCircle2Icon, color: "text-sky-600 bg-sky-500/10 border-sky-500/20 dark:text-sky-400" },
    ]

    const regex = /##\s*([^:]+):\s*(\d+(?:\.\d+)?)\/10/g
    let match
    const scores: Record<string, number> = {}

    while ((match = regex.exec(markdown)) !== null) {
      const title = match[1].toLowerCase()
      const scoreVal = parseFloat(match[2])

      if (title.includes("clarity") || title.includes("communication") || title.includes("giao tiếp")) {
        scores["communication"] = scoreVal
      } else if (title.includes("confidence") || title.includes("emotional") || title.includes("tự tin") || title.includes("cảm xúc")) {
        scores["confidence"] = scoreVal
      } else if (title.includes("response") || title.includes("chất lượng")) {
        scores["response"] = scoreVal
      } else if (title.includes("pacing") || title.includes("nhịp độ")) {
        scores["pacing"] = scoreVal
      } else if (title.includes("engagement") || title.includes("tương tác")) {
        scores["engagement"] = scoreVal
      } else if (title.includes("fit") || title.includes("alignment") || title.includes("phù hợp")) {
        scores["fit"] = scoreVal
      }
    }

    return categories.map(cat => ({
      ...cat,
      score: scores[cat.key] ?? null
    })).filter(cat => cat.score !== null)
  }

  function extractFeedbackSection(markdown: string | null, keywords: string[]): string {
    if (!markdown) return ""
    const lines = markdown.split("\n")
    let isTargetSection = false
    const extractedLines: string[] = []

    for (const line of lines) {
      if (line.startsWith("#")) {
        const headingText = line.replace(/^[#\s]+/, "").toLowerCase()
        const matchesKeyword = keywords.some(k => headingText.includes(k))
        if (matchesKeyword) {
          isTargetSection = true
          continue
        } else {
          isTargetSection = false
        }
      }

      if (isTargetSection) {
        extractedLines.push(line)
      }
    }

    return extractedLines.join("\n").trim()
  }

  const strengthsText = feedback ? extractFeedbackSection(feedback, ["strength", "điểm mạnh", "ưu điểm"]) : ""
  const improvementsText = feedback ? extractFeedbackSection(feedback, ["improvement", "cải thiện", "hạn chế", "điểm yếu", "yếu"]) : ""
  const suggestionsText = feedback ? extractFeedbackSection(feedback, ["suggestion", "gợi ý", "luyện tập", "trả lời tốt hơn"]) : ""

  return (
    <div className="w-full space-y-6">

      {/* 1. Hero Header */}
      <div className="relative overflow-hidden rounded-[24px] border border-border bg-gradient-to-br from-red-500/5 via-background to-purple-500/5 p-5 md:p-6 shadow-xs">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(220,38,38,0.02),transparent_45%)] pointer-events-none" />

        <div className="relative space-y-3">
          <Link
            href="/app/interview"
            className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors font-bold uppercase tracking-wider"
          >
            <ArrowLeftIcon className="size-3.5" />
            <span>Quay lại Phỏng vấn AI</span>
          </Link>

          <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
            <div className="space-y-1">
              <div className="inline-flex items-center gap-1.5 bg-primary/10 text-primary px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider">
                🏷 INTERVIEW REPORT WORKSPACE
              </div>
              <h1 className="text-xl font-bold text-foreground tracking-tight flex items-center gap-2">
                Kết quả phỏng vấn AI
                {overallRating && (
                  <span className="inline-flex items-center justify-center bg-primary/10 text-primary px-2 py-0.5 rounded-full text-xs font-bold">
                    {overallRating}/10
                  </span>
                )}
              </h1>
            </div>

            {/* Meta values */}
            <div className="flex flex-wrap gap-2 text-xs font-semibold">
              <div className="bg-card px-3 py-1 rounded-full border border-border shadow-2xs flex items-center gap-1 text-muted-foreground">
                <ClockIcon className="size-3 text-muted-foreground" />
                <span>{interview.duration || "00:00:00"}</span>
              </div>
              <div className="bg-card px-3 py-1 rounded-full border border-border shadow-2xs flex items-center gap-1 text-muted-foreground">
                <CalendarIcon className="size-3 text-muted-foreground" />
                <span>{formatDateTime(interview.createdAt)}</span>
              </div>
              {interview.jobInfo.experienceLevel && (
                <div className="bg-card px-3 py-1 rounded-full border border-border shadow-2xs flex items-center gap-1 text-muted-foreground">
                  <AwardIcon className="size-3 text-muted-foreground" />
                  <span>{interview.jobInfo.experienceLevel}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 2. Summary Card */}
      <Card className="rounded-[20px] border border-border bg-card shadow-xs overflow-hidden">
        <CardContent className="p-5">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="space-y-1.5">
              <h2 className="text-base font-bold text-foreground">
                {interview.jobInfo.title || "Vị trí không xác định"}
              </h2>
              <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <CalendarIcon className="size-3.5 text-muted-foreground/80" />
                  {formatDateTime(interview.createdAt)}
                </span>
                <span className="flex items-center gap-1">
                  <ClockIcon className="size-3.5 text-muted-foreground/80" />
                  {interview.duration || "00:00:00"}
                </span>
                <span className="flex items-center gap-1">
                  <span className={cn(
                    "size-2 rounded-full",
                    feedback ? "bg-emerald-500 animate-pulse" : "bg-amber-500 animate-pulse"
                  )} />
                  Trạng thái: <strong className={feedback ? "text-emerald-600 dark:text-emerald-400" : "text-amber-600 dark:text-amber-400"}>
                    {feedback ? "Đã có đánh giá" : "Chưa có đánh giá AI"}
                  </strong>
                </span>
              </div>
            </div>

            <div className="w-full md:w-auto flex flex-wrap sm:flex-nowrap gap-2 items-center">
              {/* Export/Share buttons (Disabled) */}
              {/* <Button
                disabled
                variant="outline"
                className="w-full sm:w-auto rounded-xl border-border text-muted-foreground font-bold text-xs h-9 cursor-not-allowed opacity-50 flex items-center gap-1"
              >
                <DownloadIcon className="size-3.5" />
                Xuất PDF
              </Button>
              <Button
                disabled
                variant="outline"
                className="w-full sm:w-auto rounded-xl border-border text-muted-foreground font-bold text-xs h-9 cursor-not-allowed opacity-50 flex items-center gap-1"
              >
                <Share2Icon className="size-3.5" />
                Chia sẻ
              </Button> */}

              {feedback ? (
                <Button
                  onClick={() => {
                    const el = document.getElementById("ai-feedback-section")
                    el?.scrollIntoView({ behavior: "smooth" })
                  }}
                  className="w-full sm:w-auto rounded-xl bg-foreground hover:bg-foreground/90 text-background font-bold text-xs px-4 h-9 shadow-xs transition-all cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <AwardIcon className="size-3.5" />
                  Xem đánh giá AI
                </Button>
              ) : (
                isPending ? (
                  <Button
                    disabled
                    className="w-full sm:w-auto rounded-xl bg-muted text-muted-foreground border border-border font-bold text-xs px-4 h-9 flex items-center justify-center gap-1.5"
                  >
                    <Loader2Icon className="size-3.5 animate-spin text-muted-foreground" />
                    Đang tạo đánh giá...
                  </Button>
                ) : (
                  <Button
                    onClick={handleGenerateFeedback}
                    className="w-full sm:w-auto rounded-xl bg-gradient-to-r from-red-600 to-purple-600 hover:opacity-95 text-white font-bold text-xs px-4 h-9 shadow-md shadow-purple-500/10 hover:shadow-lg transition-all cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <SparklesIcon className="size-3.5 animate-pulse" />
                    Tạo đánh giá AI
                  </Button>
                )
              )}
            </div>
          </div>

          {/* AI Generating Feedback State */}
          {isPending && (
            <div className="mt-5 pt-4 border-t border-border space-y-4">
              <div className="flex justify-between items-center text-xs font-bold text-foreground">
                <span className="flex items-center gap-1.5">
                  <BrainIcon className="size-4 text-primary animate-pulse" />
                  AI đang phân tích cuộc phỏng vấn...
                </span>
                <span>{progress}%</span>
              </div>

              <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary rounded-full transition-all duration-500 ease-out"
                  style={{ width: `${progress}%` }}
                />
              </div>

              {/* Steps status timeline */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {LOADING_STEPS.map((step, idx) => {
                  const isCompleted = stepIndex > idx
                  const isCurrent = stepIndex === idx

                  return (
                    <div
                      key={idx}
                      className={cn(
                        "p-2 rounded-xl border text-[10px] font-bold text-center transition-all duration-300",
                        isCompleted
                          ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400"
                          : isCurrent
                            ? "bg-primary/10 border-primary/20 text-primary shadow-xs animate-pulse"
                            : "bg-muted border-border text-muted-foreground"
                      )}
                    >
                      <div className="mb-0.5 text-[8px] uppercase tracking-wider opacity-80">Bước {idx + 1}</div>
                      <div>{step}</div>
                    </div>
                  )
                })}
              </div>

              {/* Skeleton placeholder */}
              <div className="space-y-2 pt-2 animate-pulse">
                <div className="h-3.5 w-48 bg-muted rounded-lg" />
                <div className="h-3 w-full bg-muted rounded-md" />
                <div className="h-3 w-5/6 bg-muted rounded-md" />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 2. KPI Cards - Conditionally shown ONLY when feedback is generated */}
      {feedback && (() => {
        const commScore = parsedCategoryScores.find(s => s.key === "communication")?.score
        const techScore = parsedCategoryScores.find(s => s.key === "response")?.score
        const fitScore = parsedCategoryScores.find(s => s.key === "fit")?.score

        return (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 animate-in fade-in slide-in-from-top-4 duration-300">
            {/* Card 1: Điểm tổng thể */}
            <div className="bg-card rounded-2xl border border-border p-4 flex items-center justify-between h-[85px] shadow-xs">
              <div className="space-y-0.5">
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Điểm tổng thể</span>
                <h4 className="text-lg font-bold text-foreground">{overallRating ? `${overallRating}/10` : "N/A"}</h4>
              </div>
              <div className="size-9 rounded-xl bg-primary/10 flex items-center justify-center text-primary border border-primary/20">
                <SparklesIcon className="size-4.5" />
              </div>
            </div>

            {/* Card 2: Điểm giao tiếp */}
            <div className="bg-card rounded-2xl border border-border p-4 flex items-center justify-between h-[85px] shadow-xs">
              <div className="space-y-0.5">
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Giao tiếp</span>
                <h4 className="text-lg font-bold text-foreground">
                  {commScore ? `${commScore}/10` : "N/A"}
                </h4>
              </div>
              <div className="size-9 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-600 dark:text-blue-400 border border-blue-500/20">
                <MessageSquareIcon className="size-4.5" />
              </div>
            </div>

            {/* Card 3: Điểm chuyên môn */}
            <div className="bg-card rounded-2xl border border-border p-4 flex items-center justify-between h-[85px] shadow-xs">
              <div className="space-y-0.5">
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Chuyên môn</span>
                <h4 className="text-lg font-bold text-foreground">
                  {techScore ? `${techScore}/10` : "N/A"}
                </h4>
              </div>
              <div className="size-9 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-650 dark:text-purple-400 border border-purple-500/20">
                <AwardIcon className="size-4.5" />
              </div>
            </div>

            {/* Card 4: Độ phù hợp JD */}
            <div className="bg-card rounded-2xl border border-border p-4 flex items-center justify-between h-[85px] shadow-xs">
              <div className="space-y-0.5">
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Độ phù hợp JD</span>
                <h4 className="text-lg font-bold text-foreground">
                  {fitScore ? `${fitScore * 10}%` : "N/A"}
                </h4>
              </div>
              <div className="size-9 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                <CheckCircle2Icon className="size-4.5" />
              </div>
            </div>
          </div>
        )
      })()}

      {/* 2. Notification for ready transcript */}
      {!feedback && !isPending && (
        <Card className="rounded-[20px] border border-primary/20 bg-primary/5 p-4.5 flex gap-3 items-start animate-in fade-in duration-300">
          <FileCheck2Icon className="size-5 text-primary shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h4 className="text-sm font-bold text-foreground">Transcript hội thoại đã sẵn sàng</h4>
            <p className="text-xs text-muted-foreground">
              Buổi phỏng vấn đã được ghi nhận thành công. Bạn hãy bấm <strong>Tạo đánh giá AI</strong> để nhận kết quả phân tích năng lực chi tiết.
            </p>
          </div>
        </Card>
      )}

      {/* 5. Feedback Section - Conditionally shown ONLY when feedback is generated */}
      {feedback && (
        <div id="ai-feedback-section" className="scroll-mt-6 animate-in fade-in duration-300">
          <Card className="rounded-[20px] border border-border bg-card shadow-xs overflow-hidden">
            <CardContent className="p-5 md:p-6 space-y-5">

              <div className="flex items-center gap-2 pb-1 border-b border-border">
                <SparklesIcon className="size-4.5 text-primary" />
                <h3 className="text-base font-bold text-foreground">📊 Đánh giá AI</h3>
              </div>

              {/* Tabs list (Notion style) */}
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full space-y-4">
                <TabsList className="flex w-full flex-nowrap overflow-x-auto gap-1 rounded-xl bg-muted border border-border p-1">
                  <TabsTrigger
                    value="overview"
                    className="rounded-lg px-3 py-1.5 text-xs font-bold data-[state=active]:bg-card data-[state=active]:text-primary data-[state=active]:shadow-2xs cursor-pointer flex-1"
                  >
                    Tổng quan
                  </TabsTrigger>
                  <TabsTrigger
                    value="strengths"
                    className="rounded-lg px-3 py-1.5 text-xs font-bold data-[state=active]:bg-card data-[state=active]:text-primary data-[state=active]:shadow-2xs cursor-pointer flex-1"
                  >
                    Điểm mạnh
                  </TabsTrigger>
                  <TabsTrigger
                    value="improvements"
                    className="rounded-lg px-3 py-1.5 text-xs font-bold data-[state=active]:bg-card data-[state=active]:text-primary data-[state=active]:shadow-2xs cursor-pointer flex-1"
                  >
                    Điểm cần cải thiện
                  </TabsTrigger>
                  {/* <TabsTrigger
                    value="suggestions"
                    className="rounded-lg px-3 py-1.5 text-xs font-bold data-[state=active]:bg-card data-[state=active]:text-primary data-[state=active]:shadow-2xs cursor-pointer flex-1"
                  >
                    Gợi ý trả lời tốt hơn
                  </TabsTrigger> */}
                </TabsList>

                {/* Tabs Markdown Rendering */}
                <div className="prose prose-slate dark:prose-invert max-w-none text-foreground leading-relaxed text-sm md:text-[15px] space-y-4 prose-headings:font-bold prose-headings:text-foreground prose-h2:text-base prose-h2:border-l-4 prose-h2:border-primary prose-h2:pl-2">
                  <TabsContent value="overview">
                    <MarkdownRenderer>{feedback}</MarkdownRenderer>
                  </TabsContent>
                  <TabsContent value="strengths">
                    {strengthsText ? (
                      <MarkdownRenderer>{strengthsText}</MarkdownRenderer>
                    ) : (
                      <div className="p-6 bg-muted rounded-2xl border border-border text-muted-foreground text-center text-xs">
                        Không trích xuất được riêng điểm mạnh, vui lòng xem tại tab Tổng quan.
                      </div>
                    )}
                  </TabsContent>
                  <TabsContent value="improvements">
                    {improvementsText ? (
                      <MarkdownRenderer>{improvementsText}</MarkdownRenderer>
                    ) : (
                      <div className="p-6 bg-muted rounded-2xl border border-border text-muted-foreground text-center text-xs">
                        Không trích xuất được riêng điểm cần cải thiện, vui lòng xem tại tab Tổng quan.
                      </div>
                    )}
                  </TabsContent>
                  <TabsContent value="suggestions">
                    {suggestionsText ? (
                      <MarkdownRenderer>{suggestionsText}</MarkdownRenderer>
                    ) : (
                      <div className="p-6 bg-muted rounded-2xl border border-border text-muted-foreground text-center text-xs">
                        Không trích xuất được riêng gợi ý, vui lòng xem tại tab Tổng quan.
                      </div>
                    )}
                  </TabsContent>
                </div>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      )}

      {/* 4. Transcript & Conversation Section */}
      <div className="space-y-4">

        {/* Timeline block */}
        <Card className="rounded-[20px] border border-border bg-card p-4.5 shadow-xs">
          <CardContent className="p-0 space-y-2">
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">
              ⏱ Timeline cuộc phỏng vấn
            </span>
            <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-xs font-semibold text-foreground/80 pt-1">
              <div className="flex items-center gap-1.5">
                <span className="size-2 rounded-full bg-emerald-500" />
                <span>00:00 Bắt đầu phỏng vấn</span>
              </div>
              <div className="h-3 w-[1px] bg-border hidden sm:block" />
              <div className="flex items-center gap-1.5">
                <span className="size-2 rounded-full bg-blue-500" />
                <span>00:01 Giới thiệu ứng viên</span>
              </div>
              <div className="h-3 w-[1px] bg-border hidden sm:block" />
              <div className="flex items-center gap-1.5">
                <span className="size-2 rounded-full bg-purple-500" />
                <span>00:03 Câu hỏi chuyên môn</span>
              </div>
              <div className="h-3 w-[1px] bg-border hidden sm:block" />
              <div className="flex items-center gap-1.5">
                <span className="size-2 rounded-full bg-red-500" />
                <span>{interview.duration || "00:10"} Kết thúc</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Unified Chat Transcript Container */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 pb-1">
            <MessageSquareIcon className="size-4 text-muted-foreground" />
            <h3 className="text-base font-bold text-foreground">Nội dung phỏng vấn</h3>
          </div>

          {messages.length === 0 ? (
            <Card className="rounded-[20px] border border-border bg-card p-10 text-center shadow-xs">
              <CardContent className="space-y-3.5 flex flex-col items-center justify-center p-0">
                <div className="size-12 rounded-full bg-muted flex items-center justify-center border border-border">
                  <MessageSquareIcon className="size-6 text-muted-foreground" />
                </div>
                <div className="space-y-1">
                  <h4 className="text-base font-bold text-foreground">Không có dữ liệu cuộc phỏng vấn</h4>
                  <p className="text-xs text-muted-foreground max-w-xs mx-auto">Cuộc phỏng vấn này chưa có thông tin transcript hội thoại để hiển thị.</p>
                </div>
                <Button asChild className="rounded-xl font-bold text-xs h-9 bg-primary hover:bg-primary/95 text-primary-foreground cursor-pointer px-4">
                  <Link href="/app/interview">Quay lại phỏng vấn</Link>
                </Button>
              </CardContent>
            </Card>
          ) : (
            <Card className="rounded-[20px] border border-border bg-card p-4 shadow-xs">
              <CardContent className="p-0 space-y-4 max-h-[500px] overflow-y-auto pr-1">
                {messages.map((message, index) => {
                  const isUser = message.isUser
                  return (
                    <div
                      key={index}
                      className={cn(
                        "flex items-start gap-3 w-full p-3.5 rounded-2xl bg-card border border-border/40 transition-all hover:bg-muted/40",
                        isUser ? "flex-row-reverse" : "flex-row"
                      )}
                    >
                      {/* Avatar */}
                      {isUser ? (
                        <div className="size-8 rounded-full bg-primary flex items-center justify-center flex-shrink-0 shadow-xs border border-primary/20 relative">
                          {user.imageUrl ? (
                            <img
                              src={user.imageUrl}
                              alt={user.name}
                              className="size-full rounded-full object-cover"
                              onError={(e) => {
                                e.currentTarget.style.display = 'none';
                              }}
                            />
                          ) : null}
                          <UserIcon className="size-4 text-primary-foreground absolute" />
                        </div>
                      ) : (
                        <div className="size-8 rounded-full bg-muted flex items-center justify-center flex-shrink-0 border border-border shadow-xs">
                          <BotIcon className="size-4 text-muted-foreground" />
                        </div>
                      )}

                      {/* Chat Bubble (ChatGPT style) */}
                      <div className={cn(
                        "flex flex-col max-w-[70%] gap-1",
                        isUser ? "items-end text-right" : "items-start text-left"
                      )}>
                        <span className="text-[10px] font-bold text-muted-foreground px-1 uppercase tracking-wider">
                          {isUser ? "Bạn" : "AI Interviewer"}
                        </span>

                        <div
                          className={cn(
                            "px-4 py-2.5 rounded-2xl text-xs md:text-sm leading-relaxed",
                            isUser
                              ? "bg-muted text-foreground rounded-tr-none border border-border"
                              : "bg-card text-foreground rounded-tl-none border border-border"
                          )}
                        >
                          {message.content.map((text, i) => (
                            <p key={i} className={cn(i > 0 && "mt-1.5")}>
                              {text}
                            </p>
                          ))}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
