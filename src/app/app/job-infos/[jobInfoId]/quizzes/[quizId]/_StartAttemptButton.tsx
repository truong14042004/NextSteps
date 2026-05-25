"use client"

import { Button } from "@/components/ui/button"
import { LoadingSwap } from "@/components/ui/loading-swap"
import { errorToast } from "@/lib/errorToast"
import { useRouter } from "next/navigation"
import { useState } from "react"

export function StartAttemptButton({
  jobInfoId,
  quizId,
  inProgressAttemptId,
  disabled,
  reachedMax,
}: {
  jobInfoId: string
  quizId: string
  inProgressAttemptId: string | null
  disabled: boolean
  reachedMax: boolean
}) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  if (inProgressAttemptId != null) {
    return (
      <Button
        onClick={() =>
          router.push(
            `/app/job-infos/${jobInfoId}/quizzes/${quizId}/attempts/${inProgressAttemptId}`
          )
        }
      >
        Tiếp tục lượt đang dở
      </Button>
    )
  }

  async function start() {
    setLoading(true)
    try {
      const res = await fetch(`/api/quizzes/${quizId}/attempts`, {
        method: "POST",
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        errorToast(data.error ?? "Không thể bắt đầu lượt làm")
        return
      }
      const { attemptId } = await res.json()
      router.push(
        `/app/job-infos/${jobInfoId}/quizzes/${quizId}/attempts/${attemptId}`
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button onClick={start} disabled={disabled || loading}>
      <LoadingSwap isLoading={loading}>
        {reachedMax ? "Đã hết lượt làm" : "Bắt đầu làm bài"}
      </LoadingSwap>
    </Button>
  )
}
