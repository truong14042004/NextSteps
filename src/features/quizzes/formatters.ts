import { QuizAttemptStatus } from "@/drizzle/schema"

export function formatQuizAttemptStatus(status: QuizAttemptStatus) {
  switch (status) {
    case "in_progress":
      return "Đang làm"
    case "submitted":
      return "Đã nộp"
    case "expired":
      return "Hết giờ"
    default:
      throw new Error(`Unknown status: ${status satisfies never}`)
  }
}

export function formatDurationSeconds(totalSeconds: number) {
  const seconds = Math.max(0, Math.floor(totalSeconds))
  const minutes = Math.floor(seconds / 60)
  const remaining = seconds % 60
  return `${String(minutes).padStart(2, "0")}:${String(remaining).padStart(
    2,
    "0"
  )}`
}
