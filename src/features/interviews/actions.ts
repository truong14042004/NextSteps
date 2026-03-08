"use server"

import { getCurrentUser } from "@/services/clerk/lib/getCurrentUser"
import { db } from "@/drizzle/db"
import { and, eq } from "drizzle-orm"
import { InterviewTable, JobInfoTable } from "@/drizzle/schema"
import { insertInterview, updateInterview as updateInterviewDb, getInterviewsByJobInfoId } from "./db"
import { canCreateInterview } from "./permissions"
import { PLAN_LIMIT_MESSAGE, RATE_LIMIT_MESSAGE } from "@/lib/errorToast"
import { env } from "@/data/env/server"
import arcjet, { tokenBucket, request } from "@arcjet/next"
import { generateAiInterviewFeedback } from "@/services/ai/interviews"

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

  return { error: false }
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
