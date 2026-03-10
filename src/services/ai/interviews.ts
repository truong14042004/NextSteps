import { JobInfoTable } from "@/drizzle/schema"
import { fetchChatMessages } from "../hume/lib/api"
import { generateText } from "ai"
import { google } from "./models/google"
import { buildInterviewFeedbackSystemPrompt } from "./interviewFeedbackPrompt.mjs"

export async function generateAiInterviewFeedback({
  humeChatId,
  vapiTranscript,
  jobInfo,
  userName,
}: {
  humeChatId?: string | null
  vapiTranscript?: string | null
  jobInfo: Pick<
    typeof JobInfoTable.$inferSelect,
    "title" | "description" | "experienceLevel"
  >
  userName: string
}) {
  let formattedMessages: { speaker: string; text: string; emotionFeatures?: unknown }[]

  if (vapiTranscript != null) {
    // Vapi transcript: already an array of {role, content}
    const raw: Array<{ role: string; content: string }> = JSON.parse(vapiTranscript)
    formattedMessages = raw
      .filter(m => m.role === "assistant" || m.role === "user")
      .map(m => ({
        speaker: m.role === "user" ? "interviewee" : "interviewer",
        text: m.content,
      }))
  } else if (humeChatId != null) {
    const messages = await fetchChatMessages(humeChatId)
    formattedMessages = messages
      .map(message => {
        if (message.type !== "USER_MESSAGE" && message.type !== "AGENT_MESSAGE") {
          return null
        }
        if (message.messageText == null) return null

        return {
          speaker:
            message.type === "USER_MESSAGE" ? "interviewee" : "interviewer",
          text: message.messageText,
          emotionFeatures:
            message.role === "USER" ? message.emotionFeatures : undefined,
        }
      })
      .filter(f => f != null)
  } else {
    return null
  }

  const { text } = await generateText({
    model: google("gemini-2.5-flash"),
    prompt: JSON.stringify(formattedMessages),
    maxSteps: 10,
    experimental_continueSteps: true,
    system: buildInterviewFeedbackSystemPrompt({ userName, jobInfo }),
  })

  return text
}
