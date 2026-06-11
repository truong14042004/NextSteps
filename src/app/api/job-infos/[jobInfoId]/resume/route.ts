import { and, eq } from "drizzle-orm"
import { db } from "@/drizzle/db"
import { JobInfoTable } from "@/drizzle/schema"
import { googleCloudStorageBucket } from "@/lib/google-cloud-storage"
import { getCurrentUser } from "@/services/clerk/lib/getCurrentUser"

function extractStoragePath(resumeUrl: string) {
  const marker = "/uploads/"
  const markerIndex = resumeUrl.indexOf(marker)

  if (markerIndex === -1) {
    return resumeUrl
  }

  return resumeUrl.slice(markerIndex + 1)
}

function getFileNameFromPath(path: string) {
  const segments = path.split("/")
  const last = segments[segments.length - 1]
  return last && last.trim() !== "" ? last : "resume.pdf"
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ jobInfoId: string }> },
) {
  const { userId } = await getCurrentUser()

  if (userId == null) {
    return new Response("You are not logged in", { status: 401 })
  }

  const { jobInfoId } = await params

  const jobInfo = await db.query.JobInfoTable.findFirst({
    where: and(eq(JobInfoTable.id, jobInfoId), eq(JobInfoTable.userId, userId)),
    columns: { resumeUrl: true },
  })

  if (!jobInfo?.resumeUrl) {
    return new Response("Resume not found", { status: 404 })
  }

  const storagePath = extractStoragePath(jobInfo.resumeUrl)
  const file = googleCloudStorageBucket.file(storagePath)

  try {
    // Tải file phía server và stream về client (same-origin proxy).
    // Không dùng redirect sang signed URL của GCS vì trình duyệt sẽ chặn
    // việc đọc body bằng fetch().blob() do bucket không bật CORS, khiến
    // tính năng "Phân tích lại" im lặng thất bại.
    const [metadata] = await file.getMetadata()
    const [contents] = await file.download()
    const contentType =
      typeof metadata.contentType === "string" && metadata.contentType !== ""
        ? metadata.contentType
        : "application/pdf"
    const fileName = getFileNameFromPath(storagePath)

    return new Response(new Uint8Array(contents), {
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": `inline; filename="${fileName}"`,
        "Cache-Control": "private, no-store",
      },
    })
  } catch (error) {
    console.error("Failed to load resume from storage:", error)
    return new Response("Resume not found", { status: 404 })
  }
}
