"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { LoadingSwap } from "@/components/ui/loading-swap"
import { errorToast } from "@/lib/errorToast"
import { useRouter } from "next/navigation"
import { useState } from "react"

export function NewQuizClient({
  jobInfoId,
  jobInfoName,
  remaining,
}: {
  jobInfoId: string
  jobInfoName: string
  remaining: number | null
}) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function generate() {
    setLoading(true)
    try {
      const res = await fetch("/api/ai/quizzes/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobInfoId }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        errorToast(data.error ?? "Không thể tạo quiz")
        return
      }
      const { quizId } = await res.json()
      router.push(`/app/job-infos/${jobInfoId}/quizzes/${quizId}`)
    } catch (e) {
      errorToast(e instanceof Error ? e.message : "Lỗi không xác định")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Tạo bộ đề mới cho "{jobInfoName}"</CardTitle>
        <CardDescription>
          AI sẽ sinh 30 câu trắc nghiệm dựa trên job description, mỗi câu 4 đáp
          án. Thời gian làm bài: 45 phút. Bạn được làm tối đa 5 lượt trên mỗi
          bộ đề.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {remaining != null && (
          <p className="text-sm text-muted-foreground">
            Còn lại: <strong>{remaining}</strong> lượt làm quiz trong kỳ này.
          </p>
        )}
        <Button onClick={generate} disabled={loading}>
          <LoadingSwap isLoading={loading}>Sinh 30 câu hỏi</LoadingSwap>
        </Button>
        {loading && (
          <p className="text-xs text-muted-foreground">
            AI đang sinh đề, mất khoảng 15-40 giây…
          </p>
        )}
      </CardContent>
    </Card>
  )
}
