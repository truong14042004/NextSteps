import { db } from "@/drizzle/db"
import { InterviewTable } from "@/drizzle/schema"
import { getInterviewIdTag } from "@/features/interviews/dbCache"
import { getJobInfoIdTag } from "@/features/jobInfos/dbCache"
import { getCurrentUser } from "@/services/clerk/lib/getCurrentUser"
import { eq } from "drizzle-orm"
import { cacheTag } from "next/dist/server/use-cache/cache-tag"
import { notFound } from "next/navigation"
import { condenseChatMessages } from "@/services/hume/lib/condenseChatMessages"
import { fetchChatMessages } from "@/services/hume/lib/api"
import { InterviewWorkspace } from "./InterviewWorkspace"

export default async function InterviewResultsPage({
  params,
}: {
  params: Promise<{ interviewId: string }>
}) {
  const { interviewId } = await params
  const { userId, user } = await getCurrentUser({ allData: true })

  // Middleware already protects this route
  if (userId == null || user == null) {
    return notFound()
  }

  const interview = await getInterview(interviewId, userId)
  if (interview == null) {
    return notFound()
  }

  // Pre-fetch and normalize messages on server side
  let messages: Array<{ isUser: boolean; content: string[] }> = []

  if (interview.humeChatId == null && interview.vapiTranscript != null) {
    try {
      const vapiMessages: Array<{ role: "assistant" | "user"; content: string }> = JSON.parse(interview.vapiTranscript)
      messages = vapiMessages.map(msg => ({
        isUser: msg.role === "user",
        content: [msg.content]
      }))
    } catch (e) {
      console.error("Failed to parse vapiTranscript:", e)
    }
  } else if (interview.humeChatId != null) {
    try {
      const rawMessages = await fetchChatMessages(interview.humeChatId)
      messages = condenseChatMessages(rawMessages)
    } catch (e) {
      console.error("Failed to fetch hume messages:", e)
    }
  }

  return (
    <div className="container max-w-6xl mx-auto px-4 py-6">
      <InterviewWorkspace 
        interview={interview}
        user={user}
        messages={messages}
      />
    </div>
  )
}

async function getInterview(id: string, userId: string) {
  "use cache"
  cacheTag(getInterviewIdTag(id))

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

  cacheTag(getJobInfoIdTag(interview.jobInfo.id))
  if (interview.jobInfo.userId !== userId) return null

  return interview
}
