"use server"

import { getCurrentUser } from "@/services/clerk/lib/getCurrentUser"
import { db } from "@/drizzle/db"
import { and, eq } from "drizzle-orm"
import { InterviewTable, JobInfoTable } from "@/drizzle/schema"
import { insertInterview, updateInterview as updateInterviewDb, getInterviewsByJobInfoId } from "./db"
import { canCreateInterview } from "./permissions"
import { recordFeatureUsage } from "@/features/plans/entitlements"
import { PLAN_LIMIT_MESSAGE, RATE_LIMIT_MESSAGE } from "@/lib/errorToast"
import { env } from "@/data/env/server"
import arcjet, { tokenBucket, request } from "@arcjet/next"
import { generateAiInterviewFeedback } from "@/services/ai/interviews"
import { fetchChatMessages } from "@/services/hume/lib/api"
import { condenseChatMessages } from "@/services/hume/lib/condenseChatMessages"

const aj = arcjet({
  characteristics: ["userId"],
  key: env.ARCJET_KEY,
  rules: [
    tokenBucket({
      capacity: 12,
      refillRate: 4,
      interval: "1d",
      mode: "LIVE",
    }),
  ],
})

export async function createInterview({
  jobInfoId,
}: {
  jobInfoId: string
}): Promise<{ error: true; message: string } | { error: false; id: string }> {
  const { userId } = await getCurrentUser()
  if (userId == null) {
    return {
      error: true,
      message: "You don't have permission to do this",
    }
  }

  if (!(await canCreateInterview())) {
    return {
      error: true,
      message: PLAN_LIMIT_MESSAGE,
    }
  }

  // Skip rate limiting in development
  if (process.env.NODE_ENV !== "development") {
    const decision = await aj.protect(await request(), {
      userId,
      requested: 1,
    })

    if (decision.isDenied()) {
      return {
        error: true,
        message: RATE_LIMIT_MESSAGE,
      }
    }
  }

  const jobInfo = await findJobInfoForUser(jobInfoId, userId)
  if (jobInfo == null) {
    return {
      error: true,
      message: "You don't have permission to do this",
    }
  }

  const interview = await insertInterview({ jobInfoId, duration: "00:00:00" })
  await recordFeatureUsage("mock_interview")

  return { error: false, id: interview.id }
}

export async function updateInterview(
  id: string,
  data: {
    humeChatId?: string
    vapiTranscript?: string
    duration?: string
  }
) {
  const { userId } = await getCurrentUser()
  if (userId == null) {
    return {
      error: true,
      message: "You don't have permission to do this",
    }
  }

  const interview = await findInterviewForUser(id, userId)
  if (interview == null) {
    return {
      error: true,
      message: "You don't have permission to do this",
    }
  }

  await updateInterviewDb(id, data)

  return { error: false }
}

// Lấy transcript CHUẨN của cuộc gọi trực tiếp từ API Vapi (Vapi tự ghép đúng
// từng lượt nói) và lưu đè vào bản ghi phỏng vấn. Đáng tin cậy hơn việc tự
// ghép từ sự kiện streaming phía client. Có retry vì Vapi cần một nhịp để
// hoàn tất transcript sau khi call kết thúc.
export async function syncVapiTranscript(interviewId: string, callId: string) {
  const { userId } = await getCurrentUser()
  if (userId == null) {
    return { error: true as const, message: "You don't have permission to do this" }
  }

  const interview = await findInterviewForUser(interviewId, userId)
  if (interview == null) {
    return { error: true as const, message: "You don't have permission to do this" }
  }

  const apiKey = env.VAPI_PRIVATE_KEY
  if (!apiKey || callId.trim() === "") {
    return { error: true as const, message: "Vapi chưa được cấu hình" }
  }

  type VapiRawMessage = { role?: string; content?: string; message?: string }

  // Số message của bản client đã lưu trước đó (finalizeCall lưu bản client
  // append-only — đầy đủ từng câu hỏi/câu trả lời như hiển thị lúc phỏng vấn).
  // Dùng làm mốc để KHÔNG đè bằng bản Vapi ngắn hơn.
  const clientTranscriptLength = (() => {
    if (interview.vapiTranscript == null) return 0
    try {
      const parsed = JSON.parse(interview.vapiTranscript)
      return Array.isArray(parsed) ? parsed.length : 0
    } catch {
      return 0
    }
  })()

  for (let attempt = 0; attempt < 4; attempt += 1) {
    try {
      const res = await fetch(`https://api.vapi.ai/call/${callId}`, {
        headers: { Authorization: `Bearer ${apiKey}` },
        cache: "no-store",
      })

      if (res.ok) {
        const call = (await res.json()) as {
          messages?: VapiRawMessage[]
          artifact?: { messages?: VapiRawMessage[] }
        }

        const raw = call.artifact?.messages ?? call.messages ?? []
        const transcript = raw
          .filter(
            m =>
              m?.role === "user" || m?.role === "bot" || m?.role === "assistant",
          )
          .map(m => ({
            role: m.role === "user" ? ("user" as const) : ("assistant" as const),
            content: String(m.message ?? m.content ?? "").trim(),
          }))
          .filter(m => m.content !== "")

        // Chỉ đè khi bản Vapi KHÔNG ngắn hơn bản client. Vapi đôi khi chỉ trả
        // lời chào + 1 lượt user (gộp), làm mất các câu hỏi AI vốn đã hiển thị
        // đúng lúc phỏng vấn. No-shrink guard giữ bản client trong trường hợp đó.
        if (transcript.length > 0 && transcript.length >= clientTranscriptLength) {
          await updateInterviewDb(interviewId, {
            vapiTranscript: JSON.stringify(transcript),
          })
          return { error: false as const }
        }

        // Bản Vapi ngắn hơn bản client → coi như đã xong, giữ nguyên bản client.
        if (transcript.length > 0) {
          return { error: false as const }
        }
      }
    } catch (e) {
      console.error("syncVapiTranscript attempt failed:", e)
    }

    await new Promise(resolve => setTimeout(resolve, 1500))
  }

  return { error: true as const, message: "Transcript chưa sẵn sàng" }
}

export async function generateInterviewFeedback(interviewId: string) {
  const { userId, user } = await getCurrentUser({ allData: true })
  if (userId == null || user == null) {
    return {
      error: true,
      message: "You don't have permission to do this",
    }
  }

  const interview = await findInterviewForUser(interviewId, userId)
  if (interview == null) {
    return {
      error: true,
      message: "You don't have permission to do this",
    }
  }

  if (interview.humeChatId == null && interview.vapiTranscript == null) {
    return {
      error: true,
      message: "Interview has not been completed yet",
    }
  }

  let feedback: string | null = null
  try {
    feedback = await generateAiInterviewFeedback({
      humeChatId: interview.humeChatId,
      vapiTranscript: interview.vapiTranscript,
      jobInfo: interview.jobInfo,
      userName: user.name,
    })
  } catch (e) {
    console.error("Failed to generate feedback:", e)
    return {
      error: true,
      message: "Không thể tạo đánh giá. Vui lòng thử lại sau.",
    }
  }

  if (feedback == null) {
    return {
      error: true,
      message: "Failed to generate feedback",
    }
  }

  await updateInterviewDb(interviewId, { feedback })

  return { error: false, feedback }
}

async function findJobInfoForUser(id: string, userId: string) {
  return db.query.JobInfoTable.findFirst({
    where: and(eq(JobInfoTable.id, id), eq(JobInfoTable.userId, userId)),
  })
}

async function findInterviewForUser(id: string, userId: string) {
  const interview = await db.query.InterviewTable.findFirst({
    where: eq(InterviewTable.id, id),
    with: {
      jobInfo: {
        columns: {
          id: true,
          userId: true,
          description: true,
          title: true,
          experienceLevel: true,
        },
      },
    },
  })

  if (interview == null) return null
  if (interview.jobInfo.userId !== userId) return null

  return interview
}

export async function getInterviewsForJobInfo(jobInfoId: string) {
  const { userId } = await getCurrentUser()
  if (userId == null) return []

  // Verify the jobInfo belongs to this user
  const jobInfo = await db.query.JobInfoTable.findFirst({
    where: and(eq(JobInfoTable.id, jobInfoId), eq(JobInfoTable.userId, userId)),
    columns: { id: true },
  })
  if (jobInfo == null) return []

  return getInterviewsByJobInfoId(jobInfoId)
}

export async function getHumeMessagesAction(humeChatId: string) {
  const { userId } = await getCurrentUser()
  if (userId == null) return []
  try {
    const messages = await fetchChatMessages(humeChatId)
    const condensed = condenseChatMessages(messages)
    return condensed
  } catch (e) {
    console.error("Failed to fetch hume chat messages in server action:", e)
    return []
  }
}
