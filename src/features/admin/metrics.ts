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
  try {
    const [row] = await db.select({ total: count() }).from(table)
    return row?.total ?? 0
  } catch {
    return 0
  }
}

async function getCountSince(
  table: typeof UserTable | typeof InterviewTable,
  column: typeof UserTable.createdAt | typeof InterviewTable.createdAt,
  since: Date
) {
  try {
    const [row] = await db
      .select({ total: count() })
      .from(table)
      .where(gte(column, since))
    return row?.total ?? 0
  } catch {
    return 0
  }
}

async function getPaidRevenueTotal(since?: Date) {
  try {
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
  } catch {
    return 0
  }
}

export function parseAdminRange(searchParams: URLSearchParams) {
  return clampRangeDays(searchParams.get("range"))
}

export async function getAdminDashboard(rangeDays: RangeDays) {
  const rangeStart = getRangeStart(rangeDays)
  const previousRangeStart = getRangeStart(rangeDays * 2)

  // All DB queries wrapped individually — Neon serverless may suspend between requests
  const activeSessionsResult = await db
    .select({ total: count() })
    .from(AuthSessionTable)
    .where(
      and(
        isNull(AuthSessionTable.revokedAt),
        gt(AuthSessionTable.expiresAt, new Date()),
        gt(AuthSessionTable.updatedAt, new Date(Date.now() - 5 * 60 * 1000))
      )
    )
    .catch(() => [{ total: 0 }])

  const previousRegistrationsResult = await db
    .select({ total: count() })
    .from(UserTable)
    .where(and(
      gte(UserTable.createdAt, previousRangeStart),
      sql`${UserTable.createdAt} < ${rangeStart}`
    ))
    .catch(() => [{ total: 0 }])

  const previousInterviewsResult = await db
    .select({ total: count() })
    .from(InterviewTable)
    .where(and(
      gte(InterviewTable.createdAt, previousRangeStart),
      sql`${InterviewTable.createdAt} < ${rangeStart}`
    ))
    .catch(() => [{ total: 0 }])

  const usersInRangeResult = await db
    .select({ createdAt: UserTable.createdAt })
    .from(UserTable)
    .where(gte(UserTable.createdAt, rangeStart))
    .catch(() => [] as { createdAt: Date }[])

  const [
    totalUsers,
    currentRegistrations,
    totalInterviews,
    currentInterviews,
    totalRevenue,
  ] = await Promise.all([
    getCount(UserTable),
    getCountSince(UserTable, UserTable.createdAt, rangeStart),
    getCount(InterviewTable),
    getCountSince(InterviewTable, InterviewTable.createdAt, rangeStart),
    getPaidRevenueTotal(),
  ])

  const activeSessions = activeSessionsResult
  const previousRegistrations = previousRegistrationsResult
  const previousInterviews = previousInterviewsResult
  const usersInRange = usersInRangeResult

  // Fetch recent activities — fallback to empty arrays on failure
  let dbUsers: { id: string; name: string; createdAt: Date }[] = []
  let dbInterviews: { id: string; name: string | null; createdAt: Date }[] = []
  let dbJobs: { id: string; name: string | null; createdAt: Date; title: string | null }[] = []
  let dbPayments: { id: string; name: string | null; email: string | null; createdAt: Date | null; amount: number; planKey: string }[] = []

  try {
    ;[dbUsers, dbInterviews, dbJobs, dbPayments] = await Promise.all([
      db
        .select({ id: UserTable.id, name: UserTable.name, createdAt: UserTable.createdAt })
        .from(UserTable)
        .orderBy(desc(UserTable.createdAt))
        .limit(5),
      db
        .select({ id: InterviewTable.id, name: UserTable.name, createdAt: InterviewTable.createdAt })
        .from(InterviewTable)
        .leftJoin(JobInfoTable, eq(InterviewTable.jobInfoId, JobInfoTable.id))
        .leftJoin(UserTable, eq(JobInfoTable.userId, UserTable.id))
        .orderBy(desc(InterviewTable.createdAt))
        .limit(5),
      db
        .select({ id: JobInfoTable.id, name: UserTable.name, createdAt: JobInfoTable.createdAt, title: JobInfoTable.title })
        .from(JobInfoTable)
        .leftJoin(UserTable, eq(JobInfoTable.userId, UserTable.id))
        .orderBy(desc(JobInfoTable.createdAt))
        .limit(5),
      db
        .select({ id: PaymentTransactionTable.id, name: UserTable.name, email: UserTable.email, createdAt: PaymentTransactionTable.paidAt, amount: PaymentTransactionTable.amount, planKey: PaymentTransactionTable.planKey })
        .from(PaymentTransactionTable)
        .leftJoin(UserTable, eq(PaymentTransactionTable.userId, UserTable.id))
        .where(eq(PaymentTransactionTable.status, "paid"))
        .orderBy(desc(PaymentTransactionTable.paidAt))
        .limit(5),
    ])
  } catch (err) {
    console.error("[getAdminDashboard] activities query failed:", err)
  }

  const combinedActivities = [
    ...dbUsers.map(u => ({
      id: `u-${u.id}`,
      type: "register" as const,
      user: u.name ?? "Người dùng mới",
      createdAt: u.createdAt,
      detail: "Đăng ký tài khoản thành công",
    })),
    ...dbInterviews.map(i => ({
      id: `i-${i.id}`,
      type: "interview" as const,
      user: i.name ?? "Người dùng",
      createdAt: i.createdAt,
      detail: "Hoàn thành buổi phỏng vấn AI",
    })),
    ...dbJobs.map(j => ({
      id: `j-${j.id}`,
      type: j.title ? ("create_jd" as const) : ("upload_cv" as const),
      user: j.name ?? "Thành viên",
      createdAt: j.createdAt,
      detail: j.title ? `Tạo JD: ${j.title}` : "Tải lên CV phân tích",
    })),
    ...dbPayments.map(p => ({
      id: `p-${p.id}`,
      type: "payment" as const,
      user: p.name ?? p.email ?? "Khách hàng",
      createdAt: p.createdAt ?? new Date(),
      detail: `Thanh toán gói ${p.planKey === "premium" ? "Premium" : p.planKey === "start" ? "Start" : p.planKey} (${p.amount.toLocaleString("vi-VN")}₫)`,
    })),
  ]

  combinedActivities.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
  const recentActivities = combinedActivities.slice(0, 5)

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
    recentActivities: recentActivities.map(act => ({
      id: act.id,
      type: act.type,
      user: act.user,
      time: act.createdAt,
      detail: act.detail,
    })),
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
              gt(AuthSessionTable.expiresAt, new Date()),
              gt(AuthSessionTable.updatedAt, new Date(Date.now() - 5 * 60 * 1000))
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
  try {
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
  } catch (err) {
    console.error("[getPlanDistribution] failed:", err)
    return {
      total: 0,
      items: [
        { label: PLAN_LABELS[0], count: 0, value: 0 },
        { label: PLAN_LABELS[1], count: 0, value: 0 },
        { label: PLAN_LABELS[2], count: 0, value: 0 },
      ],
    }
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
  const [distribution, configs, allUsers, allSubs] = await Promise.all([
    getPlanDistribution(),
    listAdminPlanConfigs(),
    db.select({ createdAt: UserTable.createdAt }).from(UserTable),
    db
      .select({ createdAt: UserSubscriptionTable.createdAt, planKey: UserSubscriptionTable.planKey })
      .from(UserSubscriptionTable),
  ])

  const totalUsers = distribution.total
  const free = distribution.items.find(item => item.label === "Free")?.count ?? 0
  const start = distribution.items.find(item => item.label === "Start")?.count ?? 0
  const premium =
    distribution.items.find(item => item.label === "Premium")?.count ?? 0
  const freePlan = configs.find(plan => plan.key === "free")
  const startPlan = configs.find(plan => plan.key === "start")
  const premiumPlan = configs.find(plan => plan.key === "premium")

  function buildDailyMultiSeries(users: { createdAt: Date }[], subs: { createdAt: Date; planKey: string }[], rangeDays: number) {
    const maxPoints = rangeDays === 7 ? 7 : 11
    const step = Math.max(1, Math.floor(rangeDays / maxPoints))
    const points = []

    for (let i = maxPoints - 1; i >= 0; i -= 1) {
      const startD = getRangeStart(i * step)
      startD.setHours(0, 0, 0, 0)
      const endD = new Date(startD)
      endD.setDate(endD.getDate() + step)

      const usersInPeriod = users.filter(u => u.createdAt >= startD && u.createdAt < endD).length
      const startInPeriod = subs.filter(s => s.planKey === "start" && s.createdAt >= startD && s.createdAt < endD).length
      const premiumInPeriod = subs.filter(s => s.planKey === "premium" && s.createdAt >= startD && s.createdAt < endD).length
      const freeInPeriod = Math.max(0, usersInPeriod - startInPeriod - premiumInPeriod)

      points.push({
        label: formatDay(startD).toUpperCase(),
        free: freeInPeriod,
        start: startInPeriod,
        premium: premiumInPeriod,
      })
    }
    return points
  }

  function buildMonthlyMultiSeries(users: { createdAt: Date }[], subs: { createdAt: Date; planKey: string }[]) {
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
    const now = new Date()
    const points = []

    for (let i = 11; i >= 0; i--) {
      const startD = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const endD = new Date(now.getFullYear(), now.getMonth() - i + 1, 1)
      const mLabel = monthNames[startD.getMonth()]

      const usersInPeriod = users.filter(u => u.createdAt >= startD && u.createdAt < endD).length
      const startInPeriod = subs.filter(s => s.planKey === "start" && s.createdAt >= startD && s.createdAt < endD).length
      const premiumInPeriod = subs.filter(s => s.planKey === "premium" && s.createdAt >= startD && s.createdAt < endD).length
      const freeInPeriod = Math.max(0, usersInPeriod - startInPeriod - premiumInPeriod)

      points.push({
        label: mLabel,
        free: freeInPeriod,
        start: startInPeriod,
        premium: premiumInPeriod,
      })
    }
    return points
  }

  function buildYearlyMultiSeries(users: { createdAt: Date }[], subs: { createdAt: Date; planKey: string }[]) {
    const years = ["2024", "2025", "2026"]
    const points = []

    for (const y of years) {
      const startD = new Date(Number(y), 0, 1)
      const endD = new Date(Number(y) + 1, 0, 1)

      const usersInPeriod = users.filter(u => u.createdAt >= startD && u.createdAt < endD).length
      const startInPeriod = subs.filter(s => s.planKey === "start" && s.createdAt >= startD && s.createdAt < endD).length
      const premiumInPeriod = subs.filter(s => s.planKey === "premium" && s.createdAt >= startD && s.createdAt < endD).length
      const freeInPeriod = Math.max(0, usersInPeriod - startInPeriod - premiumInPeriod)

      points.push({
        label: y,
        free: freeInPeriod,
        start: startInPeriod,
        premium: premiumInPeriod,
      })
    }
    return points
  }

  return {
    stats: {
      totalSubscribers: totalUsers,
      freeUsers: free,
      startUsers: start,
      premiumUsers: premium,
    },
    distribution,
    configs,
    growth: {
      daily: buildDailyMultiSeries(allUsers, allSubs, 30),
      monthly: buildMonthlyMultiSeries(allUsers, allSubs),
      yearly: buildYearlyMultiSeries(allUsers, allSubs),
    },
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
