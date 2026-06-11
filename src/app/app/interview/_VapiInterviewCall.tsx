"use client"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { env } from "@/data/env/client"
import { createInterview, updateInterview, generateInterviewFeedback } from "@/features/interviews/actions"
import { errorToast } from "@/lib/errorToast"
import Vapi from "@vapi-ai/web"
import {
  Loader2Icon,
  MicIcon,
  MicOffIcon,
  PhoneOffIcon,
  ArrowLeftIcon,
  CheckCircle2Icon,
  LightbulbIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  SparklesIcon,
  TrendingUpIcon,
  AwardIcon,
  ClockIcon,
  Volume2Icon,
  VolumeXIcon,
  CircleIcon,
  UserIcon,
  BotIcon,
  HelpCircleIcon
} from "lucide-react"
import { useRouter } from "next/navigation"
import { useCallback, useEffect, useRef, useState } from "react"
import { InterviewJobInfo } from "./page"
import { toast } from "sonner"
import { syncAssistantMessagesFromConversation } from "./vapiAssistantMessageSync.mjs"
import { getRandomMaleInterviewerName } from "./vapiInterviewPrompt.mjs"
import { buildVapiStartCallArgs } from "./vapiStartCallConfig.mjs"
import { cn } from "@/lib/utils"
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import {
  areQuestionsSimilar,
  buildAnsweredQuestionsSystemMessage,
  getAnsweredQuestionsAfterUserTranscript,
  shouldTrackAssistantQuestion,
} from "./vapiInterviewTurnGuard.mjs"
import {
  extractModelOutputText,
  mergeModelOutputText,
} from "./vapiModelOutputText.mjs"

type InterviewTranscriptMessage = {
  role: "assistant" | "user"
  content: string
}

// Quy tắc kết thúc: AI nói 6 lượt (lời chào + 5 câu hỏi) và ứng viên trả lời
// đủ 5 câu hỏi thì kết thúc buổi phỏng vấn.
const TOTAL_INTERVIEW_QUESTIONS = 5

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

function isClosingAssistantMessage(content: string) {
  const normalized = content.toLowerCase()
  const closingPhrases = [
    "chúc bạn may mắn",
    "buổi phỏng vấn đã hoàn tất",
    "cảm ơn bạn đã dành thời gian",
    "tạm biệt",
    "hẹn gặp lại",
  ]

  return closingPhrases.some(phrase => normalized.includes(phrase))
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
  const [interviewerName, setInterviewerName] = useState(() =>
    getRandomMaleInterviewerName(),
  )
  const [connectingStep, setConnectingStep] = useState(0)

  // Redesign UI states
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)
  const [isAiThinking, setIsAiThinking] = useState(false)
  const [isProcessingFeedback, setIsProcessingFeedback] = useState(false)
  const [processingStep, setProcessingStep] = useState(0)

  useEffect(() => {
    if (!isConnecting) {
      setConnectingStep(0)
      return
    }

    const interval = setInterval(() => {
      setConnectingStep((prev) => {
        if (prev < 4) return prev + 1
        return prev
      })
    }, 1500)

    return () => clearInterval(interval)
  }, [isConnecting])

  const vapiRef = useRef<Vapi | null>(null)
  const durationIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const callStartRef = useRef<number>(0)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const messagesRef = useRef<InterviewTranscriptMessage[]>([])
  const interviewIdRef = useRef<string | null>(null)
  const durationRef = useRef<string>("00:00:00")
  const hasFinalizedRef = useRef(false)
  const manualStopRef = useRef(false)
  const isInterviewCompleteRef = useRef(false)  // AI đã đọc câu kết thúc/tạm biệt
  const goodbyeEndTimerRef = useRef<NodeJS.Timeout | null>(null)
  const microphoneStreamRef = useRef<MediaStream | null>(null)
  const microphoneDeviceIdRef = useRef<string | null>(null)
  const microphoneRecoveryTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const lastRecognizedSpeechAtRef = useRef(0)
  const lastMicrophoneRecoveryAtRef = useRef(0)
  const isRecoveringMicrophoneRef = useRef(false)
  const hasReceivedUserAudioRef = useRef(false)
  const endedReasonRef = useRef<string | null>(null)
  const lastAssistantQuestionRef = useRef<string | null>(null)
  const answeredAssistantQuestionsRef = useRef<string[]>([])
  const assistantModelOutputRef = useRef("")
  const questionsAskedCountRef = useRef(0)      // số câu hỏi AI đã hỏi (hiển thị tiến độ)
  const router = useRouter()

  const clearDurationTimer = useCallback(() => {
    if (durationIntervalRef.current) {
      clearInterval(durationIntervalRef.current)
      durationIntervalRef.current = null
    }
  }, [])

  const clearMicrophoneRecoveryTimer = useCallback(() => {
    if (microphoneRecoveryTimeoutRef.current) {
      clearTimeout(microphoneRecoveryTimeoutRef.current)
      microphoneRecoveryTimeoutRef.current = null
    }
  }, [])

  const stopMicrophoneStream = useCallback(() => {
    microphoneStreamRef.current?.getTracks().forEach(track => track.stop())
    microphoneStreamRef.current = null
  }, [])

  const prepareMicrophoneInput = useCallback(async () => {
    if (!navigator.mediaDevices?.getUserMedia) {
      throw new Error("Browser does not support microphone capture.")
    }

    stopMicrophoneStream()

    const buildAudioConstraints = (deviceId?: string | null): MediaTrackConstraints => ({
      autoGainControl: true,
      echoCancellation: true,
      noiseSuppression: true,
      ...(deviceId
        ? {
          deviceId: {
            exact: deviceId,
          },
        }
        : {}),
    })

    const preferredDeviceId = microphoneDeviceIdRef.current
    let stream: MediaStream

    try {
      stream = await navigator.mediaDevices.getUserMedia({
        audio: buildAudioConstraints(preferredDeviceId),
      })
    } catch (error) {
      if (preferredDeviceId == null) {
        throw error
      }

      stream = await navigator.mediaDevices.getUserMedia({
        audio: buildAudioConstraints(),
      })
    }

    microphoneStreamRef.current = stream
    const [track] = stream.getAudioTracks()

    if (!track) {
      stopMicrophoneStream()
      throw new Error("No microphone track available.")
    }

    track.enabled = true

    const currentDeviceId = track.getSettings().deviceId
    microphoneDeviceIdRef.current =
      typeof currentDeviceId === "string" && currentDeviceId !== ""
        ? currentDeviceId
        : preferredDeviceId

    stopMicrophoneStream()
    return microphoneDeviceIdRef.current
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

  const recoverMicrophoneInput = useCallback(async (reason: string) => {
    const vapi = vapiRef.current
    if (
      !vapi ||
      !isCallActive ||
      isMuted ||
      hasFinalizedRef.current ||
      manualStopRef.current
    ) {
      return
    }

    const now = Date.now()
    if (
      isRecoveringMicrophoneRef.current ||
      now - lastMicrophoneRecoveryAtRef.current < 8000
    ) {
      return
    }

    isRecoveringMicrophoneRef.current = true

    try {
      const microphoneDeviceId = await prepareMicrophoneInput()
      if (!microphoneDeviceId) {
        console.warn("Skipping microphone recovery because no deviceId is available", {
          reason,
        })
        return
      }

      await vapi.setInputDevicesAsync({ audioDeviceId: microphoneDeviceId })
      lastMicrophoneRecoveryAtRef.current = Date.now()
      lastRecognizedSpeechAtRef.current = Date.now()
      console.info("Recovered microphone input", {
        reason,
        microphoneDeviceId,
      })
    } catch (error) {
      console.warn("Failed to recover microphone input", {
        reason,
        error,
      })
    } finally {
      isRecoveringMicrophoneRef.current = false
    }
  }, [isCallActive, isMuted, prepareMicrophoneInput])

  const markRecognizedSpeech = useCallback(() => {
    lastRecognizedSpeechAtRef.current = Date.now()
    clearMicrophoneRecoveryTimer()
  }, [clearMicrophoneRecoveryTimer])

  const scheduleMicrophoneRecovery = useCallback((reason: string) => {
    if (!isCallActive || isMuted) return

    clearMicrophoneRecoveryTimer()
    const scheduledAt = Date.now()

    microphoneRecoveryTimeoutRef.current = setTimeout(() => {
      if (lastRecognizedSpeechAtRef.current >= scheduledAt) {
        return
      }

      void recoverMicrophoneInput(reason)
    }, 6000)
  }, [clearMicrophoneRecoveryTimer, isCallActive, isMuted, recoverMicrophoneInput])

  const parseFeedback = (markdown: string) => {
    let score = 0
    const ratingMatch = markdown.match(/(?:Overall Rating|Rating|Điểm tổng kết|Điểm số|Điểm):\s*\*?(\d+)(?:\/10)?\*?/i) || markdown.match(/\b(\d+)\/10\b/)
    if (ratingMatch) {
      score = parseInt(ratingMatch[1], 10)
    }

    const lines = markdown.split("\n")
    const strengths: string[] = []
    const improvements: string[] = []
    let currentSection: "strengths" | "improvements" | null = null
    const summaryParagraphs: string[] = []

    for (const line of lines) {
      const cleanLine = line.trim()
      if (!cleanLine) continue

      const lowerLine = cleanLine.toLowerCase()
      if (lowerLine.includes("điểm mạnh") || lowerLine.includes("strengths")) {
        currentSection = "strengths"
        continue
      } else if (lowerLine.includes("điểm cần cải thiện") || lowerLine.includes("cần cải thiện") || lowerLine.includes("improvements")) {
        currentSection = "improvements"
        continue
      } else if (cleanLine.startsWith("##") && !lowerLine.includes("strengths") && !lowerLine.includes("improvements") && !lowerLine.includes("cải thiện")) {
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

    if (strengths.length === 0) {
      strengths.push("Giao tiếp rõ ràng và phong thái tự tin.", "Trả lời trực tiếp vào trọng tâm câu hỏi.", "Nêu được ví dụ thực tế liên quan.")
    }
    if (improvements.length === 0) {
      improvements.push("Nên làm rõ kết quả đạt được (Result) trong mô hình STAR.", "Giảm bớt các từ đệm ậm ừ khi suy nghĩ.", "Đi sâu hơn vào chi tiết kỹ thuật của giải pháp.")
    }

    const summary = summaryParagraphs.slice(0, 2).join("\n\n") || "AI đã đánh giá xong buổi phỏng vấn của bạn. Kết quả chi tiết đã sẵn sàng."

    return {
      score,
      summary,
      strengths: strengths.slice(0, 3),
      improvements: improvements.slice(0, 3)
    }
  }

  const finalizeCall = useCallback(async (options?: {
    notice?: { type: "info" | "error"; message: string }
    fallbackNotice?: { type: "info" | "error"; message: string }
  }) => {
    if (hasFinalizedRef.current) return
    hasFinalizedRef.current = true

    // Tear down Vapi immediately to silence all further SDK events/rejections.
    // Vapi uses internal async generators that throw "Meeting ended due to ejection"
    // as unhandled rejections if we leave the instance alive during async work below.
    vapiRef.current?.removeAllListeners()
    vapiRef.current = null

    clearDurationTimer()
    clearMicrophoneRecoveryTimer()
    if (goodbyeEndTimerRef.current) {
      clearTimeout(goodbyeEndTimerRef.current)
      goodbyeEndTimerRef.current = null
    }
    stopMicrophoneStream()
    setIsCallActive(false)
    setIsConnecting(false)
    setLiveTranscript(null)

    const currentId = interviewIdRef.current
    const currentDuration = durationRef.current
    const currentMessages = messagesRef.current
    const hasStartedCall =
      currentMessages.some(m => m.role === "assistant") || currentMessages.length > 1
    callStartRef.current = 0

    if (currentId && hasStartedCall) {
      setIsProcessingFeedback(true)
      setProcessingStep(0)

      if (options?.notice) {
        if (options.notice.type === "error") {
          toast.error(options.notice.message)
        } else {
          toast.info(options.notice.message)
        }
      }

      // Step transition timer
      const stepInterval = setInterval(() => {
        setProcessingStep(prev => {
          if (prev < 3) return prev + 1
          return prev
        })
      }, 2000)

      try {
        await updateInterview(currentId, {
          duration: currentDuration,
          vapiTranscript: JSON.stringify(currentMessages),
        })

        // Generate feedback in background
        const feedbackRes = await generateInterviewFeedback(currentId)
        if (feedbackRes.error) {
          throw new Error(feedbackRes.message ?? "Failed to generate feedback")
        }

        // Wait to finish the remaining steps nicely
        await new Promise(resolve => setTimeout(resolve, 3000))
        clearInterval(stepInterval)
        setProcessingStep(4)

        // Final short delay for success checkmark transition
        await new Promise(resolve => setTimeout(resolve, 1000))
        router.push(`/app/interview/${currentId}`)
      } catch (error) {
        console.error("Failed to generate feedback:", error)
        clearInterval(stepInterval)
        toast.error("Đã xảy ra lỗi khi tạo đánh giá phỏng vấn. Bạn vẫn có thể xem lại trong lịch sử.")
        router.push("/app/interview")
      }

      return
    }

    const fallbackNotice =
      options?.fallbackNotice ??
      ({ type: "info", message: "Phỏng vấn chưa được bắt đầu" } as const)

    if (fallbackNotice.type === "error") {
      toast.error(fallbackNotice.message)
    } else {
      toast.info(fallbackNotice.message)
    }

    router.push("/app/interview")
  }, [clearDurationTimer, clearMicrophoneRecoveryTimer, router, stopMicrophoneStream])

  // Keep refs in sync with state
  useEffect(() => { messagesRef.current = messages }, [messages])
  useEffect(() => { interviewIdRef.current = interviewId }, [interviewId])
  useEffect(() => { durationRef.current = duration }, [duration])

  // Khi liveTranscript chuyển assistant → null: AI vừa nói xong, lưu vào messages[]
  const prevLiveTranscriptRef = useRef<InterviewTranscriptMessage | null>(null)
  useEffect(() => {
    const prev = prevLiveTranscriptRef.current
    prevLiveTranscriptRef.current = liveTranscript

    if (prev?.role !== "assistant" || !prev.content.trim()) return
    if (liveTranscript !== null) return // vẫn đang nói

    const content = prev.content.trim()
    setMessages(prevMsgs => {
      // Đã có rồi (conversation-update đã save) thì bỏ qua
      const alreadySaved = prevMsgs.some(
        m => m.role === "assistant" && m.content === content
      )
      if (alreadySaved) return prevMsgs

      // Message cuối là assistant partial → update thành full content
      const last = prevMsgs.at(-1)
      if (last?.role === "assistant") {
        const updated = [...prevMsgs]
        updated[updated.length - 1] = { role: "assistant", content }
        messagesRef.current = updated
        return updated
      }

      // Thêm mới
      const next = [...prevMsgs, { role: "assistant" as const, content }]
      messagesRef.current = next
      return next
    })
  }, [liveTranscript])

  const createVapiInstance = useCallback((audioSource?: string | null) => {
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
      void finalizeCall({
        fallbackNotice: {
          type: "error",
          message: "Kết nối bị ngắt trước khi phỏng vấn bắt đầu. Vui lòng thử lại.",
        },
      })
    })

    vapiInstance.on("speech-start", () => {
      console.log("Vapi speech started")
      assistantModelOutputRef.current = ""
      setIsAiThinking(false)
    })

    vapiInstance.on("speech-end", () => {
      console.log("Vapi speech ended")

      // Nếu AI vừa nói xong câu kết thúc/tạm biệt → đợi một nhịp ngắn cho TTS
      // phát hết rồi đóng cuộc gọi (thay vì cắt ngang bằng timer cứng).
      if (isInterviewCompleteRef.current && !manualStopRef.current) {
        if (goodbyeEndTimerRef.current) clearTimeout(goodbyeEndTimerRef.current)
        goodbyeEndTimerRef.current = setTimeout(() => {
          manualStopRef.current = true
          void stopVapiCall("goodbye-finished")
        }, 1200)
      }

      // Safety net: persist AI message ngay khi nói xong
      // Tránh mất message nếu conversation-update fire muộn hoặc bị miss
      const spokenContent = assistantModelOutputRef.current.trim()
      if (!spokenContent) return

      setMessages(prev => {
        // Nếu message cuối cùng trong list đã là nội dung này rồi thì bỏ qua
        const last = prev.at(-1)
        if (last?.role === "assistant" && last.content === spokenContent) {
          return prev
        }
        // Nếu message cuối là assistant nhưng khác nội dung (partial) → update
        if (last?.role === "assistant") {
          const updated = [...prev]
          updated[updated.length - 1] = { role: "assistant", content: spokenContent }
          messagesRef.current = updated
          return updated
        }
        // Thêm message AI mới vào chat
        const next = [...prev, { role: "assistant" as const, content: spokenContent }]
        messagesRef.current = next
        return next
      })
    })

    vapiInstance.on("network-quality-change", (event: unknown) => {
      console.info("Vapi network quality changed", event)
    })

    vapiInstance.on("network-connection", (event: unknown) => {
      console.info("Vapi network connection changed", event)
    })

    vapiInstance.on("call-start-progress", (event: unknown) => {
      console.info("Vapi call start progress", event)
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
        message.role === "assistant" &&
        message.status === "started"
      ) {
        assistantModelOutputRef.current = ""
        setIsAiThinking(false)
      }

      if (
        message.type === "speech-update" &&
        message.role === "user" &&
        message.status === "started"
      ) {
        hasReceivedUserAudioRef.current = true
        console.info("User speech detected by Vapi")
        scheduleMicrophoneRecovery("speech-detected-without-transcript")
      }

      if (message.type === "voice-input") {
        const input = typeof message.input === "string" ? message.input : ""
        if (input.trim() !== "") {
          hasReceivedUserAudioRef.current = true
          markRecognizedSpeech()
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
        markRecognizedSpeech()

        if (message.transcriptType === "final") {
          setIsAiThinking(true)

          // Cập nhật danh sách câu hỏi đã được trả lời. answeredQuestions chỉ
          // tăng khi câu trước của AI là câu hỏi THẬT (không tính lời chào) và
          // chưa được trả lời, nên độ dài của nó = số câu hỏi user đã trả lời.
          const nextAnsweredQuestions = getAnsweredQuestionsAfterUserTranscript({
            answeredQuestions: answeredAssistantQuestionsRef.current,
            lastAssistantQuestion: lastAssistantQuestionRef.current,
            userTranscript: transcript,
          })
          const answeredCountChanged =
            nextAnsweredQuestions.length !==
            answeredAssistantQuestionsRef.current.length
          answeredAssistantQuestionsRef.current = nextAnsweredQuestions

          if (nextAnsweredQuestions.length >= TOTAL_INTERVIEW_QUESTIONS) {
            // Ứng viên vừa trả lời xong câu hỏi thứ 5 (AI đã nói 6 lượt: lời
            // chào + 5 câu hỏi, user đã trả lời 5 lượt) → kết thúc phỏng vấn.
            vapiRef.current?.send({
              type: "add-message",
              message: {
                role: "system",
                content: `[SYSTEM NOTE - BẮT BUỘC] Ứng viên đã trả lời đủ ${TOTAL_INTERVIEW_QUESTIONS} câu hỏi. DỪNG HỎI THÊM. Đọc ngay câu kết thúc và chào tạm biệt: "Cảm ơn bạn đã dành thời gian tham gia buổi phỏng vấn hôm nay. Chúc bạn may mắn trên con đường sự nghiệp sắp tới. Tạm biệt và hẹn gặp lại bạn!"`,
              },
              triggerResponseEnabled: true,
            })
          } else if (answeredCountChanged) {
            // Chưa đủ 5 câu: nhắc AI không hỏi lại các câu đã trả lời.
            const systemMessage =
              buildAnsweredQuestionsSystemMessage(nextAnsweredQuestions)

            if (systemMessage != null) {
              vapiRef.current?.send({
                type: "add-message",
                message: { role: "system", content: systemMessage },
                triggerResponseEnabled: false,
              })
            }
          }

          setMessages(prev => {
            const last = prev.at(-1)
            // Nếu message trước cũng là user, ghép vào để tránh buột câu thành nhiều bubble
            if (last?.role === "user") {
              const merged = [...prev]
              merged[merged.length - 1] = {
                role: "user",
                content: `${last.content} ${transcript}`.trim(),
              }
              messagesRef.current = merged
              return merged
            }
            const nextMessages = [...prev, { role: "user" as const, content: transcript }]
            messagesRef.current = nextMessages
            return nextMessages
          })
          setLiveTranscript(null)
        } else {
          setLiveTranscript({ role: "user", content: transcript })
        }
      }

      if (message.type === "model-output") {
        setIsAiThinking(false)
        const outputText = extractModelOutputText(message.output ?? message)
        const trimmedOutput = outputText.trim()

        if (trimmedOutput !== "") {
          assistantModelOutputRef.current = mergeModelOutputText(
            assistantModelOutputRef.current,
            outputText,
          )
          setLiveTranscript({
            role: "assistant",
            content: assistantModelOutputRef.current.trim(),
          })
        }
      }

      // AI text: use actual LLM output from conversation-update (not garbled audio transcription)
      if (message.type === "conversation-update") {
        setIsAiThinking(false)
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
            const nextMessages = syncAssistantMessagesFromConversation(prev, conversation)
            messagesRef.current = nextMessages
            return nextMessages
          })
          assistantModelOutputRef.current = ""
          setLiveTranscript(null)

          if (shouldTrackAssistantQuestion(lastAssistant.content)) {
            const previousQuestion = lastAssistantQuestionRef.current
            lastAssistantQuestionRef.current = lastAssistant.content

            // conversation-update fire NHIỀU lần cho cùng một câu hỏi khi AI
            // đang stream nội dung. Chỉ tăng khi đây thực sự là câu hỏi MỚI
            // (khác câu vừa đếm trước đó) để hiển thị tiến độ cho đúng. Việc
            // kết thúc phỏng vấn KHÔNG dựa vào biến đếm này mà dựa vào số câu
            // đã được trả lời (xem handler transcript của user).
            const isSameQuestionAsLast =
              previousQuestion != null &&
              areQuestionsSimilar(previousQuestion, lastAssistant.content)

            if (!isSameQuestionAsLast) {
              questionsAskedCountRef.current += 1
              console.info(`AI hỏi câu ${questionsAskedCountRef.current}`)
            }
          }

          if (isClosingAssistantMessage(lastAssistant.content)) {
            isInterviewCompleteRef.current = true
            setIsInterviewComplete(true)
          }
        }
      }
    })

    vapiInstance.on("error", (error: unknown) => {
      const details = getVapiErrorDetails(error)
      // Same rule as finalizeCall: "started" only if AI already sent at least one message
      const hasStartedCall =
        messagesRef.current.some(m => m.role === "assistant") || messagesRef.current.length > 1
      const errorMessage = details.message ?? "Lỗi kết nối voice interview"
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
                message: "Cuộc gọi kết thúc vì Vapi không nhận được âm thanh từ microphone.",
              }
              : {
                type: "info",
                message: "Cuộc gọi đã kết thúc. Đang mở kết quả đã lưu.",
              }
            : undefined,
          fallbackNotice: hasMicInputIssue
            ? {
              type: "error",
              message: "Không nhận được âm thanh từ microphone. Kiểm tra quyền truy cập và thiết bị đầu vào trong trình duyệt.",
            }
            : {
              type: "error",
              message: "Kết nối bị ngắt trước khi phỏng vấn bắt đầu. Vui lòng thử lại.",
            },
        })
        return
      }

      if (hasStartedCall) {
        console.error("Unexpected Vapi error:", details.type ?? "unknown-error", error)
        void finalizeCall({
          notice: {
            type: "error",
            message: "Kết nối cuộc gọi bị gián đoạn. Đang mở kết quả đã lưu.",
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
  }, [clearDurationTimer, finalizeCall, markRecognizedSpeech, scheduleMicrophoneRecovery])

  useEffect(() => {
    if (!env.NEXT_PUBLIC_VAPI_PUBLIC_KEY) {
      console.error("Vapi public key not found")
      return
    }

    return () => {
      clearDurationTimer()
      clearMicrophoneRecoveryTimer()
      if (goodbyeEndTimerRef.current) {
        clearTimeout(goodbyeEndTimerRef.current)
        goodbyeEndTimerRef.current = null
      }
      stopMicrophoneStream()
      if (!hasFinalizedRef.current) {
        void stopVapiCall("cleanup")
      }
      vapiRef.current?.removeAllListeners()
      vapiRef.current = null
    }
  }, [clearDurationTimer, clearMicrophoneRecoveryTimer, stopMicrophoneStream, stopVapiCall])

  useEffect(() => {
    if (
      !isCallActive ||
      typeof navigator === "undefined" ||
      !navigator.mediaDevices?.addEventListener
    ) {
      return
    }

    const handleDeviceChange = () => {
      console.info("Detected media device change during interview")
      void recoverMicrophoneInput("media-device-change")
    }

    navigator.mediaDevices.addEventListener("devicechange", handleDeviceChange)

    return () => {
      navigator.mediaDevices.removeEventListener("devicechange", handleDeviceChange)
    }
  }, [isCallActive, recoverMicrophoneInput])

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

  // Auto-end call when interview is complete (fallback an toàn nếu vì lý do
  // nào đó không bắt được speech-end của câu tạm biệt).
  useEffect(() => {
    if (!isInterviewComplete) return
    const timer = setTimeout(() => {
      manualStopRef.current = true
      void stopVapiCall("auto-end")
    }, 15000)
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
    isInterviewCompleteRef.current = false
    if (goodbyeEndTimerRef.current) {
      clearTimeout(goodbyeEndTimerRef.current)
      goodbyeEndTimerRef.current = null
    }
    endedReasonRef.current = null
    hasReceivedUserAudioRef.current = false
    clearDurationTimer()
    callStartRef.current = 0
    interviewIdRef.current = null
    durationRef.current = "00:00:00"
    messagesRef.current = []
    lastAssistantQuestionRef.current = null
    answeredAssistantQuestionsRef.current = []
    questionsAskedCountRef.current = 0
    setInterviewId(null)
    setMessages([])
    setLiveTranscript(null)
    setDuration("00:00:00")
    setIsInterviewComplete(false)
    setIsMuted(false)
    setIsConnecting(true)
    const nextInterviewerName = getRandomMaleInterviewerName()
    setInterviewerName(nextInterviewerName)

    try {
      const microphoneDeviceId = await prepareMicrophoneInput()
      const vapi = createVapiInstance(microphoneDeviceId)
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
      console.info("Using interview turn-taking configuration")

      // Start Vapi call - override system prompt with dynamic candidate info
      await vapi.start(
        ...buildVapiStartCallArgs({
          assistantId: env.NEXT_PUBLIC_VAPI_ASSISTANT_ID,
          jobInfo,
          interviewerName: nextInterviewerName,
        }),
      )
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
  const liveAssistantTranscript =
    liveTranscript?.role === "assistant" ? liveTranscript : null
  const liveUserTranscript =
    liveTranscript?.role === "user" ? liveTranscript : null

  const latestAiMessage =
    liveAssistantTranscript ??
    messages.filter(m => m.role === "assistant").at(-1)

  // Build message list: confirmed messages + live AI + live user
  const allMessages = [
    ...messages,
    ...(liveAssistantTranscript ? [liveAssistantTranscript] : []),
    ...(liveUserTranscript ? [liveUserTranscript] : []),
  ]

  // Auto-scroll to bottom khi có message mới hoặc AI đang stream
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [allMessages.length, liveTranscript?.content])

  // Processing state - show after completing the interview
  if (isProcessingFeedback) {
    const steps = [
      "Đang phân tích câu trả lời",
      "Đang đánh giá kỹ năng",
      "Đang tổng hợp feedback",
      "Đang tạo báo cáo phỏng vấn"
    ];

    return (
      <div className="container py-8 max-w-lg mx-auto flex items-center justify-center min-h-[70vh]">
        <div className="bg-white dark:bg-card border border-slate-100 dark:border-border/60 rounded-2xl shadow-xl overflow-hidden p-6 md:p-8 w-full text-center">
          {/* Pulsing AI icon */}
          <div className="relative flex size-20 items-center justify-center rounded-full bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-border/40 mx-auto mb-6">
            <div className="absolute inset-0 rounded-full animate-ping bg-primary/10 opacity-75" />
            <span className="text-4xl">🤖</span>
          </div>

          <h2 className="text-base font-bold text-foreground mb-1">Đang xử lý kết quả phỏng vấn</h2>
          <p className="text-xs text-muted-foreground mb-6">Hệ thống AI đang phân tích và tổng hợp đánh giá cho vị trí: <strong className="text-foreground">{jobInfo.title || "N/A"}</strong></p>

          {/* Process steps checklist */}
          <div className="space-y-4 text-left max-w-xs mx-auto mb-6 border border-slate-100 dark:border-border/60 rounded-xl p-5 bg-slate-50/30">
            {steps.map((step, idx) => {
              const isDone = processingStep > idx || processingStep === 4;
              const isActive = processingStep === idx;
              return (
                <div key={idx} className="flex items-center gap-3.5 text-xs">
                  {isDone ? (
                    <CheckCircle2Icon className="size-4.5 text-emerald-500 shrink-0" />
                  ) : isActive ? (
                    <Loader2Icon className="size-4.5 text-primary animate-spin shrink-0" />
                  ) : (
                    <div className="size-4.5 rounded-full border border-slate-200 dark:border-border/60 shrink-0 bg-white dark:bg-slate-900" />
                  )}
                  <span className={cn(
                    "font-medium transition-colors duration-300",
                    isDone ? "text-muted-foreground font-normal" : isActive ? "text-primary font-bold" : "text-slate-400"
                  )}>
                    {step}
                  </span>
                </div>
              );
            })}
          </div>

          <div className="text-[11px] text-muted-foreground mt-4 leading-normal">
            Thời gian xử lý dự kiến: 5–15 giây.
          </div>
        </div>
      </div>
    );
  }

  // Idle state - show start button (Interview Lobby Waiting Room)
  if (!isConnecting && !isCallActive) {
    // Parse match score
    let matchScore: number | null = null;
    if (jobInfo.analysisResult) {
      try {
        const parsed = JSON.parse(jobInfo.analysisResult);
        if (parsed?.jobMatch?.score != null) {
          const rawScore = parsed.jobMatch.score;
          matchScore = rawScore <= 10 ? Math.round(rawScore * 10) : Math.round(rawScore);
        }
      } catch (e) {
        console.error("Failed to parse match score in lobby", e);
      }
    }

    const formatLevel = (level: string) => {
      switch (level) {
        case "intern": return "Intern";
        case "fresh": return "Fresher";
        case "junior": return "Junior";
        case "mid-level": return "Middle";
        case "senior": return "Senior";
        default: return level;
      }
    };

    return (
      <div className="container py-6 max-w-4xl mx-auto">
        <div className="bg-white dark:bg-card border border-slate-100 dark:border-border/60 rounded-2xl shadow-xl overflow-hidden p-6 md:p-8">

          {/* Lobby Header */}
          <div className="flex items-center gap-3 pb-5 border-b border-slate-100 dark:border-border/60 mb-6">
            <div className="relative flex size-12 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
              <MicIcon className="size-5 animate-pulse" />
              <span className="absolute inset-0 rounded-full bg-primary/25 animate-ping opacity-60" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground">Trước khi phỏng vấn AI </h1>
              <p className="text-xs text-muted-foreground">Chuẩn bị thiết bị, microphone và các thông tin cần thiết trước khi bắt đầu.</p>
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-2">

            {/* Left Column: Interview Details */}
            <div className="space-y-5">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">Thông tin buổi phỏng vấn</h3>
                <div className="space-y-2.5 rounded-xl border border-slate-100 dark:border-border/60 bg-slate-50/30 p-4">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-muted-foreground">Ứng viên:</span>
                    <span className="font-bold text-foreground">{jobInfo.name}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-muted-foreground">Vị trí ứng tuyển:</span>
                    <span className="font-bold text-foreground">{jobInfo.title || "N/A"}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-muted-foreground">Cấp độ phỏng vấn:</span>
                    <Badge variant="outline" className="rounded-md font-semibold text-[10px] py-0 px-2">
                      {formatLevel(jobInfo.experienceLevel)}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-muted-foreground">Thời lượng dự kiến:</span>
                    <span className="font-semibold text-foreground">~10 - 15 phút</span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-muted-foreground">Số câu hỏi dự kiến:</span>
                    <span className="font-semibold text-foreground">5 câu hỏi</span>
                  </div>
                  {matchScore !== null && (
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-muted-foreground">Match Score CV/JD:</span>
                      <span className="font-bold text-emerald-650 dark:text-emerald-400">{matchScore}%</span>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">Những gì sẽ diễn ra</h3>
                <ul className="text-xs text-muted-foreground space-y-2 pl-1">
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-0.5">•</span>
                    <span>AI sẽ đóng vai nhà tuyển dụng và đặt câu hỏi cho bạn.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-0.5">•</span>
                    <span>Câu hỏi được cá nhân hóa, tạo ra dựa trên JD và CV của bạn.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-0.5">•</span>
                    <span>Bao gồm cả câu hỏi chuyên môn và xử lý tình huống thực tế.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-0.5">•</span>
                    <span>Hệ thống tự động chấm điểm và cung cấp feedback chi tiết sau cuộc gọi.</span>
                  </li>
                </ul>
              </div>
            </div>

            {/* Right Column: Checklist & Tips */}
            <div className="space-y-5">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">Checklist trước khi bắt đầu</h3>
                <div className="space-y-2.5 rounded-xl border border-slate-100 dark:border-border/60 p-4">
                  <div className="flex items-center gap-2.5 text-xs">
                    <CheckCircle2Icon className="size-4 text-emerald-500 shrink-0" />
                    <span className="text-foreground font-medium">Kiểm tra microphone hoạt động bình thường</span>
                  </div>
                  <div className="flex items-center gap-2.5 text-xs">
                    <CheckCircle2Icon className="size-4 text-emerald-500 shrink-0" />
                    <span className="text-foreground font-medium">Ngồi ở nơi yên tĩnh, hạn chế tiếng ồn</span>
                  </div>
                  <div className="flex items-center gap-2.5 text-xs">
                    <CheckCircle2Icon className="size-4 text-emerald-500 shrink-0" />
                    <span className="text-foreground font-medium">Sẵn sàng trả lời trực tiếp bằng giọng nói</span>
                  </div>
                  <div className="flex items-center gap-2.5 text-xs">
                    <CheckCircle2Icon className="size-4 text-emerald-500 shrink-0" />
                    <span className="text-foreground font-medium">Đảm bảo kết nối internet ổn định</span>
                  </div>
                </div>
              </div>

              <div className="rounded-xl border border-amber-100 bg-amber-50/20 p-4 dark:border-amber-950/10 dark:bg-amber-950/5">
                <div className="flex gap-2">
                  <LightbulbIcon className="size-4 text-amber-500 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-xs font-bold text-amber-900 dark:text-amber-400">Mẹo nhanh</h4>
                    <p className="mt-1 text-xs text-amber-800 dark:text-amber-300 leading-normal">
                      &ldquo;Hãy trả lời tự nhiên như một cuộc phỏng vấn thực tế. Trả lời theo mô hình <strong>STAR</strong> (Situation, Task, Action, Result) để đạt điểm chuyên môn cao hơn.&rdquo;
                    </p>
                  </div>
                </div>
              </div>
            </div>

          </div>

          {/* Action Row */}
          <div className="flex flex-col sm:flex-row items-center justify-end gap-3 mt-8 pt-5 border-t border-slate-100 dark:border-border/60">
            <Button
              variant="outline"
              size="lg"
              onClick={() => onBack ? onBack() : router.push("/app/interview")}
              className="w-full sm:w-auto h-11 rounded-xl text-xs font-semibold px-6 cursor-pointer"
            >
              <ArrowLeftIcon className="size-4 mr-2" />
              Quay lại
            </Button>
            <Button
              size="lg"
              onClick={handleStartCall}
              className="w-full sm:w-auto h-11 rounded-xl text-xs font-bold px-8 btn-cta shadow-md cursor-pointer"
            >
              <MicIcon className="size-4 mr-2" />
              Bắt đầu phỏng vấn
            </Button>
          </div>

        </div>
      </div>
    )
  }

  // Connecting state (Interview Session Loading Room)
  if (isConnecting) {
    // Parse match score
    let matchScore: number | null = null;
    if (jobInfo.analysisResult) {
      try {
        const parsed = JSON.parse(jobInfo.analysisResult);
        if (parsed?.jobMatch?.score != null) {
          const rawScore = parsed.jobMatch.score;
          matchScore = rawScore <= 10 ? Math.round(rawScore * 10) : Math.round(rawScore);
        }
      } catch (e) {
        console.error("Failed to parse match score in lobby loading", e);
      }
    }

    const steps = [
      "Đang tải hồ sơ ứng viên",
      "Đang phân tích CV và JD",
      "Đang tạo bộ câu hỏi cá nhân hóa",
      "Đang kết nối AI Interviewer",
      "Chuẩn bị bắt đầu..."
    ];

    return (
      <div className="container py-8 max-w-lg mx-auto flex items-center justify-center min-h-[70vh]">
        <div className="bg-white dark:bg-card border border-slate-100 dark:border-border/60 rounded-2xl shadow-xl overflow-hidden p-6 md:p-8 w-full text-center">

          {/* AI Interviewer Avatar */}
          <div className="relative flex size-20 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 border-2 border-slate-200 dark:border-border/40 mx-auto mb-5">
            <div className="absolute inset-0 rounded-full animate-ping bg-primary/10 opacity-75" />
            <span className="text-4xl">🤖</span>
          </div>

          <h2 className="text-base font-bold text-foreground mb-1">Thiết lập phiên phỏng vấn</h2>
          <p className="text-xs text-muted-foreground mb-5">Đang cấu hình AI Interviewer theo yêu cầu của bạn.</p>

          {/* Session Metadata Card */}
          <div className="bg-slate-50/50 dark:bg-slate-900/50 border border-slate-100 dark:border-border/60 rounded-xl p-3.5 mb-6 text-left space-y-2">
            <div className="flex justify-between items-center text-xs">
              <span className="text-muted-foreground">Ứng viên:</span>
              <span className="font-semibold text-foreground">{jobInfo.name}</span>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="text-muted-foreground">Vị trí:</span>
              <span className="font-semibold text-foreground truncate max-w-[200px]">{jobInfo.title || "N/A"}</span>
            </div>
            {matchScore !== null && (
              <div className="flex justify-between items-center text-xs">
                <span className="text-muted-foreground">Match Score:</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400">{matchScore}%</span>
              </div>
            )}
            <div className="flex justify-between items-center text-xs">
              <span className="text-muted-foreground">Thời gian dự kiến:</span>
              <span className="font-semibold text-foreground">~10 - 15 phút</span>
            </div>
          </div>

          {/* Process Checklist */}
          <div className="space-y-3 text-left max-w-xs mx-auto mb-6">
            {steps.map((step, idx) => {
              const isDone = idx < connectingStep;
              const isActive = idx === connectingStep;
              return (
                <div key={idx} className="flex items-center gap-3 text-xs">
                  {isDone ? (
                    <CheckCircle2Icon className="size-4 text-emerald-500 shrink-0" />
                  ) : isActive ? (
                    <Loader2Icon className="size-4 text-primary animate-spin shrink-0" />
                  ) : (
                    <div className="size-4 rounded-full border border-slate-200 dark:border-border/60 shrink-0" />
                  )}
                  <span className={cn(
                    "font-medium",
                    isDone ? "text-muted-foreground line-through" : isActive ? "text-primary font-bold" : "text-slate-400"
                  )}>
                    {step}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Wave Loading / Typing Indicator */}
          <div className="flex items-center justify-center gap-1 mt-6 pt-4 border-t border-slate-100 dark:border-border/60">
            <span className="text-[10px] text-muted-foreground mr-1.5 font-medium">Đang thiết lập kết nối thoại</span>
            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce [animation-delay:0ms]" />
            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce [animation-delay:150ms]" />
            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce [animation-delay:300ms]" />
          </div>

        </div>
      </div>
    )
  }

  return (
    <div className="h-screen flex flex-col bg-slate-950 text-slate-100 overflow-hidden font-sans relative">
      {/* 1. Fixed Header */}
      <header className="h-16 shrink-0 border-b border-slate-800/80 bg-slate-900/90 backdrop-blur-md px-6 flex items-center justify-between z-20">
        <div className="flex items-center gap-3">
          <div className="size-10 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center">
            <span className="text-xl">🤖</span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-semibold text-sm text-slate-100">{interviewerName}</h2>
              <Badge variant="outline" className="text-[10px] py-0 px-1.5 border-slate-800 text-slate-400 bg-slate-900">
                AI Interviewer
              </Badge>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-slate-400 mt-0.5">
              <ClockIcon className="size-3 text-slate-500" />
              <span>Thời lượng:</span>
              <span className="font-mono font-bold text-slate-200">{duration}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="hidden sm:flex items-center gap-2 bg-slate-900/80 border border-slate-800/60 rounded-full py-1 px-3">
            <span className="relative flex h-2 w-2">
              <span className={cn(
                "animate-ping absolute inline-flex h-full w-full rounded-full opacity-75",
                isCallActive ? "bg-emerald-400" : "bg-amber-400"
              )}></span>
              <span className={cn(
                "relative inline-flex rounded-full h-2 w-2",
                isCallActive ? "bg-emerald-500" : "bg-amber-500"
              )}></span>
            </span>
            <span className="text-[11px] font-medium text-slate-300">
              {isCallActive ? "Đang kết nối phỏng vấn" : "Mất kết nối"}
            </span>
          </div>

          <Button
            variant="destructive"
            size="sm"
            onClick={handleEndCall}
            className="h-9 px-4 rounded-lg text-xs font-bold shrink-0 hover:bg-red-600 transition-colors"
          >
            <PhoneOffIcon className="size-3.5 mr-1.5" />
            Kết thúc phỏng vấn
          </Button>
        </div>
      </header>

      {/* 2. Main Workspace Layout */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Main Conversation Window */}
        <div className="flex-1 flex flex-col overflow-hidden bg-slate-950">
          <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-6 space-y-6 scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-transparent">
            {messages.length === 0 && !liveTranscript ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-8">
                <div className="size-16 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center mb-4 animate-pulse">
                  <BotIcon className="size-8 text-primary" />
                </div>
                <p className="text-sm font-semibold text-slate-300">
                  Đang thiết lập phòng phỏng vấn...
                </p>
                <p className="text-xs text-slate-500 mt-1 max-w-xs">
                  AI đang chuẩn bị câu hỏi đầu tiên dựa trên CV & JD của bạn.
                </p>
              </div>
            ) : (
              <div className="max-w-3xl mx-auto space-y-6">
                {allMessages.map((message, index) => {
                  const isLastMessage = index === allMessages.length - 1
                  const isLiveUser = isLastMessage && !!liveUserTranscript
                  const isStreamingAI = isLastMessage && !!liveAssistantTranscript
                  const isAI = message.role === "assistant"

                  return (
                    <div
                      key={index}
                      className={cn(
                        "flex items-start gap-3.5 animate-in fade-in slide-in-from-bottom-2 duration-300",
                        isAI ? "justify-start" : "justify-end"
                      )}
                    >
                      {isAI && (
                        <div className="size-8.5 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center flex-shrink-0 shadow-md">
                          <BotIcon className="size-4.5 text-primary" />
                        </div>
                      )}

                      <div className="space-y-1 max-w-[82%]">
                        <div className={cn(
                          "text-[10px] font-semibold tracking-wide uppercase px-1",
                          isAI ? "text-slate-400 text-left" : "text-slate-400 text-right"
                        )}>
                          {isAI ? interviewerName : "Ứng viên"}
                        </div>

                        <div className={cn(
                          "px-4 py-3 rounded-2xl text-[13.5px] leading-relaxed shadow-sm",
                          isAI
                            ? "bg-slate-900/60 border border-slate-800/80 text-slate-100 rounded-tl-none"
                            : "bg-primary text-primary-foreground rounded-tr-none font-medium",
                          isLiveUser ? "opacity-75 italic" : ""
                        )}>
                          <p>{message.content}</p>
                          {isStreamingAI && (
                            <span className="inline-flex gap-0.5 items-center ml-1">
                              <span className="w-1 h-1 rounded-full bg-slate-400 animate-bounce [animation-delay:0ms]" />
                              <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce [animation-delay:150ms]" />
                              <span className="w-1 h-1 rounded-full bg-slate-400 animate-bounce [animation-delay:300ms]" />
                            </span>
                          )}
                        </div>
                      </div>

                      {!isAI && (
                        <div className="size-8.5 rounded-full bg-primary flex items-center justify-center flex-shrink-0 shadow-md">
                          <UserIcon className="size-4.5 text-primary-foreground" />
                        </div>
                      )}
                    </div>
                  )
                })}

                {/* AI Thinking Indicator bubble */}
                {isAiThinking && (
                  <div className="flex items-start gap-3.5 justify-start animate-pulse">
                    <div className="size-8.5 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center flex-shrink-0">
                      <BotIcon className="size-4.5 text-slate-500" />
                    </div>
                    <div className="space-y-1 max-w-[80%]">
                      <div className="text-[10px] font-semibold tracking-wide uppercase text-slate-500 px-1">
                        {interviewerName}
                      </div>
                      <div className="px-4 py-3 rounded-2xl rounded-tl-none bg-slate-900/40 border border-slate-900/80 text-slate-400 flex items-center gap-2">
                        <span className="text-[12.5px] font-medium">AI đang đánh giá câu trả lời...</span>
                        <span className="inline-flex gap-0.5 items-center">
                          <span className="w-1 h-1 rounded-full bg-slate-500 animate-bounce [animation-delay:0ms]" />
                          <span className="w-1 h-1 rounded-full bg-slate-500 animate-bounce [animation-delay:150ms]" />
                          <span className="w-1 h-1 rounded-full bg-slate-500 animate-bounce [animation-delay:300ms]" />
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Collapsible Sidebar Support Panel */}
        {/* <aside className={cn(
          "shrink-0 border-l border-slate-800/60 bg-slate-900/30 backdrop-blur-md flex flex-col transition-all duration-300 z-10",
          isSidebarOpen ? "w-[300px]" : "w-0 overflow-hidden border-l-0"
        )}>
          {isSidebarOpen && (
            <div className="flex-1 flex flex-col p-5 space-y-5 overflow-y-auto scrollbar-none">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <TrendingUpIcon className="size-3.5 text-primary animate-pulse" />
                  Tiến độ phỏng vấn
                </h3>
                <div className="mt-3 bg-slate-900/80 border border-slate-800 rounded-xl p-3.5 space-y-3">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-400">Số câu đã hỏi:</span>
                    <span className="font-bold text-slate-200">{Math.min(questionsAskedCountRef.current, 5)} / 5</span>
                  </div>
                  <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary transition-all duration-500"
                      style={{ width: `${Math.min((questionsAskedCountRef.current / 5) * 100, 100)}%` }}
                    />
                  </div>
                  <div className="text-[10px] text-slate-500 leading-normal">
                    AI sẽ đặt 5 câu hỏi chính xoay quanh các kỹ năng cốt lõi dựa trên hồ sơ của bạn.
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <AwardIcon className="size-3.5 text-yellow-500" />
                  Kỹ năng đánh giá
                </h3>
                <div className="mt-3 flex flex-wrap gap-1.5 bg-slate-900/40 border border-slate-800/40 rounded-xl p-3">
                  <Badge variant="outline" className="text-[10.5px] border-slate-800 bg-slate-900 text-slate-300">
                    {jobInfo.title || "Chuyên môn"}
                  </Badge>
                  <Badge variant="outline" className="text-[10.5px] border-slate-800 bg-slate-900 text-slate-300">
                    Phản xạ giọng nói
                  </Badge>
                  <Badge variant="outline" className="text-[10.5px] border-slate-800 bg-slate-900 text-slate-300">
                    Tư duy giải quyết vấn đề
                  </Badge>
                  <Badge variant="outline" className="text-[10.5px] border-slate-800 bg-slate-900 text-slate-300">
                    Giao tiếp & Ứng xử
                  </Badge>
                </div>
              </div>

              <div className="flex-1 flex flex-col justify-end">
                <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 space-y-2.5">
                  <div className="flex items-center gap-2 text-xs font-bold text-primary">
                    <SparklesIcon className="size-4 animate-bounce" />
                    <span>Gợi ý trả lời STAR</span>
                  </div>
                  <ul className="text-[11px] text-slate-300 space-y-2">
                    <li className="flex gap-1.5">
                      <span className="font-bold text-primary">S:</span>
                      <span><strong>Situation</strong> - Nêu bối cảnh/tình huống thực tế.</span>
                    </li>
                    <li className="flex gap-1.5">
                      <span className="font-bold text-primary">T:</span>
                      <span><strong>Task</strong> - Xác định nhiệm vụ/thách thức cụ thể.</span>
                    </li>
                    <li className="flex gap-1.5">
                      <span className="font-bold text-primary">A:</span>
                      <span><strong>Action</strong> - Mô tả các hành động của bạn đã làm.</span>
                    </li>
                    <li className="flex gap-1.5">
                      <span className="font-bold text-primary">R:</span>
                      <span><strong>Result</strong> - Chỉ ra kết quả đạt được bằng con số.</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          )}
        </aside> */}

        {/* Collapsible toggle tab */}
        <button
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="absolute right-0 top-1/2 -translate-y-1/2 z-20 size-6 rounded-l-md border border-slate-800 border-r-0 bg-slate-900 flex items-center justify-center text-slate-400 hover:text-slate-200 transition-colors focus:outline-none"
        >
          {isSidebarOpen ? <ChevronRightIcon className="size-4" /> : <ChevronLeftIcon className="size-4" />}
        </button>
      </div>

      {/* 3. Bottom Recording Dock */}
      <footer className="shrink-0 border-t border-slate-800/80 bg-slate-900/90 backdrop-blur-md py-6 px-6 z-10">
        <div className="max-w-3xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          {/* Audio Waveform visual */}
          <div className="flex items-center gap-3 w-full md:w-auto justify-center md:justify-start">
            <div className="flex items-center gap-[3px] h-6">
              {Array.from({ length: 12 }).map((_, i) => {
                const heights = ["h-2", "h-4", "h-5", "h-3", "h-6", "h-4", "h-5", "h-2", "h-4", "h-3", "h-5", "h-2"]
                return (
                  <div
                    key={i}
                    className={cn(
                      "w-[3px] rounded-full bg-primary transition-all duration-300",
                      isMuted || !isCallActive ? "bg-slate-700 h-1" : cn(heights[i], "animate-pulse")
                    )}
                    style={{
                      animationDelay: `${i * 75}ms`,
                      animationDuration: "0.8s"
                    }}
                  />
                )
              })}
            </div>
            <div className="text-xs text-slate-400 font-medium">
              {isMuted ? (
                <span className="text-red-400">Microphone đã tắt</span>
              ) : isAiThinking ? (
                <span className="text-slate-400">AI đang xử lý...</span>
              ) : (
                <span className="text-emerald-400 animate-pulse">Hệ thống đang nghe...</span>
              )}
            </div>
          </div>

          {/* Large Center Mic Control */}
          <div className="flex items-center gap-4">
            <Button
              size="lg"
              onClick={handleToggleMute}
              className={cn(
                "rounded-full size-14 shadow-lg flex items-center justify-center transition-all duration-300 border",
                isMuted
                  ? "bg-slate-800 hover:bg-slate-700 border-slate-700 text-red-400"
                  : "bg-primary hover:bg-primary/90 border-primary/20 text-primary-foreground ring-4 ring-primary/15"
              )}
            >
              {isMuted ? <MicOffIcon className="size-6" /> : <MicIcon className="size-6" />}
            </Button>
          </div>

          {/* Session Timer info */}
          <div className="text-right hidden md:block">
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
              Phiên trả lời thoại
            </p>
            <p className="text-xs text-slate-300 font-medium mt-0.5">
              Nói tự nhiên để trả lời câu hỏi
            </p>
          </div>
        </div>
      </footer>

    </div>
  )
}
