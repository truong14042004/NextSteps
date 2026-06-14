"use client"

import { Button } from "@/components/ui/button"
import { env } from "@/data/env/client"
import { createInterview, updateInterview, syncVapiTranscript } from "@/features/interviews/actions"
import { errorToast } from "@/lib/errorToast"
import Vapi from "@vapi-ai/web"
import { Loader2Icon, MicIcon, MicOffIcon, PhoneOffIcon, ArrowLeftIcon, CheckCircle2Icon, SparklesIcon, LightbulbIcon, UserIcon, BriefcaseIcon, ClockIcon, AwardIcon } from "lucide-react"
import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import { useCallback, useEffect, useRef, useState } from "react"
import { InterviewJobInfo } from "./page"
import { toast } from "sonner"
import { getRandomMaleInterviewerName } from "./vapiInterviewPrompt.mjs"
import { buildVapiStartCallArgs } from "./vapiStartCallConfig.mjs"
import {
  buildAnsweredQuestionsSystemMessage,
  getAnsweredQuestionsAfterUserTranscript,
  normalizeInterviewText,
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
  ]

  return closingPhrases.some(phrase => normalized.includes(phrase))
}

type AiMsg = { role: "assistant" | "user"; content: string }

// Thêm/cập nhật lời AI theo kiểu APPEND-ONLY (không bao giờ xóa tin nhắn cũ):
//  - cùng lượt đang nói (nội dung trùng/nối dài câu AI gần nhất) → cập nhật,
//    giữ bản dài hơn (không để co lại)
//  - nội dung đã xuất hiện ở MỘT tin nhắn AI nào đó (vd Vapi phát LẠI lời
//    chào/câu hỏi do cuộc gọi khởi động lại) → BỎ QUA, không thêm trùng
//  - khác hẳn → câu hỏi MỚI → thêm bong bóng mới
// Nhờ append-only + chống trùng, câu hỏi đã hiện sẽ KHÔNG biến mất khi user
// trả lời, và lời chào/câu hỏi cũng không bị lặp dù Vapi gửi lại.
function commitAssistantTurn(prev: AiMsg[], rawContent: string): AiMsg[] {
  const content = rawContent.trim()
  if (content === "") return prev

  const b = normalizeInterviewText(content)
  if (b === "") return prev

  let lastIndex = -1
  for (let i = prev.length - 1; i >= 0; i -= 1) {
    if (prev[i].role === "assistant") {
      lastIndex = i
      break
    }
  }

  if (lastIndex !== -1) {
    const a = normalizeInterviewText(prev[lastIndex].content)
    const isSameTurn = a === b || b.startsWith(a) || a.startsWith(b)

    if (isSameTurn) {
      // cùng một lượt: giữ bản dài hơn, không để bong bóng co lại
      if (content.length <= prev[lastIndex].content.length) return prev
      const updated = [...prev]
      updated[lastIndex] = { role: "assistant", content }
      return updated
    }
  }

  // Chống trùng: nếu nội dung này đã có ở một tin nhắn AI trước đó (Vapi phát
  // lại lời chào/câu hỏi) thì không thêm nữa.
  const alreadyExists = prev.some(
    m => m.role === "assistant" && normalizeInterviewText(m.content) === b,
  )
  if (alreadyExists) return prev

  return [...prev, { role: "assistant", content }]
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
  const [isFinishingInterview, setIsFinishingInterview] = useState(false)
  const [finishProgress, setFinishProgress] = useState(0)
  const [finishStep, setFinishStep] = useState(0)
  const [dynamicMessage, setDynamicMessage] = useState("AI đang đọc transcript...")

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
  const microphoneDeviceIdRef = useRef<string | null>(null)
  const microphoneRecoveryTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const lastRecognizedSpeechAtRef = useRef(0)
  const lastMicrophoneRecoveryAtRef = useRef(0)
  const isRecoveringMicrophoneRef = useRef(false)
  const hasReceivedUserAudioRef = useRef(false)
  const endedReasonRef = useRef<string | null>(null)
  const vapiCallIdRef = useRef<string | null>(null)
  const lastAssistantQuestionRef = useRef<string | null>(null)
  const answeredAssistantQuestionsRef = useRef<string[]>([])
  const assistantModelOutputRef = useRef("")
  const questionsAskedCountRef = useRef(0)      // số câu hỏi AI đã hỏi
  const isLastQuestionRef = useRef(false)       // flag: đây là câu cuối, user trả lời xong thì đóng
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

  const finalizeCall = useCallback(async (options?: {
    notice?: { type: "info" | "error"; message: string }
    fallbackNotice?: { type: "info" | "error"; message: string }
  }) => {
    if (hasFinalizedRef.current) return
    hasFinalizedRef.current = true

    clearDurationTimer()
    clearMicrophoneRecoveryTimer()
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
      setIsFinishingInterview(true)
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
        toast.error("Cuộc gọi đã kết thúc nhưng không lưu được kết quả.")
        setIsFinishingInterview(false)
        return
      }

      // Lấy transcript CHUẨN từ Vapi (đè lên bản client tự ghép) để phần xem
      // lại hiển thị đúng từng câu hỏi/câu trả lời. Best-effort: nếu lỗi/chưa
      // sẵn sàng thì vẫn giữ bản client đã lưu ở trên.
      const currentCallId = vapiCallIdRef.current
      if (currentCallId) {
        try {
          await syncVapiTranscript(currentId, currentCallId)
        } catch (error) {
          console.warn("Failed to sync Vapi transcript:", error)
        }
      }

      if (options?.notice) {
        if (options.notice.type === "error") {
          toast.error(options.notice.message)
        } else {
          toast.info(options.notice.message)
        }
      }

      setFinishProgress(100)
      setFinishStep(4)
      await new Promise(resolve => setTimeout(resolve, 1500))
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
  }, [clearDurationTimer, clearMicrophoneRecoveryTimer, router, stopMicrophoneStream])

  // Keep refs in sync with state
  useEffect(() => { messagesRef.current = messages }, [messages])
  useEffect(() => { interviewIdRef.current = interviewId }, [interviewId])
  useEffect(() => { durationRef.current = duration }, [duration])

  useEffect(() => {
    let interval: NodeJS.Timeout
    let msgInterval: NodeJS.Timeout
    const DYNAMIC_AI_MESSAGES = [
      "AI đang đọc transcript...",
      "AI đang đánh giá kỹ năng giao tiếp...",
      "AI đang phân tích chuyên môn...",
      "AI đang xác định điểm mạnh...",
      "AI đang tạo đề xuất cải thiện...",
      "AI đang so sánh với JD tuyển dụng...",
    ]

    if (isFinishingInterview) {
      setFinishProgress(0)
      setFinishStep(0)
      setDynamicMessage(DYNAMIC_AI_MESSAGES[0])

      interval = setInterval(() => {
        setFinishProgress(prev => {
          if (prev >= 95) return 95
          const next = prev + Math.floor(Math.random() * 8) + 4
          if (next < 25) setFinishStep(0)
          else if (next < 50) setFinishStep(1)
          else if (next < 75) setFinishStep(2)
          else setFinishStep(3)
          return next
        })
      }, 400)

      let msgIdx = 0
      msgInterval = setInterval(() => {
        msgIdx = (msgIdx + 1) % DYNAMIC_AI_MESSAGES.length
        setDynamicMessage(DYNAMIC_AI_MESSAGES[msgIdx])
      }, 2000)
    }
    return () => {
      clearInterval(interval)
      clearInterval(msgInterval)
    }
  }, [isFinishingInterview])

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
      void finalizeCall()
    })

    vapiInstance.on("speech-start", () => {
      console.log("Vapi speech started")
      // KHÔNG reset assistantModelOutputRef ở đây. Một câu hỏi có thể được nói
      // qua nhiều đoạn (speech-start nhiều lần); reset giữa chừng sẽ làm câu
      // hỏi bị tách mảnh. Bộ đệm chỉ reset khi ứng viên trả lời (lượt AI mới).
    })

    vapiInstance.on("speech-end", () => {
      console.log("Vapi speech ended")
      // AI nói xong → CHỐT câu hỏi vào messages và TẮT bong bóng "live" (dấu
      // ...). Nhờ vậy câu hỏi thành tin nhắn cố định, không còn trôi nổi và
      // không biến mất khi ứng viên trả lời. commitAssistantTurn là append-only
      // + nối dài cùng lượt nên không tạo bản trùng/mảnh.
      setMessages(prev => {
        const next = commitAssistantTurn(prev, assistantModelOutputRef.current)
        if (next !== prev) messagesRef.current = next
        return next
      })
      setLiveTranscript(null)
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

      // Backup: bắt callId từ các sự kiện (phòng khi vapi.start() không trả id)
      const callObj = message.call
      if (
        vapiCallIdRef.current == null &&
        callObj != null &&
        typeof callObj === "object" &&
        typeof (callObj as { id?: unknown }).id === "string"
      ) {
        vapiCallIdRef.current = (callObj as { id: string }).id
      }

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
        // Không reset bộ đệm ở đây (xem speech-start) để câu hỏi nhiều đoạn
        // được ghép đầy đủ thay vì tách mảnh.
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

        // FLUSH: lưu câu hỏi AI đang hiển thị (nội dung live từ model-output)
        // vào messages NGAY khi user bắt đầu nói — trước khi bong bóng live bị
        // lời user ghi đè. Append-only nên nếu đã commit rồi thì không trùng.
        // Đây là chốt chặn để câu hỏi KHÔNG biến mất khi user trả lời.
        const pendingAiQuestion = assistantModelOutputRef.current.trim()
        if (pendingAiQuestion !== "") {
          setMessages(prev => {
            const next = commitAssistantTurn(prev, pendingAiQuestion)
            if (next !== prev) messagesRef.current = next
            return next
          })
        }

        if (message.transcriptType === "final") {
          // Câu hỏi thứ 5 đã được hỏi → user vừa trả lời → kết thúc ngay
          if (isLastQuestionRef.current) {
            isLastQuestionRef.current = false
            vapiRef.current?.send({
              type: "add-message",
              message: {
                role: "system",
                content: `[SYSTEM NOTE - BẮT BUỘC] Ứng viên đã trả lời đủ 5 câu hỏi. DỪNG HỎI THÊM. Đọc ngay câu kết thúc: "Cảm ơn bạn đã dành thời gian tham gia buổi phỏng vấn hôm nay. Chúc bạn may mắn!"`,
              },
              triggerResponseEnabled: true,
            })
          } else {
            // Câu 1–4: track answered để tránh lặp câu hỏi
            const nextAnsweredQuestions = getAnsweredQuestionsAfterUserTranscript({
              answeredQuestions: answeredAssistantQuestionsRef.current,
              lastAssistantQuestion: lastAssistantQuestionRef.current,
              userTranscript: transcript,
            })

            if (
              nextAnsweredQuestions.length !==
              answeredAssistantQuestionsRef.current.length
            ) {
              answeredAssistantQuestionsRef.current = nextAnsweredQuestions
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
          }

          // Thêm câu trả lời của ứng viên vào messages (append-only). Các mẩu
          // "final" liên tiếp của cùng một lượt nói được gộp thành một câu trả
          // lời hoàn chỉnh. Vì câu hỏi AI đã được lưu append-only trước đó nên
          // câu trả lời mới không bị dồn nhầm vào câu trả lời cũ.
          setMessages(prev => {
            const incoming = transcript.trim()
            if (incoming === "") return prev

            const last = prev.at(-1)
            if (last?.role === "user") {
              const merged = [...prev]
              merged[merged.length - 1] = {
                role: "user",
                content: `${last.content} ${incoming}`.trim(),
              }
              messagesRef.current = merged
              return merged
            }

            const next = [...prev, { role: "user" as const, content: incoming }]
            messagesRef.current = next
            return next
          })
          // Ứng viên đã trả lời xong → câu hỏi của lượt vừa rồi đã chốt; reset
          // bộ đệm model-output để câu hỏi TIẾP THEO của AI bắt đầu sạch, không
          // bị nối nhầm với câu hỏi trước.
          assistantModelOutputRef.current = ""
          setLiveTranscript(null)
        } else {
          setLiveTranscript({ role: "user", content: transcript })
        }
      }

      if (message.type === "model-output") {
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

        // Lấy bản ghi assistant/bot CUỐI CÙNG làm câu hỏi hiện tại của AI.
        // (Không nối nhiều bản ghi vì khi cuộc gọi bị phát lại, các bản ghi
        // assistant liên tiếp có thể là lời chào + câu hỏi cũ → nối lại sẽ rối.
        // commitAssistantTurn đã chống trùng và nối-dài cùng lượt.)
        const lastAssistantItem = [...conversation]
          .reverse()
          .find(item => item.role === "assistant" || item.role === "bot")
        const aiTurn = lastAssistantItem?.content.trim() ?? ""

        if (aiTurn !== "") {
          // Lưu lời AI theo kiểu append-only → câu hỏi KHÔNG biến mất khi user
          // trả lời (không dựng lại/ghi đè cả danh sách).
          setMessages(prev => {
            const next = commitAssistantTurn(prev, aiTurn)
            if (next !== prev) messagesRef.current = next
            return next
          })
          setLiveTranscript(null)

          if (shouldTrackAssistantQuestion(aiTurn)) {
            const previousQuestion = lastAssistantQuestionRef.current

            // conversation-update fire NHIỀU lần cho cùng một câu hỏi khi AI
            // đang stream. Chỉ tăng count khi đây thực sự là câu hỏi MỚI
            // (không phải phần nối tiếp của câu vừa đếm) để không kết thúc sớm.
            const prevNormalized = previousQuestion
              ? normalizeInterviewText(previousQuestion)
              : ""
            const curNormalized = normalizeInterviewText(aiTurn)
            const isSameQuestion =
              prevNormalized !== "" &&
              (prevNormalized === curNormalized ||
                curNormalized.startsWith(prevNormalized) ||
                prevNormalized.startsWith(curNormalized))

            lastAssistantQuestionRef.current = aiTurn

            if (!isSameQuestion) {
              questionsAskedCountRef.current += 1
              const count = questionsAskedCountRef.current
              console.info(`AI hỏi câu ${count}`)

              if (count >= 5) {
                isLastQuestionRef.current = true
              }
            }
          }

          if (isClosingAssistantMessage(aiTurn)) {
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
  }, [clearDurationTimer, finalizeCall, markRecognizedSpeech, scheduleMicrophoneRecovery])

  useEffect(() => {
    if (!env.NEXT_PUBLIC_VAPI_PUBLIC_KEY) {
      console.error("Vapi public key not found")
      return
    }

    return () => {
      clearDurationTimer()
      clearMicrophoneRecoveryTimer()
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
    lastAssistantQuestionRef.current = null
    answeredAssistantQuestionsRef.current = []
    questionsAskedCountRef.current = 0
    isLastQuestionRef.current = false
    vapiCallIdRef.current = null
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
      const startedCall = await vapi.start(
        ...buildVapiStartCallArgs({
          assistantId: env.NEXT_PUBLIC_VAPI_ASSISTANT_ID,
          jobInfo,
          interviewerName: nextInterviewerName,
        }),
      )

      // Lưu callId để sau khi kết thúc lấy transcript chuẩn từ API Vapi.
      const startedCallId =
        startedCall != null && typeof startedCall === "object" && "id" in startedCall
          ? (startedCall as { id?: unknown }).id
          : null
      if (typeof startedCallId === "string" && startedCallId !== "") {
        vapiCallIdRef.current = startedCallId
      }
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

  // Finishing state
  if (isFinishingInterview) {
    const finishingSteps = [
      "Lưu cuộc phỏng vấn",
      "Đồng bộ transcript",
      "Phân tích kỹ năng",
      "Tạo feedback AI"
    ]
    return (
      <div className="min-h-[calc(100vh-6rem)] flex items-center justify-center py-6 px-4 bg-gradient-to-br from-red-50/20 via-white to-purple-50/20 bg-[radial-gradient(circle_at_center,rgba(220,38,38,0.04),rgba(139,92,246,0.04),#ffffff)]">
        <div className="w-full max-w-xl bg-white/80 backdrop-blur-md border border-slate-200/80 rounded-[24px] shadow-sm p-6 md:p-8 space-y-6 text-center transition-all duration-350 scale-100 animate-in fade-in zoom-in-95">
          
          {/* AI Icon with pulse, glow, scale */}
          <div className="relative flex items-center justify-center mx-auto py-2">
            <div className="absolute size-16 rounded-full bg-red-500/10 animate-ping duration-1000" />
            <div className="absolute size-12 rounded-full bg-purple-500/10 animate-pulse duration-1000" />
            <div className="relative size-10 rounded-full bg-gradient-to-tr from-red-500 to-purple-600 flex items-center justify-center text-white shadow-md shadow-purple-500/20 hover:scale-105 transition-transform">
              <SparklesIcon className="size-5 animate-pulse" />
            </div>
          </div>
          
          <div className="space-y-2">
            <h3 className="text-lg font-bold text-slate-900">
              {finishStep === 4 ? "✓ Phân tích hoàn tất" : "AI đang tổng hợp buổi phỏng vấn"}
            </h3>
            <p className="text-xs text-slate-500 font-medium h-4 transition-all duration-300">
              {finishStep === 4 ? "Đang chuẩn bị điều hướng..." : dynamicMessage}
            </p>
          </div>

          <div className="space-y-2.5 pt-1">
            {/* Shimmer gradient progress bar */}
            <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden p-[1px]">
              <div 
                className="h-full bg-gradient-to-r from-red-500 via-orange-500 to-purple-500 rounded-full transition-all duration-300 ease-out"
                style={{ width: `${finishProgress}%` }}
              />
            </div>
            <div className="flex justify-between items-center text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              <span>Đang tạo báo cáo AI</span>
              <span className="text-purple-600 font-extrabold">{finishProgress}%</span>
            </div>
          </div>

          {/* Vertical Timeline */}
          <div className="border border-slate-150 rounded-2xl bg-white p-5 space-y-4 text-left shadow-2xs">
            {finishingSteps.map((step, idx) => {
              const isCompleted = finishStep > idx
              const isCurrent = finishStep === idx
              return (
                <div key={idx} className="flex items-center gap-3">
                  <div className="flex items-center justify-center">
                    {isCompleted ? (
                      <div className="size-4.5 rounded-full bg-emerald-500 text-white flex items-center justify-center text-[9px] font-bold">
                        ✓
                      </div>
                    ) : isCurrent ? (
                      <div className="relative size-4.5">
                        <span className="absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75 animate-ping" />
                        <div className="size-4.5 rounded-full bg-red-500 text-white flex items-center justify-center text-[9px] font-bold">
                          ⟳
                        </div>
                      </div>
                    ) : (
                      <div className="size-4.5 rounded-full bg-slate-100 border border-slate-200" />
                    )}
                  </div>
                  <span className={cn(
                    "text-xs font-bold transition-colors duration-300",
                    isCompleted 
                      ? "text-emerald-600 line-through decoration-emerald-500/40" 
                      : isCurrent 
                      ? "text-red-650" 
                      : "text-slate-400"
                  )}>
                    {step}
                  </span>
                </div>
              )
            })}
          </div>

          {/* Animated skeleton lines beneath */}
          <div className="space-y-2 pt-2 animate-pulse">
            <div className="h-3 w-full bg-slate-100 rounded-md" />
            <div className="h-3 w-5/6 bg-slate-100 rounded-md" />
            <div className="h-3 w-2/3 bg-slate-100 rounded-md" />
          </div>
        </div>
      </div>
    )
  }

  // Idle state - show start button
  if (!isConnecting && !isCallActive) {
    return (
      <div className="min-h-[calc(100vh-6rem)] flex items-center justify-center py-6 px-4">
        <div className="w-full max-w-3xl md:max-w-4xl bg-white border border-slate-200 rounded-[24px] shadow-xs overflow-hidden">
          <div className="grid grid-cols-1 md:grid-cols-2">

            {/* Left Panel: Information & Checklist */}
            <div className="p-6 md:p-8 space-y-6 border-b md:border-b-0 md:border-r border-slate-200/60">
              <div className="space-y-3">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-primary/10 text-primary uppercase tracking-wider">
                  <SparklesIcon className="size-3" />
                  <span>AI Interview Lobby</span>
                </div>
                <h2 className="text-xl font-bold text-slate-900 leading-tight">
                  Sẵn sàng bắt đầu phỏng vấn?
                </h2>
              </div>

              {/* Position / Info details */}
              <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4.5 space-y-3">
                <div className="grid grid-cols-2 gap-4 text-xs">
                  <div>
                    <span className="block text-slate-400 font-semibold mb-0.5">ỨNG VIÊN</span>
                    <span className="font-bold text-slate-800 flex items-center gap-1">
                      <UserIcon className="size-3.5 text-slate-400" />
                      {jobInfo.name}
                    </span>
                  </div>
                  <div>
                    <span className="block text-slate-400 font-semibold mb-0.5">VỊ TRÍ ỨNG TUYỂN</span>
                    <span className="font-bold text-slate-800 flex items-center gap-1">
                      <BriefcaseIcon className="size-3.5 text-slate-400" />
                      {jobInfo.title}
                    </span>
                  </div>
                  {jobInfo.experienceLevel && (
                    <div>
                      <span className="block text-slate-400 font-semibold mb-0.5">CẤP ĐỘ</span>
                      <span className="font-bold text-slate-850 flex items-center gap-1">
                        <AwardIcon className="size-3.5 text-slate-400" />
                        {jobInfo.experienceLevel}
                      </span>
                    </div>
                  )}
                  <div>
                    <span className="block text-slate-400 font-semibold mb-0.5">THỜI LƯỢNG</span>
                    <span className="font-bold text-slate-800 flex items-center gap-1">
                      <ClockIcon className="size-3.5 text-slate-400" />
                      Khoảng 10 phút
                    </span>
                  </div>
                </div>
              </div>

              {/* Checklist */}
              <div className="space-y-3">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Chuẩn bị trước khi vào:
                </h3>
                <ul className="space-y-2.5">
                  <li className="flex items-start gap-2.5 text-xs text-slate-600 font-medium">
                    <CheckCircle2Icon className="size-4 text-emerald-500 shrink-0 mt-0.5" />
                    <span>Kiểm tra microphone hoạt động bình thường</span>
                  </li>
                  <li className="flex items-start gap-2.5 text-xs text-slate-600 font-medium">
                    <CheckCircle2Icon className="size-4 text-emerald-500 shrink-0 mt-0.5" />
                    <span>Chọn một không gian ngồi yên tĩnh</span>
                  </li>
                  <li className="flex items-start gap-2.5 text-xs text-slate-600 font-medium">
                    <CheckCircle2Icon className="size-4 text-emerald-500 shrink-0 mt-0.5" />
                    <span>Trả lời tự nhiên trực tiếp bằng giọng nói</span>
                  </li>
                  <li className="flex items-start gap-2.5 text-xs text-slate-600 font-medium">
                    <CheckCircle2Icon className="size-4 text-emerald-500 shrink-0 mt-0.5" />
                    <span>Nên áp dụng phương pháp STAR khi trả lời câu hỏi</span>
                  </li>
                </ul>
              </div>
            </div>

            {/* Right Panel: Lobby Visual & Action Buttons */}
            <div className="p-6 md:p-8 flex flex-col justify-between gap-6 bg-slate-50/30">
              {/* Mic animation area */}
              <div className="flex flex-col items-center justify-center py-6 space-y-4">
                <div className="relative flex items-center justify-center">
                  <div className="absolute size-20 rounded-full bg-primary/5 animate-ping duration-1000" />
                  <div className="absolute size-16 rounded-full bg-primary/10 animate-pulse duration-1000" />
                  <div className="relative size-12 rounded-full bg-primary flex items-center justify-center shadow-md shadow-primary/10">
                    <MicIcon className="size-5 text-white animate-bounce" />
                  </div>
                </div>
                <div className="text-center">
                  <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100 uppercase tracking-wider">
                    Microphone sẵn sàng
                  </span>
                </div>
              </div>

              {/* Tip Card */}
              <div className="bg-amber-50/60 border border-amber-200/60 rounded-2xl p-4 flex gap-3 text-xs text-amber-800 leading-relaxed shadow-2xs">
                <LightbulbIcon className="size-4 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <strong className="block font-bold text-amber-900 mb-0.5">Mẹo nhanh</strong>
                  Hãy trả lời như một buổi phỏng vấn thật, tập trung vào các ví dụ cụ thể của bạn.
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-col sm:flex-row gap-2.5 pt-2">
                <Button
                  variant="outline"
                  size="lg"
                  onClick={() => onBack ? onBack() : router.push("/app/interview")}
                  className="w-full sm:w-1/3 rounded-xl font-bold text-xs h-11 border-slate-200 hover:bg-slate-100 text-slate-700 transition-colors"
                >
                  <ArrowLeftIcon className="size-3.5 mr-1.5" />
                  Quay lại
                </Button>
                <Button
                  size="lg"
                  onClick={handleStartCall}
                  className="w-full sm:flex-1 rounded-xl bg-primary hover:bg-primary/95 text-white font-bold text-xs h-11 shadow-sm shadow-primary/10 transition-all cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <MicIcon className="size-3.5" />
                  Bắt đầu phỏng vấn
                </Button>
              </div>
            </div>

          </div>
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
                <h2 className="font-semibold">{interviewerName}</h2>
                <p className="text-sm text-muted-foreground">
                  Thời lượng {duration}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Câu hỏi hiện tại - luôn hiện label cố định */}
      {latestAiMessage && (
        <div className="border-b bg-primary/5">
          <div className="container max-w-3xl py-4">
            <div className="space-y-1">
              <p className="text-xs font-medium text-primary uppercase tracking-wide">
                Câu hỏi hiện tại
              </p>
              <p className="text-base leading-relaxed font-medium">
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
                  // Chỉ user interim mới hiện mờ; AI luôn hiện rõ trong chat
                  const isLastMessage = index === allMessages.length - 1
                  const isLiveUser = isLastMessage && !!liveUserTranscript
                  const isStreamingAI = isLastMessage && !!liveAssistantTranscript
                  return (
                    <div
                      key={index}
                      className={`flex items-start gap-3 ${message.role === "user" ? "justify-end" : "justify-start"
                        }`}
                    >
                      {message.role === "assistant" && (
                        <div className="size-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                          <span className="text-sm">🤖</span>
                        </div>
                      )}
                      <div
                        className={`px-4 py-3 rounded-lg max-w-[80%] ${message.role === "user"
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted"
                          } ${isLiveUser ? "opacity-70 italic" : ""}`}
                      >
                        <p className="text-sm">{message.content}</p>
                        {isStreamingAI && (
                          <span className="inline-flex gap-0.5 items-center ml-1">
                            <span className="w-1 h-1 rounded-full bg-foreground/40 animate-bounce [animation-delay:0ms]" />
                            <span className="w-1 h-1 rounded-full bg-foreground/40 animate-bounce [animation-delay:150ms]" />
                            <span className="w-1 h-1 rounded-full bg-foreground/40 animate-bounce [animation-delay:300ms]" />
                          </span>
                        )}
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
