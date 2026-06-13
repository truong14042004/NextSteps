import { getGlobalTag, getIdTag, getJobInfoTag } from "@/lib/dataCache"
import { revalidateTag } from "next/cache"

export function getQuizGlobalTag() {
  return getGlobalTag("quizzes")
}

export function getQuizJobInfoTag(jobInfoId: string) {
  return getJobInfoTag("quizzes", jobInfoId)
}

export function getQuizIdTag(id: string) {
  return getIdTag("quizzes", id)
}

export function getQuizAttemptIdTag(id: string) {
  return getIdTag("quizAttempts", id)
}

export function revalidateQuizCache({
  id,
  jobInfoId,
}: {
  id: string
  jobInfoId: string
}) {
  revalidateTag(getQuizGlobalTag(), "default")
  revalidateTag(getQuizJobInfoTag(jobInfoId), "default")
  revalidateTag(getQuizIdTag(id), "default")
}

export function revalidateQuizAttemptCache({
  attemptId,
  quizId,
  jobInfoId,
}: {
  attemptId: string
  quizId: string
  jobInfoId: string
}) {
  revalidateTag(getQuizAttemptIdTag(attemptId), "default")
  revalidateTag(getQuizIdTag(quizId), "default")
  revalidateTag(getQuizJobInfoTag(jobInfoId), "default")
  revalidateTag(getQuizGlobalTag(), "default")
}
