import { BackLink } from "@/components/BackLink"
import { Skeleton, SkeletonButton } from "@/components/Skeleton"
import { SuspendedItem } from "@/components/SuspendedItem"
import { Button } from "@/components/ui/button"
import { db } from "@/drizzle/db"
import { InterviewTable } from "@/drizzle/schema"
import { getInterviewIdTag } from "@/features/interviews/dbCache"
import { getJobInfoIdTag } from "@/features/jobInfos/dbCache"
import { formatDateTime } from "@/lib/formatters"
import { getCurrentUser } from "@/services/clerk/lib/getCurrentUser"
import { eq } from "drizzle-orm"
import { cacheTag } from "next/dist/server/use-cache/cache-tag"
import { notFound } from "next/navigation"
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog"
import { MarkdownRenderer } from "@/components/MarkdownRenderer"
import { Loader2Icon } from "lucide-react"
import { Suspense } from "react"
import { CondensedMessages } from "@/services/hume/components/CondensedMessages"
import { condenseChatMessages } from "@/services/hume/lib/condenseChatMessages"
import { fetchChatMessages } from "@/services/hume/lib/api"
import { ActionButton } from "@/components/ui/action-button"
import { generateInterviewFeedback } from "@/features/interviews/actions"

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

  return (
    <div className="container my-4 space-y-4">
      <BackLink href="/app/interview">
        Quay lại Phỏng vấn AI
      </BackLink>
      <div className="space-y-6">
        <div className="flex gap-2 justify-between items-start">
          <div className="space-y-2 mb-6">
            <h1 className="text-3xl md:text-4xl">
              Kết quả phỏng vấn
            </h1>
            <div className="space-y-1 text-muted-foreground">
              <p><strong>Vị trí:</strong> {interview.jobInfo.title || "N/A"}</p>
              <p><strong>Thời gian:</strong> {formatDateTime(interview.createdAt)}</p>
              <p><strong>Thời lượng:</strong> {interview.duration}</p>
            </div>
          </div>
          <div>
            {interview.feedback == null ? (
              <ActionButton
                action={generateInterviewFeedback.bind(null, interview.id)}
              >
                Tạo đánh giá AI
              </ActionButton>
            ) : (
              <Dialog>
                <DialogTrigger asChild>
                  <Button>Xem đánh giá</Button>
                </DialogTrigger>
                <DialogContent className="md:max-w-3xl lg:max-w-4xl max-h-[calc(100%-2rem)] overflow-y-auto flex flex-col">
                  <DialogTitle>Đánh giá phỏng vấn của AI</DialogTitle>
                  <MarkdownRenderer>{interview.feedback}</MarkdownRenderer>
                </DialogContent>
              </Dialog>
            )}
          </div>
        </div>
        <Suspense
          fallback={<Loader2Icon className="animate-spin size-24 mx-auto" />}
        >
          <Messages interview={interview} user={user} />
        </Suspense>
      </div>
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

async function Messages({
  interview,
  user,
}: {
  interview: Awaited<ReturnType<typeof getInterview>>
  user: { name: string; imageUrl: string }
}) {
  if (interview == null) return null

  // Vapi interview - transcript stored in DB
  if (interview.humeChatId == null && interview.vapiTranscript != null) {
    const vapiMessages: Array<{ role: "assistant" | "user"; content: string }> = JSON.parse(interview.vapiTranscript)
    return (
      <div className="space-y-4">
        <h2 className="text-2xl font-semibold">Nội dung phỏng vấn</h2>
        <div className="space-y-4">
          {vapiMessages.map((msg, i) => (
            <div
              key={i}
              className={`flex items-start gap-3 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
              {msg.role === "assistant" && (
                <div className="size-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <span className="text-sm">🤖</span>
                </div>
              )}
              <div
                className={`px-4 py-3 rounded-lg max-w-[80%] ${
                  msg.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted"
                }`}
              >
                <p className="text-sm">{msg.content}</p>
              </div>
              {msg.role === "user" && (
                <div className="size-8 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                  <span className="text-sm">👤</span>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    )
  }

  // Hume interview - fetch from Hume API
  if (interview.humeChatId == null) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">
          Không có dữ liệu cuộc phỏng vấn
        </p>
      </div>
    )
  }

  const messages = await fetchChatMessages(interview.humeChatId)
  const condensedMessages = condenseChatMessages(messages)

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-semibold">Nội dung phỏng vấn</h2>
      <CondensedMessages messages={condensedMessages} user={user} />
    </div>
  )
}
