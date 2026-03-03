"use client"

import { useEffect, useState, Suspense } from "react"
import { VoiceProvider } from "@humeai/voice-react"
import { InterviewJobInfo } from "./page"
import { Loader2Icon, AlertTriangleIcon } from "lucide-react"
import { VoiceInterviewCall } from "./_VoiceInterviewCall"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

export function VoiceInterviewProvider({ jobInfo }: { jobInfo: InterviewJobInfo }) {
  const [accessToken, setAccessToken] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // Fetch Hume access token from API
    fetch("/api/hume/token")
      .then(res => {
        if (!res.ok) throw new Error("Failed to fetch access token")
        return res.json()
      })
      .then(data => {
        if (data.accessToken) {
          console.log("✅ Hume access token fetched successfully")
          setAccessToken(data.accessToken)
        } else {
          console.error("❌ No access token in response:", data)
          setError("Voice interview feature is not configured")
        }
      })
      .catch(err => {
        console.error("❌ Failed to fetch Hume token:", err)
        setError("Failed to initialize voice interview")
      })
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="h-screen-header flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2Icon className="animate-spin size-12 mx-auto" />
          <p className="text-muted-foreground">Đang khởi tạo phỏng vấn...</p>
        </div>
      </div>
    )
  }

  if (error || !accessToken) {
    return (
      <div className="container max-w-2xl py-12">
        <Alert variant="destructive">
          <AlertTriangleIcon className="size-4" />
          <AlertTitle>Không thể bắt đầu phỏng vấn</AlertTitle>
          <AlertDescription>
            {error || "Voice interview feature requires Hume AI configuration."}
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <VoiceProvider>
      <Suspense
        fallback={
          <div className="h-screen-header flex items-center justify-center">
            <Loader2Icon className="animate-spin size-12" />
          </div>
        }
      >
        <VoiceInterviewCall jobInfo={jobInfo} accessToken={accessToken} />
      </Suspense>
    </VoiceProvider>
  )
}
