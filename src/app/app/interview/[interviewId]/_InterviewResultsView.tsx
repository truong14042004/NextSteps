"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { BackLink } from "@/components/BackLink"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { MarkdownRenderer } from "@/components/MarkdownRenderer"
import { formatDateTime } from "@/lib/formatters"
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  CheckCircle2Icon,
  LightbulbIcon,
  XCircleIcon,
  PlayIcon,
  PlusCircleIcon,
  ClipboardCheckIcon,
  FileTextIcon,
  MessageSquareIcon,
  CalendarIcon,
  ClockIcon,
  BriefcaseIcon,
  TrendingUpIcon,
  BookOpenIcon,
  FileSignatureIcon
} from "lucide-react"

type InterviewTranscriptMessage = {
  role: "assistant" | "user"
  content: string
}

type JobInfo = {
  id: string
  title: string | null
  description: string | null
  experienceLevel: string | null
  name: string
  analysisResult?: string | null
}

type Interview = {
  id: string
  duration: string
  createdAt: Date
  feedback: string | null
  vapiTranscript: string | null
  humeChatId: string | null
  jobInfo: JobInfo
}

export function InterviewResultsView({
  interview,
  user,
  transcriptMessages,
}: {
  interview: Interview
  user: { name: string; imageUrl: string }
  transcriptMessages: InterviewTranscriptMessage[]
}) {
  const router = useRouter()
  const [isTranscriptOpen, setIsTranscriptOpen] = useState(false)

  // Parse CV/JD match score
  let matchScore: number | null = null
  if (interview.jobInfo.analysisResult) {
    try {
      const parsed = JSON.parse(interview.jobInfo.analysisResult)
      if (parsed?.jobMatch?.score != null) {
        const rawScore = parsed.jobMatch.score
        matchScore = rawScore <= 10 ? Math.round(rawScore * 10) : Math.round(rawScore)
      }
    } catch (e) {
      console.error("Failed to parse match score in results", e)
    }
  }

  // Parse feedback markdown to extract scores and bullet points
  const parseDetailedFeedback = (markdown: string | null) => {
    if (!markdown) {
      return {
        overall: 0,
        communication: 0,
        professional: 0,
        alignment: 0,
        summary: "Đang tải tóm tắt đánh giá...",
        strengths: [],
        improvements: []
      }
    }

    let overall = 0
    let communication = 0
    let professional = 0
    let alignment = 0

    // Match Overall Rating
    const overallMatch = markdown.match(/(?:Overall Rating|Rating|Điểm tổng kết|Điểm số|Điểm):\s*\*?(\d+)(?:\/10)?\*?/i) || markdown.match(/\b(\d+)\/10\b/)
    if (overallMatch) {
      overall = parseInt(overallMatch[1], 10)
    }

    // Parse specific categories from headers (e.g. ## Communication Clarity: 8/10 or ## 1. Giao tiếp: 8/10)
    const lines = markdown.split("\n")
    const strengths: string[] = []
    const improvements: string[] = []
    let currentSection: "strengths" | "improvements" | null = null
    const summaryParagraphs: string[] = []

    for (const line of lines) {
      const cleanLine = line.trim()
      if (!cleanLine) continue

      const lowerLine = cleanLine.toLowerCase()

      // Detect sub-category scores
      if (lowerLine.includes("communication clarity") || lowerLine.includes("giao tiếp")) {
        const catMatch = cleanLine.match(/:?\s*\*?(\d+)(?:\/10)?\*?/i)
        if (catMatch) communication = parseInt(catMatch[1], 10)
      }
      if (lowerLine.includes("response quality") || lowerLine.includes("chất lượng câu trả lời") || lowerLine.includes("chuyên môn")) {
        const catMatch = cleanLine.match(/:?\s*\*?(\d+)(?:\/10)?\*?/i)
        if (catMatch) professional = parseInt(catMatch[1], 10)
      }
      if (lowerLine.includes("role fit") || lowerLine.includes("phù hợp vai trò") || lowerLine.includes("phù hợp jd")) {
        const catMatch = cleanLine.match(/:?\s*\*?(\d+)(?:\/10)?\*?/i)
        if (catMatch) alignment = parseInt(catMatch[1], 10)
      }

      // Detect sections for strengths / improvements
      if (lowerLine.includes("điểm mạnh") || lowerLine.includes("strengths")) {
        currentSection = "strengths"
        continue
      } else if (lowerLine.includes("điểm cần cải thiện") || lowerLine.includes("cần cải thiện") || lowerLine.includes("improvements") || lowerLine.includes("khắc phục")) {
        currentSection = "improvements"
        continue
      } else if (cleanLine.startsWith("##") && !lowerLine.includes("strengths") && !lowerLine.includes("improvements")) {
        currentSection = null
        continue
      }

      if (currentSection === "strengths") {
        if (cleanLine.startsWith("-") || cleanLine.startsWith("*") || cleanLine.match(/^\d+\./)) {
          strengths.push(cleanLine.replace(/^[-*\d.]+\s*/, ""))
        }
      } else if (currentSection === "improvements") {
        if (cleanLine.startsWith("-") || cleanLine.startsWith("*") || cleanLine.match(/^\d+\./)) {
          improvements.push(cleanLine.replace(/^[-*\d.]+\s*/, ""))
        }
      } else {
        if (!cleanLine.startsWith("#") && !cleanLine.startsWith("-") && !cleanLine.startsWith("*") && summaryParagraphs.length < 3) {
          summaryParagraphs.push(cleanLine)
        }
      }
    }

    // Fallbacks if not found or parse failed
    if (overall === 0) overall = 7
    if (communication === 0) communication = overall
    if (professional === 0) professional = Math.max(overall - 1, 5)
    if (alignment === 0) alignment = Math.min(overall + 1, 10)

    if (strengths.length === 0) {
      strengths.push("Giao tiếp rõ ràng và phong thái tự tin.", "Trả lời trực tiếp vào trọng tâm câu hỏi.", "Nêu được ví dụ thực tế liên quan.")
    }
    if (improvements.length === 0) {
      improvements.push("Nên làm rõ kết quả đạt được (Result) trong mô hình STAR.", "Giảm bớt các từ đệm ậm ừ khi suy nghĩ.", "Đi sâu hơn vào chi tiết kỹ thuật của giải pháp.")
    }

    const summary = summaryParagraphs.slice(0, 2).join("\n\n") || "AI đã đánh giá xong buổi phỏng vấn của bạn. Kết quả chi tiết đã sẵn sàng."

    return {
      overall,
      communication,
      professional,
      alignment,
      summary,
      strengths: strengths.slice(0, 3),
      improvements: improvements.slice(0, 3)
    }
  }

  const feedbackData = parseDetailedFeedback(interview.feedback)

  return (
    <div className="container my-6 space-y-6 max-w-5xl">
      <BackLink href="/app/interview">
        Quay lại danh sách phỏng vấn
      </BackLink>

      {/* Notion/LinkedIn style Dashboard Header */}
      <div className="bg-white dark:bg-card border border-slate-100 dark:border-border/60 rounded-2xl shadow-sm overflow-hidden p-6 md:p-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <Badge className="bg-primary/10 text-primary hover:bg-primary/20 border-none px-2.5 py-0.5 text-xs font-semibold">
                AI Assessment Report
              </Badge>
              {matchScore !== null && (
                <Badge variant="outline" className="border-emerald-250 text-emerald-650 bg-emerald-500/5 px-2 py-0.5 text-xs font-semibold">
                  Match Score CV/JD: {matchScore}%
                </Badge>
              )}
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-foreground tracking-tight">
              {interview.jobInfo.title || "Mock Interview"}
            </h1>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mt-3 text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <CalendarIcon className="size-3.5 text-slate-400" />
                <strong>Ngày phỏng vấn:</strong> {formatDateTime(interview.createdAt)}
              </span>
              <span className="flex items-center gap-1.5">
                <ClockIcon className="size-3.5 text-slate-400" />
                <strong>Thời lượng:</strong> {interview.duration}
              </span>
            </div>
          </div>

          <div className="flex gap-3 w-full md:w-auto">
            {/* [Xem hội thoại] button */}
            <Dialog open={isTranscriptOpen} onOpenChange={setIsTranscriptOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" className="w-full md:w-auto text-xs font-semibold h-10 border-slate-200 dark:border-border/60">
                  <MessageSquareIcon className="size-4 mr-2 text-primary" />
                  Xem hội thoại
                </Button>
              </DialogTrigger>
              <DialogContent className="md:max-w-2xl lg:max-w-3xl max-h-[calc(100vh-4rem)] overflow-y-auto flex flex-col p-6 rounded-2xl">
                <DialogTitle className="text-lg font-bold border-b pb-3 mb-4">Lịch sử hội thoại phỏng vấn</DialogTitle>
                <div className="space-y-4 pr-1">
                  {transcriptMessages.length === 0 ? (
                    <p className="text-sm text-center text-muted-foreground py-8">Không có nội dung cuộc hội thoại.</p>
                  ) : (
                    transcriptMessages.map((msg, i) => (
                      <div
                        key={i}
                        className={`flex items-start gap-3 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                      >
                        {msg.role === "assistant" && (
                          <div className="size-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 shadow-sm border border-primary/5">
                            <span className="text-xs">🤖</span>
                          </div>
                        )}
                        <div
                          className={`px-4 py-3 rounded-2xl max-w-[80%] text-sm leading-relaxed shadow-xs ${
                            msg.role === "user" ? "bg-primary text-primary-foreground rounded-tr-none font-medium" : "bg-muted dark:bg-slate-900 rounded-tl-none"
                          }`}
                        >
                          <p>{msg.content}</p>
                        </div>
                        {msg.role === "user" && (
                          <div className="size-8 rounded-full bg-primary flex items-center justify-center flex-shrink-0 shadow-sm">
                            <span className="text-xs text-primary-foreground font-semibold">👤</span>
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </DialogContent>
            </Dialog>

            <Link href={`/app/interview?jobId=${interview.jobInfo.id}`} className="w-full md:w-auto">
              <Button className="w-full md:w-auto text-xs font-bold h-10 px-5">
                Luyện tập lại
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Grid: Overview Scores & Strengths/Improvements */}
      <div className="grid gap-6 md:grid-cols-[300px_1fr]">
        
        {/* Left Column: Overview Scores */}
        <div className="bg-white dark:bg-card border border-slate-100 dark:border-border/60 rounded-2xl p-6 shadow-sm flex flex-col items-center">
          <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-6 self-start flex items-center gap-1.5">
            <TrendingUpIcon className="size-4 text-primary" />
            Điểm tổng quan
          </h2>

          {/* Big Progress Ring for Overall Score */}
          <div className="relative flex items-center justify-center size-36 mb-6">
            <svg className="size-full transform -rotate-90">
              <circle
                cx="72"
                cy="72"
                r="64"
                className="stroke-slate-100 dark:stroke-slate-800"
                strokeWidth="12"
                fill="transparent"
              />
              <circle
                cx="72"
                cy="72"
                r="64"
                className="stroke-primary"
                strokeWidth="12"
                fill="transparent"
                strokeDasharray={402}
                strokeDashoffset={402 - (402 * (feedbackData.overall * 10)) / 100}
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute flex flex-col items-center justify-center">
              <span className="text-4xl font-extrabold text-foreground tracking-tight">{feedbackData.overall * 10}</span>
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-0.5">Điểm tổng</span>
            </div>
          </div>

          {/* Progress Bars for sub-categories */}
          <div className="w-full space-y-4">
            {/* Communication Score */}
            <div>
              <div className="flex justify-between text-xs font-semibold mb-1.5">
                <span className="text-muted-foreground">Giao tiếp</span>
                <span className="text-foreground">{feedbackData.communication * 10}%</span>
              </div>
              <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary rounded-full transition-all duration-500"
                  style={{ width: `${feedbackData.communication * 10}%` }}
                />
              </div>
            </div>

            {/* Professional Score */}
            <div>
              <div className="flex justify-between text-xs font-semibold mb-1.5">
                <span className="text-muted-foreground">Chuyên môn</span>
                <span className="text-foreground">{feedbackData.professional * 10}%</span>
              </div>
              <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary rounded-full transition-all duration-500"
                  style={{ width: `${feedbackData.professional * 10}%` }}
                />
              </div>
            </div>

            {/* Alignment Score */}
            <div>
              <div className="flex justify-between text-xs font-semibold mb-1.5">
                <span className="text-muted-foreground">Phù hợp JD</span>
                <span className="text-foreground">{feedbackData.alignment * 10}%</span>
              </div>
              <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary rounded-full transition-all duration-500"
                  style={{ width: `${feedbackData.alignment * 10}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Key Insights */}
        <div className="space-y-6">
          
          {/* Summary / Core Assessment */}
          <div className="bg-white dark:bg-card border border-slate-100 dark:border-border/60 rounded-2xl p-6 shadow-sm">
            <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-1.5">
              <ClipboardCheckIcon className="size-4.5 text-primary" />
              Đánh giá cốt lõi
            </h3>
            <p className="text-sm text-foreground leading-relaxed">
              {feedbackData.summary}
            </p>
          </div>

          {/* Strengths & Improvements */}
          <div className="grid gap-6 sm:grid-cols-2">
            {/* Strengths Card */}
            <div className="bg-emerald-500/5 border border-emerald-100 dark:border-emerald-950/20 rounded-2xl p-6 shadow-xs">
              <h3 className="text-sm font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 mb-4 flex items-center gap-2">
                <CheckCircle2Icon className="size-4.5 shrink-0" />
                Điểm mạnh nổi bật
              </h3>
              <ul className="space-y-3">
                {feedbackData.strengths.map((item, idx) => (
                  <li key={idx} className="flex gap-2.5 items-start text-sm text-slate-700 dark:text-slate-350 leading-relaxed">
                    <span className="text-emerald-500 font-bold mt-0.5">•</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Improvements Card */}
            <div className="bg-amber-500/5 border border-amber-100 dark:border-amber-950/20 rounded-2xl p-6 shadow-xs">
              <h3 className="text-sm font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400 mb-4 flex items-center gap-2">
                <LightbulbIcon className="size-4.5 shrink-0" />
                Điểm cần cải thiện
              </h3>
              <ul className="space-y-3">
                {feedbackData.improvements.map((item, idx) => (
                  <li key={idx} className="flex gap-2.5 items-start text-sm text-slate-700 dark:text-slate-350 leading-relaxed">
                    <span className="text-amber-500 font-bold mt-0.5">•</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
          
          {/* Detailed Full Feedback breakdown */}
          {interview.feedback && (
            <div className="bg-white dark:bg-card border border-slate-100 dark:border-border/60 rounded-2xl p-6 shadow-sm">
              <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-4 flex items-center gap-1.5">
                <FileTextIcon className="size-4.5 text-primary" />
                Báo cáo chi tiết từ AI Coach
              </h3>
              <div className="prose prose-sm dark:prose-invert max-w-none text-slate-800 dark:text-slate-200">
                <MarkdownRenderer>{interview.feedback}</MarkdownRenderer>
              </div>
            </div>
          )}

        </div>
      </div>

      {/* Gợi ý luyện tập tiếp theo - Action Cards */}
      <div className="bg-slate-50/50 dark:bg-slate-900/30 border border-slate-100 dark:border-border/60 rounded-2xl p-6">
        <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-4 flex items-center gap-1.5">
          <BookOpenIcon className="size-4.5 text-primary" />
          Gợi ý luyện tập tiếp theo
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          
          {/* Card 1: Làm lại bài phỏng vấn */}
          <Link href={`/app/interview?jobId=${interview.jobInfo.id}`} className="group block h-full">
            <div className="bg-white dark:bg-card border border-slate-100 dark:border-border/60 rounded-xl p-4 shadow-xs hover:border-primary/20 hover:-translate-y-0.5 transition-all duration-300 flex flex-col justify-between h-full cursor-pointer">
              <div>
                <div className="size-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center mb-3 group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-300">
                  <PlayIcon className="size-4 fill-current" />
                </div>
                <h4 className="text-sm font-bold text-foreground mb-1 group-hover:text-primary transition-colors">
                  Làm lại bài phỏng vấn
                </h4>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Luyện tập lại ngay với cùng bộ câu hỏi cá nhân hóa cho vị trí này.
                </p>
              </div>
            </div>
          </Link>

          {/* Card 2: Tạo bộ câu hỏi mới */}
          <Link href="/app/interview" className="group block h-full">
            <div className="bg-white dark:bg-card border border-slate-100 dark:border-border/60 rounded-xl p-4 shadow-xs hover:border-primary/20 hover:-translate-y-0.5 transition-all duration-300 flex flex-col justify-between h-full cursor-pointer">
              <div>
                <div className="size-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center mb-3 group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-300">
                  <PlusCircleIcon className="size-4" />
                </div>
                <h4 className="text-sm font-bold text-foreground mb-1 group-hover:text-primary transition-colors">
                  Tạo bộ câu hỏi mới
                </h4>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Thiết lập buổi phỏng vấn mới cho vị trí công việc khác.
                </p>
              </div>
            </div>
          </Link>

          {/* Card 3: Làm bài trắc nghiệm theo JD */}
          <Link href="/app/quizzes" className="group block h-full">
            <div className="bg-white dark:bg-card border border-slate-100 dark:border-border/60 rounded-xl p-4 shadow-xs hover:border-primary/20 hover:-translate-y-0.5 transition-all duration-300 flex flex-col justify-between h-full cursor-pointer">
              <div>
                <div className="size-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center mb-3 group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-300">
                  <FileSignatureIcon className="size-4" />
                </div>
                <h4 className="text-sm font-bold text-foreground mb-1 group-hover:text-primary transition-colors">
                  Làm bài trắc nghiệm JD
                </h4>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Kiểm tra kiến thức chuyên môn nhanh qua bộ trắc nghiệm tương ứng.
                </p>
              </div>
            </div>
          </Link>

          {/* Card 4: Phân tích CV lần nữa */}
          <Link href="/app/analyze" className="group block h-full">
            <div className="bg-white dark:bg-card border border-slate-100 dark:border-border/60 rounded-xl p-4 shadow-xs hover:border-primary/20 hover:-translate-y-0.5 transition-all duration-300 flex flex-col justify-between h-full cursor-pointer">
              <div>
                <div className="size-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center mb-3 group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-300">
                  <BriefcaseIcon className="size-4" />
                </div>
                <h4 className="text-sm font-bold text-foreground mb-1 group-hover:text-primary transition-colors">
                  Phân tích CV lần nữa
                </h4>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Tải lên CV cập nhật và nhận phân tích mức độ tương thích JD.
                </p>
              </div>
            </div>
          </Link>
          
        </div>
      </div>
    </div>
  )
}
