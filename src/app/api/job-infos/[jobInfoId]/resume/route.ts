import { NextResponse } from "next/server"
import { and, eq } from "drizzle-orm"
import { db } from "@/drizzle/db"
import { JobInfoTable } from "@/drizzle/schema"
import { createGoogleCloudStorageReadUrl } from "@/lib/google-cloud-storage"
import { getCurrentUser } from "@/services/clerk/lib/getCurrentUser"

function extractStoragePath(resumeUrl: string) {
  const marker = "/uploads/"
  const markerIndex = resumeUrl.indexOf(marker)

  if (markerIndex === -1) {
    return resumeUrl
  }

  return resumeUrl.slice(markerIndex + 1)
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

  const signedUrl = await createGoogleCloudStorageReadUrl(
    extractStoragePath(jobInfo.resumeUrl),
  )

  return NextResponse.redirect(signedUrl)
}
