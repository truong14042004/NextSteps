"use client"

import { Button } from "@/components/ui/button"
import { env } from "@/data/env/client"
import { createInterview, updateInterview } from "@/features/interviews/actions"
import { errorToast } from "@/lib/errorToast"
import Vapi from "@vapi-ai/web"
import { Loader2Icon, MicIcon, MicOffIcon, PhoneOffIcon, ArrowLeftIcon } from "lucide-react"
import { useRouter } from "next/navigation"
import { useEffect, useRef, useState } from "react"
import { InterviewJobInfo } from "./page"
import { toast } from "sonner"

export function VapiInterviewCall({ jobInfo, onBack }: { jobInfo: InterviewJobInfo; onBack?: () => void }) {
  const [vapi, setVapi] = useState<Vapi | null>(null)
  const [isConnecting, setIsConnecting] = useState(false)
  const [isCallActive, setIsCallActive] = useState(false)
  const [isInterviewComplete, setIsInterviewComplete] = useState(false)
  const [isMuted, setIsMuted] = useState(false)
  const [messages, setMessages] = useState<Array<{ role: "assistant" | "user"; content: string }>>([])
  const [liveTranscript, setLiveTranscript] = useState<{ role: "assistant" | "user"; content: string } | null>(null)
  const [duration, setDuration] = useState("00:00:00")
  const [interviewId, setInterviewId] = useState<string | null>(null)
  
  const durationIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const callStartRef = useRef<number>(0)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const messagesRef = useRef<Array<{ role: "assistant" | "user"; content: string }>>([])
  const interviewIdRef = useRef<string | null>(null)
  const durationRef = useRef<string>("00:00:00")
  const router = useRouter()

  // Keep refs in sync with state
  useEffect(() => { messagesRef.current = messages }, [messages])
  useEffect(() => { interviewIdRef.current = interviewId }, [interviewId])
  useEffect(() => { durationRef.current = duration }, [duration])

  // Initialize Vapi
  useEffect(() => {
    if (!env.NEXT_PUBLIC_VAPI_PUBLIC_KEY) {
      console.error("❌ Vapi public key not found")
      return
    }

    const vapiInstance = new Vapi(env.NEXT_PUBLIC_VAPI_PUBLIC_KEY)
    setVapi(vapiInstance)

    // Event listeners
    vapiInstance.on("call-start", () => {
      console.log("✅ Call started")
      setIsConnecting(false)
      setIsCallActive(true)
      callStartRef.current = Date.now()
      
      // Start duration tracker
      durationIntervalRef.current = setInterval(() => {
        const elapsed = Math.floor((Date.now() - callStartRef.current) / 1000)
        const hours = Math.floor(elapsed / 3600).toString().padStart(2, "0")
        const minutes = Math.floor((elapsed % 3600) / 60).toString().padStart(2, "0")
        const seconds = (elapsed % 60).toString().padStart(2, "0")
        setDuration(`${hours}:${minutes}:${seconds}`)
      }, 1000)
    })

    vapiInstance.on("call-end", async () => {
      console.log("📞 Call ended")
      setIsCallActive(false)
      setIsConnecting(false)
      if (durationIntervalRef.current) {
        clearInterval(durationIntervalRef.current)
      }

      const currentId = interviewIdRef.current
      const currentDuration = durationRef.current
      const currentMessages = messagesRef.current

      if (currentId && currentDuration !== "00:00:00") {
        // Save final duration + vapi transcript
        await updateInterview(currentId, {
          duration: currentDuration,
          vapiTranscript: JSON.stringify(currentMessages),
        })
        router.push(`/app/interview/${currentId}`)
      } else {
        toast.info("Phỏng vấn chưa được bắt đầu")
        router.push("/app/interview")
      }
    })

    vapiInstance.on("speech-start", () => {
      console.log("🗣️ User started speaking")
    })

    vapiInstance.on("speech-end", () => {
      console.log("🤐 User stopped speaking")
    })

    vapiInstance.on("message", (message: any) => {
      // User speech: use Deepgram transcript (final only)
      if (message.type === "transcript" && message.role === "user") {
        if (message.transcriptType === "final") {
          setMessages(prev => [...prev, { role: "user", content: message.transcript }])
          setLiveTranscript(null)
        } else {
          setLiveTranscript({ role: "user", content: message.transcript })
        }
      }

      // AI text: use actual LLM output from conversation-update (not garbled audio transcription)
      if (message.type === "conversation-update") {
        const conversation: Array<{ role: string; content: string }> = message.conversation ?? []
        // Find the last assistant message from the full conversation
        const lastAssistant = [...conversation].reverse().find(m => m.role === "assistant")
        if (lastAssistant?.content) {
          setMessages(prev => {
            // Avoid duplicating if already the last message
            const last = prev.at(-1)
            if (last?.role === "assistant" && last.content === lastAssistant.content) return prev
            // Replace the last assistant message (streaming update) or append
            if (last?.role === "assistant") {
              return [...prev.slice(0, -1), { role: "assistant", content: lastAssistant.content }]
            }
            return [...prev, { role: "assistant", content: lastAssistant.content }]
          })
          setLiveTranscript(null)

          // Detect closing phrase → mark interview as complete
          const closingPhrases = ["chúc bạn may mắn", "buổi phỏng vấn đã hoàn tất", "cảm ơn bạn đã dành thời gian"]
          const isClosing = closingPhrases.some(p => lastAssistant.content.toLowerCase().includes(p))
          if (isClosing) {
            setIsInterviewComplete(true)
          }
        }
      }
    })

    vapiInstance.on("error", (error: any) => {
      console.error("❌ Vapi error:", error)
      toast.error("Lỗi kết nối voice interview")
      setIsConnecting(false)
      setIsCallActive(false)
    })

    return () => {
      if (durationIntervalRef.current) {
        clearInterval(durationIntervalRef.current)
      }
      vapiInstance.stop()
    }
  }, [])

  // Update interview duration periodically
  useEffect(() => {
    if (!interviewId || !isCallActive) return

    const intervalId = setInterval(() => {
      if (duration !== "00:00:00") {
        updateInterview(interviewId, { duration })
      }
    }, 10000) // Every 10 seconds

    return () => clearInterval(intervalId)
  }, [interviewId, duration, isCallActive])

  // Auto-end call when interview is complete
  useEffect(() => {
    if (!isInterviewComplete) return
    const timer = setTimeout(() => {
      if (vapi) vapi.stop()
    }, 5000)
    return () => clearTimeout(timer)
  }, [isInterviewComplete, vapi])

  const handleStartCall = async () => {
    if (!vapi || !env.NEXT_PUBLIC_VAPI_ASSISTANT_ID) {
      toast.error("Vapi chưa được cấu hình đúng")
      return
    }

    console.log("🎤 Starting interview...")
    setIsConnecting(true)

    try {
      // Create interview in database
      const res = await createInterview({ jobInfoId: jobInfo.id })
      if (res.error) {
        console.error("❌ Failed to create interview:", res.message)
        setIsConnecting(false)
        return errorToast(res.message)
      }

      console.log("✅ Interview created, ID:", res.id)
      setInterviewId(res.id)

      // Start Vapi call - override system prompt with dynamic candidate info
      await vapi.start({
        transcriber: {
          provider: "deepgram",
          model: "nova-2",
          language: "vi", // Vietnamese transcription
        },
        model: {
          provider: "openai",
          model: "gpt-4o",
          messages: [
            {
              role: "system",
              content: `Bạn là một AI interviewer chuyên nghiệp đang phỏng vấn tuyển dụng. 

QUAN TRỌNG: Bạn PHẢI nói và trả lời HOÀN TOÀN BẰNG TIẾNG VIỆT. Không được dùng tiếng Anh.

Thông tin ứng viên:
- Tên: ${jobInfo.name}
- Vị trí ứng tuyển: ${jobInfo.title}
- Cấp độ kinh nghiệm: ${jobInfo.experienceLevel}
- Mô tả công việc: ${jobInfo.description}${jobInfo.cvSummary ? `\n- Thông tin CV ứng viên:\n${jobInfo.cvSummary}` : ""}

Nhiệm vụ:
1. Chào hỏi ứng viên thân thiện, giới thiệu bản thân và mục đích buổi phỏng vấn
2. Hỏi đúng 5 câu hỏi phỏng vấn phù hợp với vị trí và cấp độ kinh nghiệm
3. Từng câu hỏi một — chờ ứng viên trả lời hoàn toàn xong mới hỏi tiếp
4. Sau mỗi câu trả lời, phản hồi ngắn gọn (1 câu) thể hiện bạn đã lắng nghe trước khi chuyển sang câu tiếp theo
5. Nếu ứng viên trả lời quá ngắn hoặc không rõ, hỏi thêm 1 câu làm rõ
6. Kết thúc: "Cảm ơn bạn đã dành thời gian tham gia buổi phỏng vấn hôm nay. Chúc bạn may mắn!"

Cấu trúc 5 câu hỏi theo cấp độ:

Intern/Fresher:
- Câu 1: Giới thiệu bản thân và lý do ứng tuyển vị trí này
- Câu 2: Kiến thức nền tảng liên quan đến vị trí (lý thuyết, học phần)
- Câu 3: Dự án cá nhân hoặc đồ án đã làm
- Câu 4: Khả năng học hỏi và xử lý khi gặp vấn đề mới
- Câu 5: Mục tiêu nghề nghiệp trong 1-2 năm tới

Junior:
- Câu 1: Giới thiệu kinh nghiệm làm việc và dự án nổi bật nhất
- Câu 2: Công nghệ/tech stack đã sử dụng và mức độ thành thạo
- Câu 3: Tình huống cụ thể gặp bug hoặc vấn đề kỹ thuật và cách giải quyết
- Câu 4: Cách làm việc nhóm và giao tiếp với đồng nghiệp/khách hàng
- Câu 5: Định hướng phát triển kỹ năng trong thời gian tới

Mid-level/Senior:
- Câu 1: Dự án lớn nhất từng tham gia và vai trò cụ thể
- Câu 2: Kinh nghiệm thiết kế hệ thống hoặc kiến trúc giải pháp
- Câu 3: Cách mentor/hỗ trợ thành viên junior trong team
- Câu 4: Tình huống xử lý conflict trong team hoặc với stakeholder
- Câu 5: Tầm nhìn kỹ thuật và đóng góp cho tổ chức

Phong cách phỏng vấn:
- Thân thiện, chuyên nghiệp, tạo không khí thoải mái
- Lắng nghe chủ động, không ngắt lời ứng viên
- Câu hỏi rõ ràng, không dùng thuật ngữ gây nhầm lẫn
- Giữ nhịp độ phỏng vấn tự nhiên, không vội vàng

NÓI TIẾNG VIỆT HOÀN TOÀN TRONG SUỐT CUỘC PHỎNG VẤN.`,
            },
          ],
          temperature: 0.7,
          maxTokens: 200,
        },
        // voice is intentionally omitted — uses the voice configured in Vapi dashboard
        firstMessage: `Xin chào ${jobInfo.name}! Tôi là AI Interviewer. Hôm nay tôi sẽ phỏng vấn bạn cho vị trí ${jobInfo.title}. Bạn đã sẵn sàng chưa?`,
        name: "AI Interviewer",
      })
    } catch (error) {
      console.error("❌ Failed to start call:", error)
      toast.error("Không thể bắt đầu cuộc gọi")
      setIsConnecting(false)
    }
  }

  const handleEndCall = () => {
    if (vapi) {
      vapi.stop()
    }
  }

  const handleToggleMute = () => {
    if (vapi) {
      if (isMuted) {
        vapi.setMuted(false)
      } else {
        vapi.setMuted(true)
      }
      setIsMuted(!isMuted)
    }
  }

  // Derived values
  const questionCount = messages.filter(m => m.role === "assistant").length
  const currentQuestion = questionCount > 0 ? questionCount : 1
  const latestAiMessage =
    (liveTranscript?.role === "assistant" ? liveTranscript : null) ??
    messages.filter(m => m.role === "assistant").at(-1)
  const allMessages = [
    ...messages,
    ...(liveTranscript ? [liveTranscript] : []),
  ]

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [allMessages.length])

  // Idle state - show start button
  if (!isConnecting && !isCallActive) {
    return (
      <div className="h-screen-header flex flex-col items-center justify-center gap-8">
        <div className="text-center space-y-2 max-w-md">
          <h2 className="text-2xl font-bold">Sẵn sàng bắt đầu phỏng vấn?</h2>
          <div className="space-y-1 text-sm text-muted-foreground">
            <p><strong>Ứng viên:</strong> {jobInfo.name}</p>
            <p><strong>Vị trí:</strong> {jobInfo.title}</p>
          </div>
        </div>
        
        <div className="flex gap-4">
          <Button
            variant="outline"
            size="lg"
            onClick={() => onBack ? onBack() : router.push("/app/interview")}
          >
            <ArrowLeftIcon className="size-4 mr-2" />
            Quay lại
          </Button>
          <Button
            size="lg"
            onClick={handleStartCall}
          >
            <MicIcon className="size-4 mr-2" />
            Bắt đầu phỏng vấn
          </Button>
        </div>
      </div>
    )
  }

  // Connecting state
  if (isConnecting) {
    return (
      <div className="h-screen-header flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2Icon className="animate-spin size-12 mx-auto text-primary" />
          <div className="space-y-1">
            <p className="font-medium">Đang kết nối...</p>
            <p className="text-sm text-muted-foreground">
              Chuẩn bị phỏng vấn AI của bạn
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="h-screen-header flex flex-col">
      {/* Header */}
      <div className="border-b bg-background">
        <div className="container max-w-3xl py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="size-12 rounded-full bg-primary/10 flex items-center justify-center">
                <span className="text-2xl">🤖</span>
              </div>
              <div>
                <h2 className="font-semibold">AI Interviewer</h2>
                <p className="text-sm text-muted-foreground">
                  Câu hỏi {currentQuestion}/5 • {duration}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Current AI Question */}
      {latestAiMessage && (
        <div className="border-b bg-primary/5">
          <div className="container max-w-3xl py-6">
            <div className="space-y-2">
              <p className="text-sm font-medium text-primary">
                Câu hỏi hiện tại:
              </p>
              <p className="text-lg leading-relaxed">
                {latestAiMessage.content}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Messages History */}
      <div className="flex-1 overflow-auto">
        <div className="container max-w-3xl py-6">
          {messages.length === 0 && !liveTranscript ? (
            <div className="text-center py-12 text-muted-foreground">
              <p>Đang chờ AI bắt đầu cuộc phỏng vấn...</p>
            </div>
          ) : (
            <>
              <p className="text-xs font-medium text-muted-foreground mb-4 uppercase tracking-wide">
                Lịch sử trò chuyện
              </p>
              <div className="space-y-4">
                {allMessages.map((message, index) => {
                  const isLive = liveTranscript && index === allMessages.length - 1
                  return (
                    <div
                      key={index}
                      className={`flex items-start gap-3 ${
                        message.role === "user" ? "justify-end" : "justify-start"
                      }`}
                    >
                      {message.role === "assistant" && (
                        <div className="size-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                          <span className="text-sm">🤖</span>
                        </div>
                      )}
                      <div
                        className={`px-4 py-3 rounded-lg max-w-[80%] ${
                          message.role === "user"
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted"
                        } ${isLive ? "opacity-70 italic" : ""}`}
                      >
                        <p className="text-sm">{message.content}</p>
                      </div>
                      {message.role === "user" && (
                        <div className="size-8 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                          <span className="text-sm">👤</span>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
              <div ref={messagesEndRef} />
            </>
          )}
        </div>
      </div>

      {/* Controls */}
      <div className="border-t bg-background">
        <div className="container max-w-3xl py-6">
          {isInterviewComplete ? (
            <div className="flex flex-col items-center gap-3">
              <p className="text-sm font-medium text-green-600 dark:text-green-400">
                Phỏng vấn đã hoàn tất! Tự động kết thúc sau 5 giây...
              </p>
              <Button
                size="lg"
                onClick={handleEndCall}
                className="px-8"
              >
                Kết thúc &amp; Xem kết quả
              </Button>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-center gap-4">
                <Button
                  size="lg"
                  variant={isMuted ? "default" : "outline"}
                  onClick={handleToggleMute}
                  className="rounded-full size-14"
                >
                  {isMuted ? <MicOffIcon className="size-5" /> : <MicIcon className="size-5" />}
                </Button>
                <Button
                  size="lg"
                  variant="destructive"
                  onClick={handleEndCall}
                  className="rounded-full size-14"
                >
                  <PhoneOffIcon className="size-5" />
                </Button>
              </div>
              <p className="text-center text-sm text-muted-foreground mt-4">
                {isMuted ? "Microphone đã tắt" : "Microphone đang bật"}
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
