import { canRunResumeAnalysis } from "@/features/resumeAnalyses/permissions"
import { recordFeatureUsage } from "@/features/plans/entitlements"
import { PLAN_LIMIT_MESSAGE } from "@/lib/errorToast"
import { analyzeResumeForJob } from "@/services/ai/resumes/ai"
import { getCurrentUser } from "@/services/clerk/lib/getCurrentUser"
import { ExperienceLevel } from "@/drizzle/schema"
import { db } from "@/drizzle/db"
import { JobInfoTable } from "@/drizzle/schema"
import { uploadBufferToGoogleCloudStorage } from "@/lib/google-cloud-storage"
import { and, eq } from "drizzle-orm"

export const runtime = "nodejs"

const RESUME_FILE_EXTENSIONS: Record<string, string> = {
  "application/pdf": "pdf",
  "application/msword": "doc",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "docx",
  "text/plain": "txt",
}

function createResumeStoragePath(params: {
  userId: string
  jobInfoId?: string | null
  file: File
}) {
  const extension = RESUME_FILE_EXTENSIONS[params.file.type] ?? "bin"
  const safeName = params.file.name
    .replace(/\.[^/.]+$/, "")
    .toLowerCase()
    .replace(/[^a-z0-9-_]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48)
  const recordId = params.jobInfoId ?? crypto.randomUUID()

  return `uploads/resumes/${params.userId}/${recordId}/${safeName || "cv"}.${extension}`
}

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

  const allowedTypes = Object.keys(RESUME_FILE_EXTENSIONS)

  if (!allowedTypes.includes(resumeFile.type)) {
    return new Response("Please upload a PDF, Word document, or text file", {
      status: 400,
    })
  }

  let uploadedResumeUrl: string | null = null

  try {
    const uploadedResume = await uploadBufferToGoogleCloudStorage({
      buffer: Buffer.from(await resumeFile.arrayBuffer()),
      contentType: resumeFile.type,
      destination: createResumeStoragePath({ userId, jobInfoId, file: resumeFile }),
      cacheControl: "private, max-age=0, no-store",
    })

    uploadedResumeUrl = uploadedResume.publicUrl
  } catch (error) {
    console.error("Failed to upload resume to Google Cloud Storage:", error)
    return new Response("Failed to upload resume file", { status: 500 })
  }

  if (!(await canRunResumeAnalysis())) {
    return new Response(PLAN_LIMIT_MESSAGE, { status: 403 })
  }

  const handleFinish = async (result: { object: unknown }) => {
    await recordFeatureUsage("resume_analysis")

    if (jobInfoId != null) {
      try {
        await db
          .update(JobInfoTable)
          .set({
            analysisResult: JSON.stringify(result.object),
            resumeUrl: uploadedResumeUrl,
          })
          .where(and(eq(JobInfoTable.id, jobInfoId), eq(JobInfoTable.userId, userId)))
      } catch (e) {
        console.error("Failed to save analysis result:", e)
      }
    }
  }

  const res = await analyzeResumeForJob({
    resumeFile,
    jobInfo: { title: jobTitle, experienceLevel, description },
    onFinish: handleFinish,
  })

  return res.toTextStreamResponse()
}

