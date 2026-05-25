import "server-only"

import { db } from "@/drizzle/db"
import {
  InterviewTable,
  JobInfoTable,
  QuizAttemptTable,
  QuizTable,
} from "@/drizzle/schema"
import { and, desc, eq, gte, sql } from "drizzle-orm"

export type ActivityKind = "quiz_attempt" | "interview" | "job_analysis"

export type ActivityItem = {
  kind: ActivityKind
  jobInfoId: string
  jobName: string
  occurredAt: Date
  refId: string
  detail: string | null
}

export type JobSummary = {
  id: string
  name: string
  title: string | null
  quizCount: number
  interviewCount: number
  bestQuizScore: number | null
  bestQuizTotal: number | null
  lastActivityAt: Date
}

export async function getJobSummaries(userId: string): Promise<JobSummary[]> {
  const jobs = await db
    .select({
      id: JobInfoTable.id,
      name: JobInfoTable.name,
      title: JobInfoTable.title,
      updatedAt: JobInfoTable.updatedAt,
      quizCount: sql<number>`(
        select count(*)::int from ${QuizTable}
        where ${QuizTable.jobInfoId} = ${JobInfoTable.id}
      )`,
      interviewCount: sql<number>`(
        select count(*)::int from ${InterviewTable}
        where ${InterviewTable.jobInfoId} = ${JobInfoTable.id}
      )`,
      bestQuizScore: sql<number | null>`(
        select max(${QuizAttemptTable.score})::int from ${QuizAttemptTable}
        inner join ${QuizTable} on ${QuizTable.id} = ${QuizAttemptTable.quizId}
        where ${QuizTable.jobInfoId} = ${JobInfoTable.id}
          and ${QuizAttemptTable.status} = 'submitted'
      )`,
      bestQuizTotal: sql<number | null>`(
        select max(${QuizTable.totalQuestions})::int from ${QuizTable}
        where ${QuizTable.jobInfoId} = ${JobInfoTable.id}
      )`,
    })
    .from(JobInfoTable)
    .where(eq(JobInfoTable.userId, userId))
    .orderBy(desc(JobInfoTable.updatedAt))

  return jobs.map(j => ({
    id: j.id,
    name: j.name,
    title: j.title,
    quizCount: j.quizCount,
    interviewCount: j.interviewCount,
    bestQuizScore: j.bestQuizScore,
    bestQuizTotal: j.bestQuizTotal,
    lastActivityAt: j.updatedAt,
  }))
}

export async function getRecentActivities(
  userId: string,
  limit = 10
): Promise<ActivityItem[]> {
  const attempts = await db
    .select({
      id: QuizAttemptTable.id,
      occurredAt: QuizAttemptTable.submittedAt,
      score: QuizAttemptTable.score,
      status: QuizAttemptTable.status,
      jobInfoId: JobInfoTable.id,
      jobName: JobInfoTable.name,
      quizTitle: QuizTable.title,
      totalQuestions: QuizTable.totalQuestions,
    })
    .from(QuizAttemptTable)
    .innerJoin(QuizTable, eq(QuizTable.id, QuizAttemptTable.quizId))
    .innerJoin(JobInfoTable, eq(JobInfoTable.id, QuizTable.jobInfoId))
    .where(
      and(
        eq(QuizAttemptTable.userId, userId),
        sql`${QuizAttemptTable.submittedAt} is not null`
      )
    )
    .orderBy(desc(QuizAttemptTable.submittedAt))
    .limit(limit)

  const interviews = await db
    .select({
      id: InterviewTable.id,
      occurredAt: InterviewTable.createdAt,
      duration: InterviewTable.duration,
      jobInfoId: JobInfoTable.id,
      jobName: JobInfoTable.name,
    })
    .from(InterviewTable)
    .innerJoin(JobInfoTable, eq(JobInfoTable.id, InterviewTable.jobInfoId))
    .where(eq(JobInfoTable.userId, userId))
    .orderBy(desc(InterviewTable.createdAt))
    .limit(limit)

  const analyses = await db
    .select({
      id: JobInfoTable.id,
      occurredAt: JobInfoTable.updatedAt,
      jobName: JobInfoTable.name,
      hasAnalysis: JobInfoTable.analysisResult,
    })
    .from(JobInfoTable)
    .where(
      and(
        eq(JobInfoTable.userId, userId),
        sql`${JobInfoTable.analysisResult} is not null`
      )
    )
    .orderBy(desc(JobInfoTable.updatedAt))
    .limit(limit)

  const items: ActivityItem[] = [
    ...attempts.map(
      (a): ActivityItem => ({
        kind: "quiz_attempt",
        jobInfoId: a.jobInfoId,
        jobName: a.jobName,
        occurredAt: a.occurredAt ?? new Date(),
        refId: a.id,
        detail:
          a.score != null
            ? `${a.score}/${a.totalQuestions} điểm` +
              (a.status === "expired" ? " (hết giờ)" : "")
            : null,
      })
    ),
    ...interviews.map(
      (i): ActivityItem => ({
        kind: "interview",
        jobInfoId: i.jobInfoId,
        jobName: i.jobName,
        occurredAt: i.occurredAt,
        refId: i.id,
        detail: i.duration ? `${i.duration}` : null,
      })
    ),
    ...analyses.map(
      (j): ActivityItem => ({
        kind: "job_analysis",
        jobInfoId: j.id,
        jobName: j.jobName,
        occurredAt: j.occurredAt,
        refId: j.id,
        detail: "Phân tích CV / JD",
      })
    ),
  ]
    .sort((a, b) => b.occurredAt.getTime() - a.occurredAt.getTime())
    .slice(0, limit)

  return items
}

export type ScorePoint = {
  date: string
  score: number
  total: number
  percent: number
}

export async function getQuizScoreHistory(
  userId: string,
  days = 30
): Promise<ScorePoint[]> {
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000)

  const rows = await db
    .select({
      submittedAt: QuizAttemptTable.submittedAt,
      score: QuizAttemptTable.score,
      total: QuizTable.totalQuestions,
    })
    .from(QuizAttemptTable)
    .innerJoin(QuizTable, eq(QuizTable.id, QuizAttemptTable.quizId))
    .where(
      and(
        eq(QuizAttemptTable.userId, userId),
        gte(QuizAttemptTable.submittedAt, since),
        sql`${QuizAttemptTable.score} is not null`
      )
    )
    .orderBy(QuizAttemptTable.submittedAt)

  return rows
    .filter(r => r.submittedAt != null && r.score != null)
    .map(r => ({
      date: r.submittedAt!.toLocaleDateString("vi-VN", {
        day: "2-digit",
        month: "2-digit",
      }),
      score: r.score!,
      total: r.total,
      percent: Math.round((r.score! / r.total) * 100),
    }))
}

export type DashboardStats = {
  totalQuizAttempts: number
  totalInterviews: number
  totalAnalyses: number
  averageQuizPercent: number | null
  bestQuizPercent: number | null
  perfectScoreCount: number
  streakDays: number
  activeDaysLast30: number
}

export async function getDashboardStats(
  userId: string
): Promise<DashboardStats> {
  const since30 = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)

  const [
    quizAggRow,
    interviewRow,
    analysisRow,
    quizDatesRows,
    interviewDatesRows,
    analysisDatesRows,
  ] = await Promise.all([
    db
      .select({
        attempts: sql<number>`count(*)::int`,
        avgPercent: sql<
          number | null
        >`avg(${QuizAttemptTable.score}::float / nullif(${QuizTable.totalQuestions}, 0) * 100)`,
        maxPercent: sql<
          number | null
        >`max(${QuizAttemptTable.score}::float / nullif(${QuizTable.totalQuestions}, 0) * 100)`,
        perfects: sql<number>`sum(case when ${QuizAttemptTable.score} = ${QuizTable.totalQuestions} then 1 else 0 end)::int`,
      })
      .from(QuizAttemptTable)
      .innerJoin(QuizTable, eq(QuizTable.id, QuizAttemptTable.quizId))
      .where(
        and(
          eq(QuizAttemptTable.userId, userId),
          sql`${QuizAttemptTable.score} is not null`
        )
      ),
    db
      .select({ total: sql<number>`count(*)::int` })
      .from(InterviewTable)
      .innerJoin(JobInfoTable, eq(JobInfoTable.id, InterviewTable.jobInfoId))
      .where(eq(JobInfoTable.userId, userId)),
    db
      .select({ total: sql<number>`count(*)::int` })
      .from(JobInfoTable)
      .where(
        and(
          eq(JobInfoTable.userId, userId),
          sql`${JobInfoTable.analysisResult} is not null`
        )
      ),
    db
      .select({ d: QuizAttemptTable.submittedAt })
      .from(QuizAttemptTable)
      .where(
        and(
          eq(QuizAttemptTable.userId, userId),
          sql`${QuizAttemptTable.submittedAt} is not null`,
          gte(QuizAttemptTable.submittedAt, since30)
        )
      ),
    db
      .select({ d: InterviewTable.createdAt })
      .from(InterviewTable)
      .innerJoin(JobInfoTable, eq(JobInfoTable.id, InterviewTable.jobInfoId))
      .where(
        and(
          eq(JobInfoTable.userId, userId),
          gte(InterviewTable.createdAt, since30)
        )
      ),
    db
      .select({ d: JobInfoTable.updatedAt })
      .from(JobInfoTable)
      .where(
        and(
          eq(JobInfoTable.userId, userId),
          sql`${JobInfoTable.analysisResult} is not null`,
          gte(JobInfoTable.updatedAt, since30)
        )
      ),
  ])

  const quizAgg = quizAggRow[0]
  const totalInterviews = interviewRow[0]?.total ?? 0
  const totalAnalyses = analysisRow[0]?.total ?? 0

  const activeDates: Date[] = [
    ...quizDatesRows.map(r => r.d).filter((d): d is Date => d != null),
    ...interviewDatesRows.map(r => r.d),
    ...analysisDatesRows.map(r => r.d),
  ]

  const uniqueDayKeys = new Set(
    activeDates.map(d => {
      const day = new Date(d)
      day.setHours(0, 0, 0, 0)
      return day.getTime()
    })
  )

  const streakDays = computeStreak(uniqueDayKeys)

  return {
    totalQuizAttempts: quizAgg?.attempts ?? 0,
    totalInterviews,
    totalAnalyses,
    averageQuizPercent:
      quizAgg?.avgPercent != null ? Math.round(Number(quizAgg.avgPercent)) : null,
    bestQuizPercent:
      quizAgg?.maxPercent != null ? Math.round(Number(quizAgg.maxPercent)) : null,
    perfectScoreCount: quizAgg?.perfects ?? 0,
    streakDays,
    activeDaysLast30: uniqueDayKeys.size,
  }
}

function computeStreak(dayKeys: Set<number>): number {
  if (dayKeys.size === 0) return 0

  let streak = 0
  const cursor = new Date()
  cursor.setHours(0, 0, 0, 0)

  if (!dayKeys.has(cursor.getTime())) {
    cursor.setDate(cursor.getDate() - 1)
    if (!dayKeys.has(cursor.getTime())) return 0
  }

  while (dayKeys.has(cursor.getTime())) {
    streak += 1
    cursor.setDate(cursor.getDate() - 1)
  }

  return streak
}
