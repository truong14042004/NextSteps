import { BackLink } from "@/components/BackLink"
import { db } from "@/drizzle/db"
import { InterviewTable } from "@/drizzle/schema"
import { getInterviewIdTag } from "@/features/interviews/dbCache"
import { getJobInfoIdTag } from "@/features/jobInfos/dbCache"
import { getCurrentUser } from "@/services/clerk/lib/getCurrentUser"
import { eq } from "drizzle-orm"
import { cacheTag } from "next/dist/server/use-cache/cache-tag"
import { notFound } from "next/navigation"
import { fetchChatMessages } from "@/services/hume/lib/api"
import { condenseChatMessages } from "@/services/hume/lib/condenseChatMessages"
import { generateInterviewFeedback } from "@/features/interviews/actions"
import { InterviewResultsView } from "./_InterviewResultsView"

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

  // Fallback: If feedback has not been generated yet, generate it now
  if (interview.feedback == null) {
    const res = await generateInterviewFeedback(interview.id)
    if (!res.error && res.feedback) {
      interview.feedback = res.feedback
    }
  }

  // Parse transcript messages
  let transcriptMessages: Array<{ role: "assistant" | "user"; content: string }> = []
  
  if (interview.humeChatId == null && interview.vapiTranscript != null) {
    try {
      transcriptMessages = JSON.parse(interview.vapiTranscript)
    } catch (e) {
      console.error("Failed to parse Vapi transcript", e)
    }
  } else if (interview.humeChatId != null) {
    try {
      const humeMessages = await fetchChatMessages(interview.humeChatId)
      const condensed = condenseChatMessages(humeMessages)
      transcriptMessages = condensed.map(msg => ({
        role: msg.isUser ? "user" : "assistant",
        content: msg.content.join(" ")
      }))
    } catch (e) {
      console.error("Failed to fetch hume messages", e)
    }
  }

  return (
    <InterviewResultsView
      interview={interview}
      user={user}
      transcriptMessages={transcriptMessages}
    />
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
          name: true,
          analysisResult: true,
        },
      },
    },
  })

  if (interview == null) return null

  cacheTag(getJobInfoIdTag(interview.jobInfo.id))
  if (interview.jobInfo.userId !== userId) return null

  return interview
}
