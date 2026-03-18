"use server"

import z from "zod"
import { jobInfoSchema } from "./schemas"
import { getCurrentUser } from "@/services/clerk/lib/getCurrentUser"
import { insertJobInfo, updateJobInfo as updateJobInfoDb } from "./db"
import { redirect } from "next/navigation"
import { db } from "@/drizzle/db"
import { and, eq } from "drizzle-orm"
import { JobInfoTable, type ExperienceLevel } from "@/drizzle/schema"
import { cacheTag } from "next/dist/server/use-cache/cache-tag"
import { getJobInfoIdTag } from "./dbCache"

export async function createJobInfo(unsafeData: z.infer<typeof jobInfoSchema>) {
  const { userId } = await getCurrentUser()
  if (userId == null) {
    return {
      error: true,
      message: "You don't have permission to do this",
    }
  }

  const { success, data } = jobInfoSchema.safeParse(unsafeData)
  if (!success) {
    return {
      error: true,
      message: "Invalid job data",
    }
  }

  const jobInfo = await insertJobInfo({ ...data, userId })

  redirect(`/app/job-infos/${jobInfo.id}`)
}

export async function updateJobInfo(
  id: string,
  unsafeData: z.infer<typeof jobInfoSchema>
) {
  const { userId } = await getCurrentUser()
  if (userId == null) {
    return {
      error: true,
      message: "You don't have permission to do this",
    }
  }

  const { success, data } = jobInfoSchema.safeParse(unsafeData)
  if (!success) {
    return {
      error: true,
      message: "Invalid job data",
    }
  }

  const existingJobInfo = await getJobInfo(id, userId)
  if (existingJobInfo == null) {
    return {
      error: true,
      message: "You don't have permission to do this",
    }
  }

  const jobInfo = await updateJobInfoDb(id, data)

  redirect(`/app/job-infos/${jobInfo.id}`)
}

export async function createQuickInterview(data: {
  candidateName: string
  jobTitle: string
  experienceLevel: ExperienceLevel
  jobDescription: string
}): Promise<
  | { error: true; message: string }
  | {
      error: false
      jobInfo: {
        id: string
        title: string
        name: string
        experienceLevel: string
        description: string
      }
    }
> {
  const { userId } = await getCurrentUser()
  if (userId == null) {
    return {
      error: true,
      message: "You must be logged in",
    }
  }

  try {
    const jobInfo = await insertJobInfo({
      name: data.candidateName,
      title: data.jobTitle,
      experienceLevel: data.experienceLevel,
      description: data.jobDescription,
      userId,
    })

    return {
      error: false,
      jobInfo: {
        id: jobInfo.id,
        title: data.jobTitle,
        name: data.candidateName,
        experienceLevel: data.experienceLevel,
        description: data.jobDescription,
      },
    }
  } catch (error) {
    console.error("Failed to create quick interview:", error)
    return {
      error: true,
      message: "Failed to create interview",
    }
  }
}

export async function getUserJobInfos(limit = 10) {
  const { userId } = await getCurrentUser()
  if (userId == null) {
    return []
  }

  return db.query.JobInfoTable.findMany({
    where: eq(JobInfoTable.userId, userId),
    orderBy: (table, { desc }) => [desc(table.createdAt)],
    limit,
    columns: {
      id: true,
      title: true,
      name: true,
      experienceLevel: true,
      description: true,
      createdAt: true,
      analysisResult: true,
    },
  })
}

export async function getUserJobInfosBasic(limit = 10) {
  const { userId } = await getCurrentUser()
  if (userId == null) {
    return []
  }

  return db.query.JobInfoTable.findMany({
    where: eq(JobInfoTable.userId, userId),
    orderBy: (table, { desc }) => [desc(table.createdAt)],
    limit,
    columns: {
      id: true,
      title: true,
      name: true,
      experienceLevel: true,
      description: true,
      createdAt: true,
    },
  })
}

export async function createJobInfoForAnalysis(data: {
  candidateName: string
  jobTitle: string
  experienceLevel: ExperienceLevel
  jobDescription: string
}): Promise<{ error: true; message: string } | { error: false; id: string }> {
  const { userId } = await getCurrentUser()
  if (userId == null) {
    return { error: true, message: "You must be logged in" }
  }

  try {
    const jobInfo = await insertJobInfo({
      name: data.candidateName,
      title: data.jobTitle,
      experienceLevel: data.experienceLevel,
      description: data.jobDescription,
      userId,
    })
    return { error: false, id: jobInfo.id }
  } catch (error) {
    console.error("Failed to create job info:", error)
    return { error: true, message: "Failed to create analysis" }
  }
}

export async function saveAnalysisResult(
  id: string,
  analysisResult: string
) {
  const { userId } = await getCurrentUser()
  if (userId == null) return

  await updateJobInfoDb(id, { analysisResult })
}

async function getJobInfo(id: string, userId: string) {
  "use cache"
  cacheTag(getJobInfoIdTag(id))

  return db.query.JobInfoTable.findFirst({
    where: and(eq(JobInfoTable.id, id), eq(JobInfoTable.userId, userId)),
  })
}

export async function updateJobInfoDirect(
  id: string,
  data: {
    title?: string
    experienceLevel: ExperienceLevel
    description: string
  }
): Promise<{ error: true; message: string } | { error: false }> {
  const { userId } = await getCurrentUser()
  if (userId == null) {
    return { error: true, message: "You don't have permission to do this" }
  }

  const existing = await getJobInfo(id, userId)
  if (existing == null) {
    return { error: true, message: "You don't have permission to do this" }
  }

  await updateJobInfoDb(id, {
    title: data.title,
    experienceLevel: data.experienceLevel,
    description: data.description,
  })

  return { error: false }
}
