import "server-only"

import { and, desc, eq, gt, gte, lt, lte, sql } from "drizzle-orm"

import { db } from "@/drizzle/db"
import {
  AdminPlanTable,
  UserSubscriptionTable,
  UserTable,
  UserUsageEventTable,
  type UsageFeature,
} from "@/drizzle/schema"
import { getCurrentUser } from "@/services/clerk/lib/getCurrentUser"

type PlanLimitKey =
  | "resumeAnalysisLimit"
  | "aiQuestionLimit"
  | "mockInterviewLimit"

type ActivePlan = {
  subscriptionId: string | null
  planKey: string
  periodStart: Date
  periodEnd: Date
  limits: Record<PlanLimitKey, number | null>
}

const FEATURE_LIMIT_KEYS: Record<UsageFeature, PlanLimitKey> = {
  resume_analysis: "resumeAnalysisLimit",
  ai_question: "aiQuestionLimit",
  mock_interview: "mockInterviewLimit",
}

const FEATURE_LABELS: Record<UsageFeature, string> = {
  resume_analysis: "lượt phân tích",
  ai_question: "lượt câu hỏi",
  mock_interview: "lượt phỏng vấn",
}

function formatPlanName(planKey: string) {
  if (planKey === "admin") return "Admin"
  if (planKey === "premium") return "Premium"
  if (planKey === "start") return "Start"
  return "Free"
}

function formatResetText(plan: ActivePlan) {
  if (plan.planKey === "admin") return "Không giới hạn"
  return `Làm mới ${plan.periodEnd.toLocaleDateString("vi-VN")}`
}

function addMonths(date: Date, months: number) {
  const next = new Date(date)
  next.setMonth(next.getMonth() + months)
  return next
}

function getMonthPeriod(now: Date) {
  const periodStart = new Date(now)
  periodStart.setDate(1)
  periodStart.setHours(0, 0, 0, 0)

  return {
    periodStart,
    periodEnd: addMonths(periodStart, 1),
  }
}

function getFeatureLimit(plan: ActivePlan, feature: UsageFeature) {
  return plan.limits[FEATURE_LIMIT_KEYS[feature]]
}

async function getFreePlan(now: Date): Promise<ActivePlan> {
  const plan = await db.query.AdminPlanTable.findFirst({
    where: eq(AdminPlanTable.key, "free"),
    columns: {
      key: true,
      resumeAnalysisLimit: true,
      aiQuestionLimit: true,
      mockInterviewLimit: true,
    },
  })
  const period = getMonthPeriod(now)

  return {
    subscriptionId: null,
    planKey: plan?.key ?? "free",
    ...period,
    limits: {
      resumeAnalysisLimit: plan?.resumeAnalysisLimit ?? 0,
      aiQuestionLimit: plan?.aiQuestionLimit ?? 0,
      mockInterviewLimit: plan?.mockInterviewLimit ?? 0,
    },
  }
}

export async function getActivePlanForUser(userId: string, now = new Date()) {
  const user = await db.query.UserTable.findFirst({
    where: eq(UserTable.id, userId),
    columns: { role: true },
  })

  if (user?.role === "admin") {
    const period = getMonthPeriod(now)
    return {
      subscriptionId: null,
      planKey: "admin",
      ...period,
      limits: {
        resumeAnalysisLimit: null,
        aiQuestionLimit: null,
        mockInterviewLimit: null,
      },
    } satisfies ActivePlan
  }

  const subscription = await db.query.UserSubscriptionTable.findFirst({
    where: and(
      eq(UserSubscriptionTable.userId, userId),
      eq(UserSubscriptionTable.status, "active"),
      lte(UserSubscriptionTable.currentPeriodStart, now),
      gt(UserSubscriptionTable.currentPeriodEnd, now)
    ),
    orderBy: [desc(UserSubscriptionTable.currentPeriodEnd)],
    with: {
      plan: {
        columns: {
          key: true,
          resumeAnalysisLimit: true,
          aiQuestionLimit: true,
          mockInterviewLimit: true,
        },
      },
    },
  })

  if (subscription?.plan != null) {
    return {
      subscriptionId: subscription.id,
      planKey: subscription.plan.key,
      periodStart: subscription.currentPeriodStart,
      periodEnd: subscription.currentPeriodEnd,
      limits: {
        resumeAnalysisLimit: subscription.plan.resumeAnalysisLimit,
        aiQuestionLimit: subscription.plan.aiQuestionLimit,
        mockInterviewLimit: subscription.plan.mockInterviewLimit,
      },
    } satisfies ActivePlan
  }

  return getFreePlan(now)
}

export async function canUseFeature(feature: UsageFeature) {
  const { userId } = await getCurrentUser()
  if (userId == null) return false

  const plan = await getActivePlanForUser(userId)
  const limit = getFeatureLimit(plan, feature)
  if (limit == null) return true
  if (limit <= 0) return false

  const [row] = await db
    .select({
      total: sql<number>`coalesce(sum(${UserUsageEventTable.amount}), 0)::int`,
    })
    .from(UserUsageEventTable)
    .where(
      and(
        eq(UserUsageEventTable.userId, userId),
        eq(UserUsageEventTable.feature, feature),
        gte(UserUsageEventTable.createdAt, plan.periodStart),
        lt(UserUsageEventTable.createdAt, plan.periodEnd)
      )
    )

  return Number(row?.total ?? 0) < limit
}

export async function getFeatureUsageSummary(feature: UsageFeature) {
  const { userId } = await getCurrentUser()
  if (userId == null) return null

  const plan = await getActivePlanForUser(userId)
  const limit = getFeatureLimit(plan, feature)
  const [row] = await db
    .select({
      total: sql<number>`coalesce(sum(${UserUsageEventTable.amount}), 0)::int`,
    })
    .from(UserUsageEventTable)
    .where(
      and(
        eq(UserUsageEventTable.userId, userId),
        eq(UserUsageEventTable.feature, feature),
        gte(UserUsageEventTable.createdAt, plan.periodStart),
        lt(UserUsageEventTable.createdAt, plan.periodEnd)
      )
    )

  const used = Number(row?.total ?? 0)

  return {
    feature,
    featureLabel: FEATURE_LABELS[feature],
    used,
    total: limit,
    remaining: limit == null ? null : Math.max(0, limit - used),
    planKey: plan.planKey,
    planName: formatPlanName(plan.planKey),
    billingMode: "subscription" as const,
    resetText: formatResetText(plan),
    periodStart: plan.periodStart.toISOString(),
    periodEnd: plan.periodEnd.toISOString(),
  }
}

export async function recordFeatureUsage(feature: UsageFeature, amount = 1) {
  const { userId } = await getCurrentUser()
  if (userId == null) return

  const plan = await getActivePlanForUser(userId)
  await db.insert(UserUsageEventTable).values({
    userId,
    subscriptionId: plan.subscriptionId,
    feature,
    amount,
  })
}

export async function activateSubscriptionFromPayment({
  userId,
  planId,
  planKey,
  paymentTransactionId,
}: {
  userId: string
  planId: string | null
  planKey: string
  paymentTransactionId: string
}) {
  const now = new Date()
  const active = await db.query.UserSubscriptionTable.findFirst({
    where: and(
      eq(UserSubscriptionTable.userId, userId),
      eq(UserSubscriptionTable.status, "active"),
      lte(UserSubscriptionTable.currentPeriodStart, now),
      gt(UserSubscriptionTable.currentPeriodEnd, now)
    ),
    orderBy: [desc(UserSubscriptionTable.currentPeriodEnd)],
  })

  const samePlan = active?.planKey === planKey
  const currentPeriodStart = samePlan && active != null ? active.currentPeriodEnd : now
  const currentPeriodEnd = addMonths(currentPeriodStart, 1)

  if (active != null && !samePlan) {
    await db
      .update(UserSubscriptionTable)
      .set({ status: "cancelled", currentPeriodEnd: now })
      .where(eq(UserSubscriptionTable.id, active.id))
  }

  await db.insert(UserSubscriptionTable).values({
    userId,
    planId,
    planKey,
    status: "active",
    currentPeriodStart,
    currentPeriodEnd,
    paymentTransactionId,
  })
}
