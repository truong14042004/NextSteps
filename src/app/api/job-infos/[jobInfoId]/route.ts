import { NextResponse } from "next/server"
import { db } from "@/drizzle/db"
import { JobInfoTable } from "@/drizzle/schema"
import { and, eq } from "drizzle-orm"
import { getCurrentUser } from "@/services/clerk/lib/getCurrentUser"

export async function GET(
  request: Request,
  { params }: { params: Promise<{ jobInfoId: string }> }
) {
  const { userId } = await getCurrentUser()
  if (userId == null) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
  }

  const { jobInfoId } = await params
  const jobInfo = await db.query.JobInfoTable.findFirst({
    where: and(eq(JobInfoTable.id, jobInfoId), eq(JobInfoTable.userId, userId)),
  })

  if (!jobInfo) {
    return NextResponse.json({ message: "Not found" }, { status: 404 })
  }

  return NextResponse.json(jobInfo)
}
