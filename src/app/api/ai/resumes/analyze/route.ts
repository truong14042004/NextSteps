import { canRunResumeAnalysis } from "@/features/resumeAnalyses/permissions"
import { PLAN_LIMIT_MESSAGE } from "@/lib/errorToast"
import { analyzeResumeForJob } from "@/services/ai/resumes/ai"
import { getCurrentUser } from "@/services/clerk/lib/getCurrentUser"
import { ExperienceLevel } from "@/drizzle/schema"
import { db } from "@/drizzle/db"
import { JobInfoTable } from "@/drizzle/schema"
import { and, eq } from "drizzle-orm"

export async function POST(req: Request) {
  const { userId } = await getCurrentUser()

  if (userId == null) {
    return new Response("You are not logged in", { status: 401 })
  }

  const formData = await req.formData()
  const resumeFile = formData.get("resumeFile") as File
  const jobInfoId = formData.get("jobInfoId") as string | null

  let jobTitle = formData.get("jobTitle") as string
  let experienceLevel = formData.get("experienceLevel") as ExperienceLevel
  let description = formData.get("description") as string

  // If job details not provided but jobInfoId is, look up from DB
  if ((!jobTitle || !experienceLevel || !description) && jobInfoId) {
    const jobInfo = await db.query.JobInfoTable.findFirst({
      where: and(eq(JobInfoTable.id, jobInfoId), eq(JobInfoTable.userId, userId)),
      columns: { title: true, experienceLevel: true, description: true },
    })
    if (jobInfo) {
      jobTitle = jobTitle || jobInfo.title || ""
      experienceLevel = experienceLevel || jobInfo.experienceLevel
      description = description || jobInfo.description
    }
  }

  if (!resumeFile || !jobTitle || !experienceLevel || !description) {
    return new Response("Invalid request - missing required fields", { status: 400 })
  }

  if (resumeFile.size > 10 * 1024 * 1024) {
    return new Response("File size exceeds 10MB limit", { status: 400 })
  }

  const allowedTypes = [
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "text/plain",
  ]

  if (!allowedTypes.includes(resumeFile.type)) {
    return new Response("Please upload a PDF, Word document, or text file", {
      status: 400,
    })
  }

  if (!(await canRunResumeAnalysis())) {
    return new Response(PLAN_LIMIT_MESSAGE, { status: 403 })
  }

  const saveResult = jobInfoId
    ? async (result: { object: unknown }) => {
        try {
          await db
            .update(JobInfoTable)
            .set({ analysisResult: JSON.stringify(result.object) })
            .where(and(eq(JobInfoTable.id, jobInfoId), eq(JobInfoTable.userId, userId)))
        } catch (e) {
          console.error("Failed to save analysis result:", e)
        }
      }
    : undefined

  const res = await analyzeResumeForJob({
    resumeFile,
    jobInfo: { title: jobTitle, experienceLevel, description },
    onFinish: saveResult,
  })

  return res.toTextStreamResponse()
}

