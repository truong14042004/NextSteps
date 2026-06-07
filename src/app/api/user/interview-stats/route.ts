import { NextResponse } from "next/server"
import { db } from "@/drizzle/db"
import { InterviewTable, JobInfoTable } from "@/drizzle/schema"
import { and, desc, eq, isNotNull } from "drizzle-orm"
import { getCurrentUser } from "@/services/clerk/lib/getCurrentUser"
import { getDashboardStats } from "@/features/dashboard/data"

function extractScoreFromFeedback(feedback: string | null): number | null {
  if (!feedback) return null
  const regexes = [
    /(?:Overall Rating|Đánh giá chung|Điểm tổng quan|Rating|Điểm số|Điểm tổng thể|Đánh giá tổng quan)[\s\S]*?(\d+(?:\.\d+)?)\s*\/\s*10/i,
    /(\d+(?:\.\d+)?)\s*\/\s*10/i,
  ]
  for (const regex of regexes) {
    const match = feedback.match(regex)
    if (match) {
      const val = parseFloat(match[1])
      if (!isNaN(val) && val <= 10) {
        return val
      }
    }
  }
  return null
}

function extractPacingFromFeedback(feedback: string | null): number | null {
  if (!feedback) return null
  const regex = /(?:Pacing and Timing|Pacing & Timing|Pacing|Tốc độ|Phản xạ|Nhịp độ|Pacing và tốc độ)[\s\S]*?(\d+(?:\.\d+)?)\s*\/\s*10/i
  const match = feedback.match(regex)
  if (match) {
    const val = parseFloat(match[1])
    if (!isNaN(val) && val <= 10) {
      return val
    }
  }
  return null
}

export async function GET() {
  const { userId } = await getCurrentUser()
  if (userId == null) {
    return NextResponse.json({ message: "You are not logged in" }, { status: 401 })
  }

  // Get streak and count from dashboard stats
  let streakDays = 0
  try {
    const stats = await getDashboardStats(userId)
    streakDays = stats.streakDays
  } catch (error) {
    console.error("Error fetching dashboard stats:", error)
  }

  // Fetch the latest interview with feedback
  let latestScore: number | null = null
  let pacingScore: number | null = null

  try {
    const rows = await db
      .select({
        feedback: InterviewTable.feedback,
      })
      .from(InterviewTable)
      .innerJoin(JobInfoTable, eq(JobInfoTable.id, InterviewTable.jobInfoId))
      .where(
        and(
          eq(JobInfoTable.userId, userId),
          isNotNull(InterviewTable.feedback)
        )
      )
      .orderBy(desc(InterviewTable.createdAt))
      .limit(1)

    if (rows.length > 0 && rows[0].feedback) {
      latestScore = extractScoreFromFeedback(rows[0].feedback)
      pacingScore = extractPacingFromFeedback(rows[0].feedback)
    }
  } catch (error) {
    console.error("Error fetching latest interview feedback:", error)
  }

  return NextResponse.json({
    streakDays,
    latestScore: latestScore != null ? Math.round(latestScore * 10) : null, // out of 100
    pacingScore: pacingScore != null ? Math.round(pacingScore * 10) : null, // out of 100
  })
}
