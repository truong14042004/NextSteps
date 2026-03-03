"use client"

import { Button } from "@/components/ui/button"
import { env } from "@/data/env/client"
import { createInterview, updateInterview } from "@/features/interviews/actions"
import { errorToast } from "@/lib/errorToast"
import { CondensedMessages } from "@/services/hume/components/CondensedMessages"
import { condenseChatMessages } from "@/services/hume/lib/condenseChatMessages"
import { useVoice, VoiceReadyState } from "@humeai/voice-react"
import { Loader2Icon, MicIcon, MicOffIcon, PhoneOffIcon, ArrowLeftIcon } from "lucide-react"
import { useRouter } from "next/navigation"
import { useEffect, useMemo, useRef, useState } from "react"
import { InterviewJobInfo } from "./page"
import { toast } from "sonner"

export function VoiceInterviewCall({
  jobInfo,
  accessToken,
}: {
  accessToken: string
  jobInfo: InterviewJobInfo
}) {
  const { connect, disconnect, readyState, chatMetadata, callDurationTimestamp, isMuted, unmute, mute, error } =
    useVoice()
  const [interviewId, setInterviewId] = useState<string | null>(null)
  const [connectionAttempted, setConnectionAttempted] = useState(false)
  const durationRef = useRef(callDurationTimestamp)
  const router = useRouter()
  durationRef.current = callDurationTimestamp

  // Log ready state changes
  useEffect(() => {
    const stateNames: Record<number, string> = {
      0: "IDLE",
      1: "CONNECTING",
      2: "OPEN",
      3: "CLOSED"
    }
    console.log("🔄 Voice state changed:", stateNames[readyState as number] || readyState)
    
    // Log error if exists
    if (error) {
      console.error("❌ Hume Voice Error:", error)
    }
  }, [readyState, error])

  // Handle connection failure
  useEffect(() => {
    if (connectionAttempted && readyState === VoiceReadyState.CLOSED && !chatMetadata?.chatId) {
      console.error("❌ Connection failed immediately after attempt")
      console.log("📋 Debug Info:")
      console.log("  - Config ID:", env.NEXT_PUBLIC_HUME_CONFIG_ID)
      console.log("  - Has access token:", !!accessToken)
      console.log("  - Access token length:", accessToken.length)
      console.log("  - Error object:", error)
      
      toast.error("Không thể kết nối với AI. Vui lòng kiểm tra cấu hình Hume.")
      setConnectionAttempted(false)
    }
  }, [readyState, connectionAttempted, chatMetadata?.chatId, error, accessToken])

  // Sync chat ID
  useEffect(() => {
    if (chatMetadata?.chatId == null || interviewId == null) {
      return
    }
    updateInterview(interviewId, { humeChatId: chatMetadata.chatId })
  }, [chatMetadata?.chatId, interviewId])

  // Sync duration
  useEffect(() => {
    if (interviewId == null) return
    const intervalId = setInterval(() => {
      if (durationRef.current == null) return

      updateInterview(interviewId, { duration: durationRef.current })
    }, 10000)

    return () => clearInterval(intervalId)
  }, [interviewId])

  // Handle disconnect
  useEffect(() => {
    if (readyState !== VoiceReadyState.CLOSED) return
    if (interviewId == null) {
      return router.push(`/app/interview`)
    }

    // Update final duration
    if (durationRef.current != null) {
      updateInterview(interviewId, { duration: durationRef.current })
    }

    // Check if interview actually happened (duration > 00:00:00)
    const duration = durationRef.current || "00:00:00"
    const hasActualInterview = duration !== "00:00:00" && chatMetadata?.chatId != null

    if (hasActualInterview) {
      // Go to results page if interview was conducted
      router.push(`/app/interview/${interviewId}`)
    } else {
      // Go back to interview selection if no interview happened
      toast.info("Phỏng vấn chưa được bắt đầu. Vui lòng thử lại.")
      router.push(`/app/interview`)
    }
  }, [interviewId, readyState, router, chatMetadata?.chatId])

  if (readyState === VoiceReadyState.IDLE) {
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
            onClick={() => router.push("/app/interview")}
          >
            <ArrowLeftIcon className="size-4 mr-2" />
            Quay lại
          </Button>
          <Button
            size="lg"
            onClick={async () => {
              console.log("🎤 Starting interview...")
              console.log("Config ID:", env.NEXT_PUBLIC_HUME_CONFIG_ID)
              console.log("Job Info:", jobInfo)
              
              const res = await createInterview({ jobInfoId: jobInfo.id })
              if (res.error) {
                console.error("❌ Failed to create interview:", res.message)
                return errorToast(res.message)
              }
              
              console.log("✅ Interview created, ID:", res.id)
              setInterviewId(res.id)

              console.log("🔌 Connecting to Hume...")
              console.log("📋 Connection Details:")
              console.log("  - Config ID:", env.NEXT_PUBLIC_HUME_CONFIG_ID)
              console.log("  - Access Token (first 20 chars):", accessToken.substring(0, 20) + "...")
              console.log("  - Session Variables:", {
                userName: jobInfo.name,
                title: jobInfo.title,
                experienceLevel: jobInfo.experienceLevel,
              })
              
              setConnectionAttempted(true)
              
              try {
                await connect({
                  auth: { type: "accessToken", value: accessToken },
                  configId: env.NEXT_PUBLIC_HUME_CONFIG_ID,
                  sessionSettings: {
                    type: "session_settings",
                    variables: {
                      userName: jobInfo.name,
                      title: jobInfo.title || "Not Specified",
                      description: jobInfo.description,
                      experienceLevel: jobInfo.experienceLevel,
                    },
                  },
                })
                console.log("✅ Connect function called successfully")
              } catch (err) {
                console.error("❌ Connect function threw error:", err)
                errorToast("Lỗi kết nối: " + (err instanceof Error ? err.message : String(err)))
                setConnectionAttempted(false)
              }
            }}
          >
            <MicIcon className="size-4 mr-2" />
            Bắt đầu phỏng vấn
          </Button>
        </div>
      </div>
    )
  }

  if (readyState === VoiceReadyState.CONNECTING) {
    return <ConnectionScreen />
  }

  if (readyState === VoiceReadyState.OPEN) {
    return (
      <ActiveCallScreen
        isMuted={isMuted}
        onMuteToggle={isMuted ? unmute : mute}
        onDisconnect={disconnect}
        jobInfo={jobInfo}
      />
    )
  }

  return null
}

function ConnectionScreen() {
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

function ActiveCallScreen({
  isMuted,
  onMuteToggle,
  onDisconnect,
  jobInfo,
}: {
  isMuted: boolean
  onMuteToggle: () => void
  onDisconnect: () => void
  jobInfo: InterviewJobInfo
}) {
  const { messages, fft } = useVoice()
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const condensedMessages = useMemo(() => {
    return condenseChatMessages(messages)
  }, [messages])

  // Auto scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [condensedMessages])

  // Calculate question number (count assistant messages)
  const questionCount = condensedMessages.filter(m => !m.isUser).length
  const currentQuestion = questionCount > 0 ? questionCount : 1
  const totalQuestions = 5 // You can adjust this based on your config

  // Get the latest AI message
  const latestAiMessage = condensedMessages.length > 0 
    ? condensedMessages.filter(m => !m.isUser).at(-1)
    : null

  return (
    <div className="h-screen-header flex flex-col">
      {/* Header */}
      <div className="border-b bg-background">
        <div className="container max-w-3xl py-4">
          <div className="flex items-center gap-3">
            <div className="size-12 rounded-full bg-primary/10 flex items-center justify-center">
              <span className="text-2xl">🤖</span>
            </div>
            <div>
              <h2 className="font-semibold">AI Interviewer</h2>
              <p className="text-sm text-muted-foreground">
                Câu hỏi {currentQuestion}/{totalQuestions}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Current AI Question - Prominent Display */}
      {latestAiMessage && (
        <div className="border-b bg-primary/5">
          <div className="container max-w-3xl py-6">
            <div className="space-y-2">
              <p className="text-sm font-medium text-primary">
                Câu hỏi hiện tại:
              </p>
              <p className="text-lg leading-relaxed">
                {latestAiMessage.content[latestAiMessage.content.length - 1]}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Messages History */}
      <div className="flex-1 overflow-auto">
        <div className="container max-w-3xl py-6">
          {condensedMessages.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <p>Đang chờ AI bắt đầu cuộc phỏng vấn...</p>
            </div>
          ) : (
            <>
              <p className="text-xs font-medium text-muted-foreground mb-4 uppercase tracking-wide">
                Lịch sử trò chuyện
              </p>
              <CondensedMessages 
                messages={condensedMessages}
                user={{ name: jobInfo.name, imageUrl: "" }}
                maxFft={Math.max(...fft)}
              />
              <div ref={messagesEndRef} />
            </>
          )}
        </div>
      </div>

      {/* Audio Visualizer */}
      <div className="border-t bg-muted/30">
        <div className="container max-w-3xl py-4">
          <div className="flex items-center justify-center gap-1 h-16">
            {fft.map((value, index) => (
              <div
                key={index}
                className="w-1 bg-primary rounded-full transition-all duration-75"
                style={{
                  height: `${Math.max(4, Math.min(64, value * 100))}px`,
                }}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="border-t bg-background">
        <div className="container max-w-3xl py-6">
          <div className="flex items-center justify-center gap-4">
            <Button
              size="lg"
              variant={isMuted ? "default" : "outline"}
              onClick={onMuteToggle}
              className="rounded-full size-14"
            >
              {isMuted ? <MicOffIcon className="size-5" /> : <MicIcon className="size-5" />}
            </Button>
            <Button
              size="lg"
              variant="destructive"
              onClick={onDisconnect}
              className="rounded-full size-14"
            >
              <PhoneOffIcon className="size-5" />
            </Button>
          </div>
          <p className="text-center text-sm text-muted-foreground mt-4">
            {isMuted ? "Microphone is muted" : "Microphone is active"}
          </p>
        </div>
      </div>
    </div>
  )
}
