"use client"

import { Button } from "@/components/ui/button"
import { env } from "@/data/env/client"
import { createInterview, updateInterview } from "@/features/interviews/actions"
import { errorToast } from "@/lib/errorToast"
import Vapi from "@vapi-ai/web"
import { Loader2Icon, MicIcon, MicOffIcon, PhoneOffIcon, ArrowLeftIcon } from "lucide-react"
import { useRouter } from "next/navigation"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { InterviewJobInfo } from "./page"
import { toast } from "sonner"

type InterviewTranscriptMessage = {
  role: "assistant" | "user"
  content: string
}

type VapiErrorDetails = {
  type: string | null
  message: string | null
}

function getVapiErrorDetails(error: unknown): VapiErrorDetails {
  if (typeof error === "string") {
    return { type: null, message: error }
  }

  if (error == null || typeof error !== "object") {
    return { type: null, message: null }
  }

  const payload = error as Record<string, unknown>
  const type = typeof payload.type === "string" ? payload.type : null
  const directMessage =
    typeof payload.message === "string" ? payload.message : null

  if (typeof payload.error === "string") {
    return { type, message: payload.error }
  }

  if (payload.error != null && typeof payload.error === "object") {
    const nested = payload.error as Record<string, unknown>
    const message =
      (typeof nested.message === "string" && nested.message) ||
      (typeof nested.errorMsg === "string" && nested.errorMsg) ||
      (typeof nested.errorDetail === "string" && nested.errorDetail) ||
      (typeof nested.cause === "string" && nested.cause) ||
      directMessage

    return { type, message: message ?? null }
  }

  return { type, message: directMessage }
}

function isMeetingEndedMessage(message: string | null) {
  if (message == null) return false

  const normalized = message.toLowerCase()
  return (
    normalized.includes("meeting has ended") ||
    normalized.includes("meeting ended due to ejection") ||
    normalized.includes("ended due to ejection")
  )
}

const TRANSCRIBER_KEYTERM_LIMIT = 24

const GENERIC_TRANSCRIBER_TERMS = new Set([
  "a",
  "an",
  "and",
  "are",
  "as",
  "at",
  "be",
  "build",
  "building",
  "candidate",
  "company",
  "description",
  "developer",
  "engineer",
  "experience",
  "for",
  "from",
  "good",
  "have",
  "has",
  "in",
  "into",
  "job",
  "knowledge",
  "level",
  "must",
  "nice",
  "of",
  "on",
  "or",
  "our",
  "position",
  "preferred",
  "required",
  "requirements",
  "responsibilities",
  "responsible",
  "role",
  "skill",
  "skills",
  "software",
  "strong",
  "team",
  "teams",
  "that",
  "the",
  "their",
  "this",
  "to",
  "use",
  "used",
  "using",
  "we",
  "will",
  "with",
  "work",
  "working",
  "year",
  "years",
  "you",
  "your",
])

function normalizeTranscriberTerm(value: string) {
  return value
    .replace(/["'`]/g, "")
    .replace(/\s+/g, " ")
    .replace(/^[^A-Za-z0-9]+|[^A-Za-z0-9+#./-]+$/g, "")
    .trim()
}

function pushUniqueTranscriberTerm(
  terms: string[],
  value: string,
  limit: number,
) {
  const normalized = normalizeTranscriberTerm(value)
  if (normalized === "") return

  const normalizedKey = normalized.toLowerCase()
  const hasTerm = terms.some(term => term.toLowerCase() === normalizedKey)
  if (hasTerm || terms.length >= limit) return

  terms.push(normalized)
}

function extractTechnicalTerms(text: string) {
  const matches = text.match(/[A-Za-z][A-Za-z0-9+#./-]{1,}/g) ?? []
  const terms: string[] = []

  for (const match of matches) {
    const normalized = normalizeTranscriberTerm(match)
    if (normalized === "") continue

    const normalizedKey = normalized.toLowerCase()
    const isShortPlainWord =
      normalized.length <= 2 && !/[A-Z0-9+#./-]/.test(normalized)

    if (
      isShortPlainWord ||
      GENERIC_TRANSCRIBER_TERMS.has(normalizedKey)
    ) {
      continue
    }

    pushUniqueTranscriberTerm(terms, normalized, TRANSCRIBER_KEYTERM_LIMIT * 2)

    for (const part of normalized.split(/[/:]/)) {
      if (part === normalized) continue
      pushUniqueTranscriberTerm(terms, part, TRANSCRIBER_KEYTERM_LIMIT * 2)
    }

    if (terms.length >= TRANSCRIBER_KEYTERM_LIMIT * 2) {
      break
    }
  }

  return terms
}

function buildTranscriberKeyterms(jobInfo: InterviewJobInfo) {
  const keyterms: string[] = []

  pushUniqueTranscriberTerm(keyterms, jobInfo.title, TRANSCRIBER_KEYTERM_LIMIT)

  const normalizedExperienceLevel = jobInfo.experienceLevel.replace(/[_-]+/g, " ")
  pushUniqueTranscriberTerm(
    keyterms,
    normalizedExperienceLevel,
    TRANSCRIBER_KEYTERM_LIMIT,
  )

  const sources = [jobInfo.title, jobInfo.description, jobInfo.cvSummary ?? ""]

  for (const source of sources) {
    for (const term of extractTechnicalTerms(source)) {
      pushUniqueTranscriberTerm(keyterms, term, TRANSCRIBER_KEYTERM_LIMIT)
    }
  }

  return keyterms
}

export function VapiInterviewCall({ jobInfo, onBack }: { jobInfo: InterviewJobInfo; onBack?: () => void }) {
  const [isConnecting, setIsConnecting] = useState(false)
  const [isCallActive, setIsCallActive] = useState(false)
  const [isInterviewComplete, setIsInterviewComplete] = useState(false)
  const [isMuted, setIsMuted] = useState(false)
  const [messages, setMessages] = useState<InterviewTranscriptMessage[]>([])
  const [liveTranscript, setLiveTranscript] = useState<InterviewTranscriptMessage | null>(null)
  const [duration, setDuration] = useState("00:00:00")
  const [interviewId, setInterviewId] = useState<string | null>(null)
  
  const vapiRef = useRef<Vapi | null>(null)
  const durationIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const callStartRef = useRef<number>(0)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const messagesRef = useRef<InterviewTranscriptMessage[]>([])
  const interviewIdRef = useRef<string | null>(null)
  const durationRef = useRef<string>("00:00:00")
  const hasFinalizedRef = useRef(false)
  const manualStopRef = useRef(false)
  const microphoneStreamRef = useRef<MediaStream | null>(null)
  const hasReceivedUserAudioRef = useRef(false)
  const endedReasonRef = useRef<string | null>(null)
  const router = useRouter()
  const transcriberKeyterms = useMemo(
    () => buildTranscriberKeyterms(jobInfo),
    [jobInfo],
  )

  const clearDurationTimer = useCallback(() => {
    if (durationIntervalRef.current) {
      clearInterval(durationIntervalRef.current)
      durationIntervalRef.current = null
    }
  }, [])

  const stopMicrophoneStream = useCallback(() => {
    microphoneStreamRef.current?.getTracks().forEach(track => track.stop())
    microphoneStreamRef.current = null
  }, [])

  const prepareMicrophoneTrack = useCallback(async () => {
    if (!navigator.mediaDevices?.getUserMedia) {
      throw new Error("Browser does not support microphone capture.")
    }

    stopMicrophoneStream()

    const stream = await navigator.mediaDevices.getUserMedia({
      audio: {
        autoGainControl: true,
        echoCancellation: true,
        noiseSuppression: true,
      },
    })
    const [track] = stream.getAudioTracks()

    if (!track) {
      stream.getTracks().forEach(currentTrack => currentTrack.stop())
      throw new Error("No microphone track available.")
    }

    track.enabled = true
    microphoneStreamRef.current = stream
    return track
  }, [stopMicrophoneStream])

  const stopVapiCall = useCallback(async (source: string) => {
    const vapi = vapiRef.current
    if (!vapi) return

    try {
      await vapi.stop()
    } catch (error) {
      const details = getVapiErrorDetails(error)
      if (!isMeetingEndedMessage(details.message)) {
        console.warn(`Failed to stop Vapi call during ${source}`, error)
      }
    }
  }, [])

  const finalizeCall = useCallback(async (options?: {
    notice?: { type: "info" | "error"; message: string }
    fallbackNotice?: { type: "info" | "error"; message: string }
  }) => {
    if (hasFinalizedRef.current) return
    hasFinalizedRef.current = true

    clearDurationTimer()
    stopMicrophoneStream()
    setIsCallActive(false)
    setIsConnecting(false)
    setLiveTranscript(null)

    const currentId = interviewIdRef.current
    const currentDuration = durationRef.current
    const currentMessages = messagesRef.current
    const hasStartedCall =
      callStartRef.current > 0 || currentMessages.length > 0
    callStartRef.current = 0

    if (currentId && hasStartedCall) {
      try {
        const result = await updateInterview(currentId, {
          duration: currentDuration,
          vapiTranscript: JSON.stringify(currentMessages),
        })

        if (result.error) {
          throw new Error(result.message ?? "Failed to save interview")
        }
      } catch (error) {
        console.error("Failed to persist Vapi interview:", error)
        toast.error("Cuoc goi da ket thuc nhung khong luu duoc ket qua.")
        return
      }

      if (options?.notice) {
        if (options.notice.type === "error") {
          toast.error(options.notice.message)
        } else {
          toast.info(options.notice.message)
        }
      }

      router.push(`/app/interview/${currentId}`)
      return
    }

    const fallbackNotice =
      options?.fallbackNotice ??
      ({ type: "info", message: "Phong van chua duoc bat dau" } as const)

    if (fallbackNotice.type === "error") {
      toast.error(fallbackNotice.message)
    } else {
      toast.info(fallbackNotice.message)
    }

    router.push("/app/interview")
  }, [clearDurationTimer, router, stopMicrophoneStream])

  // Keep refs in sync with state
  useEffect(() => { messagesRef.current = messages }, [messages])
  useEffect(() => { interviewIdRef.current = interviewId }, [interviewId])
  useEffect(() => { durationRef.current = duration }, [duration])

  const createVapiInstance = useCallback((audioSource?: MediaStreamTrack) => {
    if (!env.NEXT_PUBLIC_VAPI_PUBLIC_KEY) {
      console.error("Vapi public key not found")
      return null
    }

    vapiRef.current?.removeAllListeners()

    const vapiInstance = new Vapi(
      env.NEXT_PUBLIC_VAPI_PUBLIC_KEY,
      undefined,
      { alwaysIncludeMicInPermissionPrompt: true },
      audioSource ? { audioSource } : undefined,
    )
    vapiRef.current = vapiInstance

    vapiInstance.on("call-start", () => {
      console.log("Vapi call started")
      hasFinalizedRef.current = false
      manualStopRef.current = false
      setIsConnecting(false)
      setIsCallActive(true)
      callStartRef.current = Date.now()

      // Start duration tracker
      clearDurationTimer()
      durationIntervalRef.current = setInterval(() => {
        const elapsed = Math.floor((Date.now() - callStartRef.current) / 1000)
        const hours = Math.floor(elapsed / 3600).toString().padStart(2, "0")
        const minutes = Math.floor((elapsed % 3600) / 60).toString().padStart(2, "0")
        const seconds = (elapsed % 60).toString().padStart(2, "0")
        const nextDuration = `${hours}:${minutes}:${seconds}`
        durationRef.current = nextDuration
        setDuration(nextDuration)
      }, 1000)
    })

    vapiInstance.on("call-end", () => {
      console.log("Vapi call ended")
      void finalizeCall()
    })

    vapiInstance.on("speech-start", () => {
      console.log("Vapi speech started")
    })

    vapiInstance.on("speech-end", () => {
      console.log("Vapi speech ended")
    })

    vapiInstance.on("message", (event: unknown) => {
      if (event == null || typeof event !== "object") {
        return
      }
      const message = event as Record<string, unknown>

      if (message.type === "status-update" && message.status === "ended") {
        const endedReason =
          typeof message.endedReason === "string" ? message.endedReason : null
        endedReasonRef.current = endedReason
        if (
          endedReason != null &&
          endedReason !== "customer-ended-call" &&
          !manualStopRef.current
        ) {
          console.info("Vapi ended call:", endedReason)
        }
      }

      if (
        message.type === "speech-update" &&
        message.role === "user" &&
        message.status === "started"
      ) {
        hasReceivedUserAudioRef.current = true
        console.info("User speech detected by Vapi")
      }

      if (message.type === "voice-input") {
        const input = typeof message.input === "string" ? message.input : ""
        if (input.trim() !== "") {
          hasReceivedUserAudioRef.current = true
          console.info("Vapi voice input:", input)
        }
      }

      // User speech: use Deepgram transcript (final only)
      const isTranscriptMessage =
        message.type === "transcript" ||
        message.type === "transcript[transcriptType='final']"

      if (isTranscriptMessage && message.role === "user") {
        const transcript = message.transcript
        if (typeof transcript !== "string") {
          return
        }

        hasReceivedUserAudioRef.current = true

        if (message.transcriptType === "final") {
          setMessages(prev => {
            const nextMessages = [...prev, { role: "user" as const, content: transcript }]
            messagesRef.current = nextMessages
            return nextMessages
          })
          setLiveTranscript(null)
        } else {
          setLiveTranscript({ role: "user", content: transcript })
        }
      }

      // AI text: use actual LLM output from conversation-update (not garbled audio transcription)
      if (message.type === "conversation-update") {
        const conversation = Array.isArray(message.conversation)
          ? message.conversation.filter(
              (item): item is { role: string; content: string } =>
                item != null &&
                typeof item === "object" &&
                "role" in item &&
                "content" in item &&
                typeof item.role === "string" &&
                typeof item.content === "string"
            )
          : []

        const lastAssistant = [...conversation].reverse().find(m => m.role === "assistant")
        if (lastAssistant?.content) {
          setMessages(prev => {
            const last = prev.at(-1)
            if (last?.role === "assistant" && last.content === lastAssistant.content) {
              messagesRef.current = prev
              return prev
            }

            const nextMessages =
              last?.role === "assistant"
                ? [...prev.slice(0, -1), { role: "assistant" as const, content: lastAssistant.content }]
                : [...prev, { role: "assistant" as const, content: lastAssistant.content }]

            messagesRef.current = nextMessages
            return nextMessages
          })
          setLiveTranscript(null)

          const closingPhrases = [
            "chúc bạn may mắn",
            "buổi phỏng vấn đã hoàn tất",
            "cảm ơn bạn đã dành thời gian",
          ]
          const isClosing = closingPhrases.some(p =>
            lastAssistant.content.toLowerCase().includes(p)
          )

          if (isClosing) {
            setIsInterviewComplete(true)
          }
        }
      }
    })

    vapiInstance.on("error", (error: unknown) => {
      const details = getVapiErrorDetails(error)
      const hasStartedCall =
        callStartRef.current > 0 || messagesRef.current.length > 0
      const errorMessage = details.message ?? "Loi ket noi voice interview"
      const endedReason = endedReasonRef.current
      const hasMicInputIssue =
        !hasReceivedUserAudioRef.current &&
        typeof endedReason === "string" &&
        (endedReason.includes("silence") || endedReason.includes("microphone"))

      if (manualStopRef.current || isMeetingEndedMessage(details.message)) {
        console.info("Vapi call ended:", {
          ...details,
          endedReason,
          hasReceivedUserAudio: hasReceivedUserAudioRef.current,
        })
        void finalizeCall({
          notice: hasStartedCall
            ? hasMicInputIssue
              ? {
                  type: "error",
                  message: "Cuoc goi ket thuc vi Vapi khong nhan duoc am thanh tu microphone.",
                }
              : {
                  type: "info",
                  message: "Cuoc goi da ket thuc. Dang mo ket qua da luu.",
                }
            : undefined,
          fallbackNotice: hasMicInputIssue
            ? {
                type: "error",
                message: "Khong nhan duoc am thanh tu microphone. Kiem tra browser permission va input device.",
              }
            : {
                type: "error",
                message: "Cuoc goi da ket thuc truoc khi phong van bat dau.",
              },
        })
        return
      }

      if (hasStartedCall) {
        console.error("Unexpected Vapi error:", details.type ?? "unknown-error", error)
        void finalizeCall({
          notice: {
            type: "error",
            message: "Ket noi cuoc goi bi gian doan. Dang mo ket qua da luu.",
          },
          fallbackNotice: {
            type: "error",
            message: errorMessage,
          },
        })
        return
      }

      console.error("Unexpected Vapi startup error:", details.type ?? "unknown-error", error)
      toast.error(errorMessage)
      setIsConnecting(false)
      setIsCallActive(false)
    })

    return vapiInstance
  }, [clearDurationTimer, finalizeCall])

  useEffect(() => {
    if (!env.NEXT_PUBLIC_VAPI_PUBLIC_KEY) {
      console.error("Vapi public key not found")
      return
    }

    return () => {
      clearDurationTimer()
      stopMicrophoneStream()
      if (!hasFinalizedRef.current) {
        void stopVapiCall("cleanup")
      }
      vapiRef.current?.removeAllListeners()
      vapiRef.current = null
    }
  }, [clearDurationTimer, stopMicrophoneStream, stopVapiCall])

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
      manualStopRef.current = true
      void stopVapiCall("auto-end")
    }, 5000)
    return () => clearTimeout(timer)
  }, [isInterviewComplete, stopVapiCall])

  const handleStartCall = async () => {
    if (!env.NEXT_PUBLIC_VAPI_ASSISTANT_ID) {
      toast.error("Vapi chưa được cấu hình đúng")
      return
    }

    console.log("🎤 Starting interview...")
    hasFinalizedRef.current = false
    manualStopRef.current = false
    endedReasonRef.current = null
    hasReceivedUserAudioRef.current = false
    clearDurationTimer()
    callStartRef.current = 0
    interviewIdRef.current = null
    durationRef.current = "00:00:00"
    messagesRef.current = []
    setInterviewId(null)
    setMessages([])
    setLiveTranscript(null)
    setDuration("00:00:00")
    setIsInterviewComplete(false)
    setIsMuted(false)
    setIsConnecting(true)

    try {
      const microphoneTrack = await prepareMicrophoneTrack()
      const vapi = createVapiInstance(microphoneTrack)
      if (!vapi) {
        throw new Error("Vapi instance could not be created.")
      }

      // Create interview in database
      const res = await createInterview({ jobInfoId: jobInfo.id })
      if (res.error) {
        console.error("❌ Failed to create interview:", res.message)
        setIsConnecting(false)
        stopMicrophoneStream()
        return errorToast(res.message)
      }

      console.log("✅ Interview created, ID:", res.id)
      setInterviewId(res.id)
      interviewIdRef.current = res.id
      console.info("Deepgram transcriber tuned for interview", {
        model: "nova-3",
        language: "vi",
        keytermCount: transcriberKeyterms.length,
      })

      // Start Vapi call - override system prompt with dynamic candidate info
      await vapi.start({
        transcriber: {
          provider: "deepgram",
          model: "nova-3",
          language: "vi",
          smartFormat: true,
          numerals: true,
          endpointing: 300,
          ...(transcriberKeyterms.length > 0
            ? { keyterm: transcriberKeyterms }
            : {}),
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
      manualStopRef.current = true
      await stopVapiCall("start-failure")
      stopMicrophoneStream()
    }
  }

  const handleEndCall = () => {
    manualStopRef.current = true
    void stopVapiCall("manual-end")
  }

  const handleToggleMute = () => {
    const vapi = vapiRef.current
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
