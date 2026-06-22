import { eq } from "drizzle-orm"

import { db } from "@/drizzle/db"
import { JobApplicationTable } from "@/drizzle/schema"
import { googleCloudStorageBucket } from "@/lib/google-cloud-storage"
import { getCurrentUser } from "@/services/clerk/lib/getCurrentUser"

function extractStoragePath(cvUrl: string) {
  const marker = "/uploads/"
  const markerIndex = cvUrl.indexOf(marker)

  if (markerIndex === -1) {
    return cvUrl
  }

  return cvUrl.slice(markerIndex + 1)
}

function getFileNameFromPath(path: string) {
  const segments = path.split("/")
  const last = segments[segments.length - 1]
  return last && last.trim() !== "" ? last : "cv.pdf"
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ applicationId: string }> },
) {
  const { userId, user } = await getCurrentUser({ allData: true })

  if (userId == null || user == null) {
    return new Response("You are not logged in", { status: 401 })
  }

  if (user.role !== "recruiter" && user.role !== "admin") {
    return new Response("Forbidden", { status: 403 })
  }

  const { applicationId } = await params

  const application = await db.query.JobApplicationTable.findFirst({
    where: eq(JobApplicationTable.id, applicationId),
    columns: { cvUrl: true, cvFileName: true, postId: true },
    with: {
      post: { columns: { authorId: true } },
    },
  })

  if (application == null || !application.cvUrl) {
    return new Response("CV not found", { status: 404 })
  }

  // Recruiter chỉ xem được CV của ứng viên nộp vào bài do chính họ đăng.
  // Admin được toàn quyền.
  if (user.role !== "admin" && application.post?.authorId !== userId) {
    return new Response("Forbidden", { status: 403 })
  }

  const storagePath = extractStoragePath(application.cvUrl)
  const file = googleCloudStorageBucket.file(storagePath)

  try {
    // Tải file phía server và stream về client (same-origin proxy).
    // Bucket không bật public/CORS nên link storage.googleapis.com trực tiếp
    // sẽ trả 403 cho iframe và link tải — phải proxy như tính năng "Phân tích lại".
    const [metadata] = await file.getMetadata()
    const [contents] = await file.download()
    const contentType =
      typeof metadata.contentType === "string" && metadata.contentType !== ""
        ? metadata.contentType
        : "application/pdf"
    const fileName =
      application.cvFileName?.trim() || getFileNameFromPath(storagePath)

    const wantsDownload =
      new URL(request.url).searchParams.get("download") === "1"
    const disposition = wantsDownload ? "attachment" : "inline"

    return new Response(new Uint8Array(contents), {
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": `${disposition}; filename="${encodeURIComponent(fileName)}"`,
        "Cache-Control": "private, no-store",
      },
    })
  } catch (error) {
    console.error("Failed to load applicant CV from storage:", error)
    return new Response("CV not found", { status: 404 })
  }
}
