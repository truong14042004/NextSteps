import "server-only"

import { and, count, desc, eq, gt, gte, inArray, isNull, lte, sql } from "drizzle-orm"

import { db } from "@/drizzle/db"
import {
  AuthSessionTable,
  InterviewTable,
  JobInfoTable,
  PaymentTransactionTable,
  QuestionTable,
  UserSubscriptionTable,
  UserTable,
} from "@/drizzle/schema"
import { formatPlanPrice, listAdminPlanConfigs } from "./plans"

type RangeDays = 7 | 30 | 90
type GrowthKind = "positive" | "negative" | "stable"

const PLAN_LABELS = ["Free", "Start", "Premium"] as const

function clampRangeDays(value: string | null): RangeDays {
  if (value === "7" || value === "30" || value === "90") {
    return Number(value) as RangeDays
  }

  return 30
}

function getRangeStart(days: number) {
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000)
}

function formatPercentChange(current: number, previous: number) {
  if (previous === 0) return current > 0 ? "+100%" : "0%"
  const value = ((current - previous) / previous) * 100
  const sign = value > 0 ? "+" : ""
  return `${sign}${value.toFixed(1)}%`
}

function formatCurrencyVnd(value: number) {
  return `${value.toLocaleString("vi-VN")}₫`
}

function getGrowthKind(current: number, previous: number): GrowthKind {
  if (current === previous) return "stable"
  return current > previous ? "positive" : "negative"
}

function formatDay(date: Date) {
  return date.toLocaleDateString("en-US", { month: "short", day: "2-digit" })
}

function getInitials(value: string) {
  return value
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map(part => part[0]?.toUpperCase() ?? "")
    .join("")
}

function formatPlanLabel(planKey: string) {
  if (planKey === "premium") return "Premium"
  if (planKey === "start") return "Start"
  if (planKey === "free") return "Free"
  return planKey
}

function buildDailySeries(users: { createdAt: Date }[], rangeDays: RangeDays) {
  const maxPoints = rangeDays === 7 ? 7 : 11
  const step = Math.max(1, Math.floor(rangeDays / maxPoints))
  const points = []

  for (let i = maxPoints - 1; i >= 0; i -= 1) {
    const start = getRangeStart(i * step)
    start.setHours(0, 0, 0, 0)
    const end = new Date(start)
    end.setDate(end.getDate() + step)

    points.push({
      day: formatDay(start).toUpperCase(),
      value: users.filter(user => user.createdAt >= start && user.createdAt < end).length,
    })
  }

  return points
}

async function getCount(
  table:
    | typeof UserTable
    | typeof InterviewTable
    | typeof QuestionTable
    | typeof JobInfoTable
) {
  const [row] = await db.select({ total: count() }).from(table)
  return row?.total ?? 0
}

async function getCountSince(
  table: typeof UserTable | typeof InterviewTable,
  column: typeof UserTable.createdAt | typeof InterviewTable.createdAt,
  since: Date
) {
  const [row] = await db
    .select({ total: count() })
    .from(table)
    .where(gte(column, since))

  return row?.total ?? 0
}

async function getPaidRevenueTotal(since?: Date) {
  const [row] = await db
    .select({
      total: sql<number>`coalesce(sum(${PaymentTransactionTable.amount}), 0)::int`,
    })
    .from(PaymentTransactionTable)
    .where(
      since == null
        ? sql`${PaymentTransactionTable.status} = 'paid'`
        : and(
            sql`${PaymentTransactionTable.status} = 'paid'`,
            gte(PaymentTransactionTable.paidAt, since)
          )
    )

  return Number(row?.total ?? 0)
}

export function parseAdminRange(searchParams: URLSearchParams) {
  return clampRangeDays(searchParams.get("range"))
}

export async function getAdminDashboard(rangeDays: RangeDays) {
  const rangeStart = getRangeStart(rangeDays)
  const previousRangeStart = getRangeStart(rangeDays * 2)

  const [
    activeSessions,
    totalUsers,
    currentRegistrations,
    previousRegistrations,
    totalInterviews,
    currentInterviews,
    previousInterviews,
    usersInRange,
    totalRevenue,
  ] = await Promise.all([
    db
      .select({ total: count() })
      .from(AuthSessionTable)
      .where(
        and(
          isNull(AuthSessionTable.revokedAt),
          gt(AuthSessionTable.expiresAt, new Date())
        )
      ),
    getCount(UserTable),
    getCountSince(UserTable, UserTable.createdAt, rangeStart),
    db
      .select({ total: count() })
      .from(UserTable)
      .where(
        and(
          gte(UserTable.createdAt, previousRangeStart),
          sql`${UserTable.createdAt} < ${rangeStart}`
        )
      ),
    getCount(InterviewTable),
    getCountSince(InterviewTable, InterviewTable.createdAt, rangeStart),
    db
      .select({ total: count() })
      .from(InterviewTable)
      .where(
        and(
          gte(InterviewTable.createdAt, previousRangeStart),
          sql`${InterviewTable.createdAt} < ${rangeStart}`
        )
      ),
    db
      .select({ createdAt: UserTable.createdAt })
      .from(UserTable)
      .where(gte(UserTable.createdAt, rangeStart)),
    getPaidRevenueTotal(),
  ])

  return {
    rangeDays,
    stats: {
      activeUsers: {
        value: String(activeSessions[0]?.total ?? 0),
        growthText: "Live",
        growthKind: "stable" as const,
      },
      totalInterviews: {
        value: totalInterviews.toLocaleString(),
        growthText: formatPercentChange(
          currentInterviews,
          previousInterviews[0]?.total ?? 0
        ),
        growthKind: getGrowthKind(
          currentInterviews,
          previousInterviews[0]?.total ?? 0
        ),
      },
      totalRevenue: {
        value: formatCurrencyVnd(totalRevenue),
        growthText: "Live",
        growthKind: "positive" as const,
      },
      registrations: {
        value: totalUsers.toLocaleString(),
        growthText: formatPercentChange(
          currentRegistrations,
          previousRegistrations[0]?.total ?? 0
        ),
        growthKind: getGrowthKind(
          currentRegistrations,
          previousRegistrations[0]?.total ?? 0
        ),
      },
    },
    registrationGrowth: buildDailySeries(usersInRange, rangeDays),
    planDistribution: await getPlanDistribution(),
  }
}

export async function getRecentAdminUsers(limit = 10) {
  const users = await db.query.UserTable.findMany({
    columns: {
      id: true,
      name: true,
      email: true,
      role: true,
      updatedAt: true,
      createdAt: true,
    },
    orderBy: [desc(UserTable.updatedAt)],
    limit,
  })

  const userIds = users.map(user => user.id)
  const sessions =
    userIds.length > 0
      ? await db
          .select({ userId: AuthSessionTable.userId })
          .from(AuthSessionTable)
          .where(
            and(
              inArray(AuthSessionTable.userId, userIds),
              isNull(AuthSessionTable.revokedAt),
              gt(AuthSessionTable.expiresAt, new Date())
            )
          )
      : []

  const activeUserIds = new Set(sessions.map(session => session.userId))

  return users.map(user => ({
    ...user,
    status: activeUserIds.has(user.id) ? "Active" : "Inactive",
  }))
}

export async function getPlanDistribution() {
  const now = new Date()
  const [totalUsersRow, rows] = await Promise.all([
    db.select({ total: count() }).from(UserTable),
    db
      .select({
        planKey: UserSubscriptionTable.planKey,
        total: count(),
      })
      .from(UserSubscriptionTable)
      .where(
        and(
          eq(UserSubscriptionTable.status, "active"),
          lte(UserSubscriptionTable.currentPeriodStart, now),
          gt(UserSubscriptionTable.currentPeriodEnd, now)
        )
      )
      .groupBy(UserSubscriptionTable.planKey),
  ])

  const total = totalUsersRow[0]?.total ?? 0
  const start = rows.find(row => row.planKey === "start")?.total ?? 0
  const premium = rows.find(row => row.planKey === "premium")?.total ?? 0
  const free = Math.max(0, total - start - premium)

  const toPercent = (value: number) =>
    total === 0 ? 0 : Math.round((value / total) * 100)

  return {
    total,
    items: [
      { label: PLAN_LABELS[0], count: free, value: toPercent(free) },
      { label: PLAN_LABELS[1], count: start, value: toPercent(start) },
      { label: PLAN_LABELS[2], count: premium, value: toPercent(premium) },
    ],
  }
}

export async function getAdminRevenue() {
  const currentMonthStart = new Date()
  currentMonthStart.setDate(1)
  currentMonthStart.setHours(0, 0, 0, 0)

  const [totalRevenue, monthlyRevenue, transactions, monthlyRows] =
    await Promise.all([
      getPaidRevenueTotal(),
      getPaidRevenueTotal(currentMonthStart),
      db.query.PaymentTransactionTable.findMany({
        where: sql`${PaymentTransactionTable.status} = 'paid'`,
        orderBy: [desc(PaymentTransactionTable.paidAt)],
        limit: 20,
        with: {
          user: {
            columns: {
              name: true,
              email: true,
            },
          },
        },
      }),
      db
        .select({
          month: sql<string>`to_char(${PaymentTransactionTable.paidAt}, 'Mon')`,
          value: sql<number>`coalesce(sum(${PaymentTransactionTable.amount}), 0)::int`,
        })
        .from(PaymentTransactionTable)
        .where(sql`${PaymentTransactionTable.status} = 'paid'`)
        .groupBy(sql`to_char(${PaymentTransactionTable.paidAt}, 'Mon')`),
    ])

  const monthValues = new Map(
    monthlyRows.map(row => [row.month.trim(), Number(row.value ?? 0)])
  )

  return {
    stats: {
      totalRevenue: {
        value: formatCurrencyVnd(totalRevenue),
        change: "Live",
        changeType: "positive" as const,
      },
      monthlyRecurringRevenue: {
        value: formatCurrencyVnd(monthlyRevenue),
        change: "Live",
        changeType: "positive" as const,
      },
      churnRate: { value: "0%", change: "0%", changeType: "neutral" as const },
    },
    chart: [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ].map(month => ({ month, value: monthValues.get(month) ?? 0 })),
    transactions: transactions.map(transaction => ({
      id: transaction.id,
      name: transaction.user?.name ?? transaction.user?.email ?? "Unknown",
      initials: getInitials(transaction.user?.name ?? transaction.user?.email ?? "U"),
      plan: formatPlanLabel(transaction.planKey),
      amount: formatCurrencyVnd(transaction.amount),
      status: transaction.status === "paid" ? "Success" : "Pending",
      date: (transaction.paidAt ?? transaction.createdAt).toLocaleDateString("vi-VN"),
    })),
  }
}

export async function getAdminPlans() {
  const [distribution, configs] = await Promise.all([
    getPlanDistribution(),
    listAdminPlanConfigs(),
  ])
  const totalUsers = distribution.total
  const free = distribution.items.find(item => item.label === "Free")?.count ?? 0
  const start = distribution.items.find(item => item.label === "Start")?.count ?? 0
  const premium =
    distribution.items.find(item => item.label === "Premium")?.count ?? 0
  const freePlan = configs.find(plan => plan.key === "free")
  const startPlan = configs.find(plan => plan.key === "start")
  const premiumPlan = configs.find(plan => plan.key === "premium")

  return {
    stats: {
      totalSubscribers: totalUsers,
      freeUsers: free,
      startUsers: start,
      premiumUsers: premium,
    },
    distribution,
    configs,
    growth: [],
    performance: [
      {
        plan: "Free",
        description: freePlan?.description ?? "Gói cơ bản",
        activeUsers: free,
        conversion: "N/A",
        revenue: formatCurrencyVnd((freePlan?.monthlyPrice ?? 0) * free),
        retention: totalUsers === 0 ? 0 : Math.round((free / totalUsers) * 100),
        badge: "free",
      },
      {
        plan: "Start",
        description: startPlan?.description ?? "Gói Start",
        activeUsers: start,
        conversion:
          totalUsers === 0 ? "0%" : `${Math.round((start / totalUsers) * 100)}%`,
        revenue: formatCurrencyVnd((startPlan?.monthlyPrice ?? 0) * start),
        retention:
          totalUsers === 0 ? 0 : Math.round((start / totalUsers) * 100),
        badge: "start",
      },
      {
        plan: "Premium",
        description: premiumPlan?.description ?? "Gói Premium",
        activeUsers: premium,
        conversion:
          totalUsers === 0
            ? "0%"
            : `${Math.round((premium / totalUsers) * 100)}%`,
        revenue: formatCurrencyVnd(
          (premiumPlan?.monthlyPrice ?? 0) * premium
        ),
        retention:
          totalUsers === 0 ? 0 : Math.round((premium / totalUsers) * 100),
        badge: "premium",
      },
    ],
    pricing: configs.map(plan => ({
      key: plan.key,
      name: plan.name,
      priceLabel: formatPlanPrice(plan.monthlyPrice),
      annualDiscountPercent: plan.annualDiscountPercent,
      trialDays: plan.trialDays,
      isActive: plan.isActive,
    })),
  }
}

export async function getAdminActivitySummary() {
  const [users, interviews, jobInfos, questions] = await Promise.all([
    getCount(UserTable),
    getCount(InterviewTable),
    getCount(JobInfoTable),
    getCount(QuestionTable),
  ])

  return { users, interviews, jobInfos, questions }
}
