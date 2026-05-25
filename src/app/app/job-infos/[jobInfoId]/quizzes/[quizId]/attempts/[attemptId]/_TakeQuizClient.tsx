"use client"

import { MarkdownRenderer } from "@/components/MarkdownRenderer"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { LoadingSwap } from "@/components/ui/loading-swap"
import { formatDurationSeconds } from "@/features/quizzes/formatters"
import { cn } from "@/lib/utils"
import { errorToast } from "@/lib/errorToast"
import { useRouter } from "next/navigation"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"

type ClientQuestion = {
  id: string
  order: number
  text: string
  options: string[]
}

export function TakeQuizClient({
  attemptId,
  quizId,
  jobInfoId,
  expiresAt,
  questions,
}: {
  attemptId: string
  quizId: string
  jobInfoId: string
  expiresAt: string
  questions: ClientQuestion[]
}) {
  const router = useRouter()
  const expiresAtMs = useMemo(() => new Date(expiresAt).getTime(), [expiresAt])
  const [remaining, setRemaining] = useState(() =>
    Math.max(0, Math.floor((expiresAtMs - Date.now()) / 1000))
  )
  const [answers, setAnswers] = useState<Record<string, number | null>>(() =>
    Object.fromEntries(questions.map(q => [q.id, null]))
  )
  const [submitting, setSubmitting] = useState(false)
  const submittedRef = useRef(false)

  const submit = useCallback(
    async (isAuto: boolean) => {
      if (submittedRef.current) return
      submittedRef.current = true
      setSubmitting(true)
      try {
        const payload = {
          answers: questions.map(q => ({
            questionId: q.id,
            selectedIndex: answers[q.id] ?? null,
          })),
        }
        const res = await fetch(
          `/api/quizzes/attempts/${attemptId}/submit`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          }
        )
        if (!res.ok && res.status !== 409) {
          const data = await res.json().catch(() => ({}))
          errorToast(data.error ?? "Không thể nộp bài")
          submittedRef.current = false
          return
        }
        if (isAuto) {
          // server tự thấy expired; hiển thị toast nhẹ
        }
        router.refresh()
      } finally {
        setSubmitting(false)
      }
    },
    [answers, attemptId, questions, router]
  )

  useEffect(() => {
    const timer = setInterval(() => {
      const sec = Math.max(0, Math.floor((expiresAtMs - Date.now()) / 1000))
      setRemaining(sec)
      if (sec <= 0 && !submittedRef.current) {
        void submit(true)
      }
    }, 1000)
    return () => clearInterval(timer)
  }, [expiresAtMs, submit])

  const answeredCount = useMemo(
    () => Object.values(answers).filter(v => v != null).length,
    [answers]
  )

  return (
    <div className="space-y-4">
      <div
        className={cn(
          "sticky top-0 z-10 bg-background/90 backdrop-blur border rounded-lg p-3 flex items-center justify-between gap-3 flex-wrap",
          remaining < 60 && "border-destructive text-destructive"
        )}
      >
        <div className="text-sm">
          Đã trả lời: <strong>{answeredCount}</strong>/{questions.length}
        </div>
        <div className="font-mono text-xl">
          {formatDurationSeconds(remaining)}
        </div>
        <Button
          onClick={() => submit(false)}
          disabled={submitting}
          variant="default"
        >
          <LoadingSwap isLoading={submitting}>Nộp bài</LoadingSwap>
        </Button>
      </div>

      <ol className="space-y-3 list-none">
        {questions.map(q => (
          <li key={q.id}>
            <Card>
              <CardContent className="p-4 space-y-3">
                <div className="flex items-baseline gap-2">
                  <span className="text-sm text-muted-foreground font-mono">
                    Câu {q.order + 1}
                  </span>
                </div>
                <MarkdownRenderer>{q.text}</MarkdownRenderer>
                <div className="grid grid-cols-1 gap-2">
                  {q.options.map((opt, idx) => {
                    const selected = answers[q.id] === idx
                    return (
                      <label
                        key={idx}
                        className={cn(
                          "border rounded-md p-3 cursor-pointer text-sm flex items-start gap-2 transition",
                          selected
                            ? "border-primary bg-primary/5"
                            : "hover:border-muted-foreground/40"
                        )}
                      >
                        <input
                          type="radio"
                          name={`q-${q.id}`}
                          checked={selected}
                          onChange={() =>
                            setAnswers(prev => ({ ...prev, [q.id]: idx }))
                          }
                          className="mt-1"
                        />
                        <span>
                          <strong className="mr-1">
                            {String.fromCharCode(65 + idx)}.
                          </strong>
                          {opt}
                        </span>
                      </label>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          </li>
        ))}
      </ol>

      <div className="flex justify-end">
        <Button onClick={() => submit(false)} disabled={submitting}>
          <LoadingSwap isLoading={submitting}>Nộp bài</LoadingSwap>
        </Button>
      </div>
    </div>
  )
}
