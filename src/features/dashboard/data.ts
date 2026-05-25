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
  const [
    quizAggRow,
    interviewRow,
    analysisRow,
    activityDaysRow,
  ] = await Promise.all([
    db
      .select({
        attempts: sql<number>`count(*)::int`,
        avgPercent: sql<number | null>`avg(${QuizAttemptTable.score}::float / nullif(${QuizTable.totalQuestions}, 0) * 100)`,
        maxPercent: sql<number | null>`max(${QuizAttemptTable.score}::float / nullif(${QuizTable.totalQuestions}, 0) * 100)`,
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
      .select({
        days: sql<string[]>`array_agg(distinct date_trunc('day', occurred_at) order by date_trunc('day', occurred_at) desc)`,
      })
      .from(
        sql`(
          select ${QuizAttemptTable.submittedAt} as occurred_at
          from ${QuizAttemptTable}
          where ${QuizAttemptTable.userId} = ${userId}
            and ${QuizAttemptTable.submittedAt} is not null
            and ${QuizAttemptTable.submittedAt} >= now() - interval '30 days'
          union all
          select ${InterviewTable.createdAt}
          from ${InterviewTable}
          inner join ${JobInfoTable} on ${JobInfoTable.id} = ${InterviewTable.jobInfoId}
          where ${JobInfoTable.userId} = ${userId}
            and ${InterviewTable.createdAt} >= now() - interval '30 days'
          union all
          select ${JobInfoTable.updatedAt}
          from ${JobInfoTable}
          where ${JobInfoTable.userId} = ${userId}
            and ${JobInfoTable.analysisResult} is not null
            and ${JobInfoTable.updatedAt} >= now() - interval '30 days'
        ) as activity`
      ),
  ])

  const quizAgg = quizAggRow[0]
  const totalInterviews = interviewRow[0]?.total ?? 0
  const totalAnalyses = analysisRow[0]?.total ?? 0

  const activeDates: Date[] = (activityDaysRow[0]?.days ?? [])
    .filter(Boolean)
    .map(d => new Date(d))

  const streakDays = computeStreak(activeDates)

  return {
    totalQuizAttempts: quizAgg?.attempts ?? 0,
    totalInterviews,
    totalAnalyses,
    averageQuizPercent:
      quizAgg?.avgPercent != null ? Math.round(quizAgg.avgPercent) : null,
    bestQuizPercent:
      quizAgg?.maxPercent != null ? Math.round(quizAgg.maxPercent) : null,
    perfectScoreCount: quizAgg?.perfects ?? 0,
    streakDays,
    activeDaysLast30: activeDates.length,
  }
}

function computeStreak(activeDatesDesc: Date[]): number {
  if (activeDatesDesc.length === 0) return 0

  const dayKeys = new Set(
    activeDatesDesc.map(d => {
      const day = new Date(d)
      day.setHours(0, 0, 0, 0)
      return day.getTime()
    })
  )

  let streak = 0
  const cursor = new Date()
  cursor.setHours(0, 0, 0, 0)

  // grace: if today has no activity yet, allow streak to start from yesterday
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
