import { db } from "@/drizzle/db"
import { InterviewTable } from "@/drizzle/schema"
import { revalidateInterviewCache } from "./dbCache"
import { desc, eq } from "drizzle-orm"

export async function insertInterview(
  interview: typeof InterviewTable.$inferInsert
) {
  const [newInterview] = await db
    .insert(InterviewTable)
    .values(interview)
    .returning({ id: InterviewTable.id, jobInfoId: InterviewTable.jobInfoId })

  revalidateInterviewCache(newInterview)

  return newInterview
}

export async function updateInterview(
  id: string,
  interview: Partial<typeof InterviewTable.$inferInsert>
) {
  const [newInterview] = await db
    .update(InterviewTable)
    .set(interview)
    .where(eq(InterviewTable.id, id))
    .returning({ id: InterviewTable.id, jobInfoId: InterviewTable.jobInfoId })

  revalidateInterviewCache(newInterview)

  return newInterview
}

export async function getInterviewsByJobInfoId(jobInfoId: string) {
  return db.query.InterviewTable.findMany({
    where: eq(InterviewTable.jobInfoId, jobInfoId),
    orderBy: desc(InterviewTable.createdAt),
    columns: {
      id: true,
      duration: true,
      feedback: true,
      createdAt: true,
      vapiTranscript: true,
      humeChatId: true,
    },
  })
}
