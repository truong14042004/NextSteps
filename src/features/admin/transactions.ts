import "server-only"

import type { SQL } from "drizzle-orm"
import { and, count, desc, eq, ilike, or, sql } from "drizzle-orm"

import { db } from "@/drizzle/db"
import { PaymentTransactionTable, UserTable, paymentStatuses } from "@/drizzle/schema"
import {
  formatAdminTransactionAmount,
  formatAdminTransactionPlanLabel,
  normalizeAdminTransactionStatus,
} from "./transactionView.mjs"

export type AdminTransactionListParams = {
  page: number
  pageSize: number
  q: string
  status: "all" | (typeof paymentStatuses)[number]
}

function clampPage(value: string | null) {
  const parsed = Number(value)
  if (!Number.isInteger(parsed) || parsed < 1) return 1
  return parsed
}

function clampPageSize(value: string | null) {
  const parsed = Number(value)
  if (!Number.isInteger(parsed)) return 20
  return Math.min(Math.max(parsed, 1), 100)
}

function parseStatusFilter(value: string | null) {
  if (value === "all" || value == null || value === "") return "all"
  return paymentStatuses.includes(value as (typeof paymentStatuses)[number])
    ? (value as (typeof paymentStatuses)[number])
    : "all"
}

export function parseAdminTransactionListParams(
  searchParams: URLSearchParams
): AdminTransactionListParams {
  return {
    page: clampPage(searchParams.get("page")),
    pageSize: clampPageSize(searchParams.get("pageSize")),
    q: searchParams.get("q")?.trim() ?? "",
    status: parseStatusFilter(searchParams.get("status")),
  }
}

export async function listAdminTransactions({
  page,
  pageSize,
  q,
  status,
}: AdminTransactionListParams) {
  const filters: SQL[] = []

  if (status !== "all") {
    filters.push(eq(PaymentTransactionTable.status, status))
  }

  if (q.length > 0) {
    const pattern = `%${q}%`
    filters.push(
      or(
        ilike(UserTable.name, pattern),
        ilike(UserTable.email, pattern),
        sql`cast(${PaymentTransactionTable.orderCode} as text) ilike ${pattern}`
      )!
    )
  }

  const where = filters.length > 0 ? and(...filters) : undefined
  const offset = (page - 1) * pageSize

  const [rows, totalRows, totalPaidRows, pendingRows] = await Promise.all([
    db
      .select({
        id: PaymentTransactionTable.id,
        userId: PaymentTransactionTable.userId,
        userName: UserTable.name,
        userEmail: UserTable.email,
        planKey: PaymentTransactionTable.planKey,
        orderCode: PaymentTransactionTable.orderCode,
        amount: PaymentTransactionTable.amount,
        currency: PaymentTransactionTable.currency,
        status: PaymentTransactionTable.status,
        checkoutUrl: PaymentTransactionTable.checkoutUrl,
        paidAt: PaymentTransactionTable.paidAt,
        createdAt: PaymentTransactionTable.createdAt,
      })
      .from(PaymentTransactionTable)
      .leftJoin(UserTable, eq(PaymentTransactionTable.userId, UserTable.id))
      .where(where)
      .orderBy(desc(PaymentTransactionTable.createdAt))
      .limit(pageSize)
      .offset(offset),
    db
      .select({ total: count() })
      .from(PaymentTransactionTable)
      .leftJoin(UserTable, eq(PaymentTransactionTable.userId, UserTable.id))
      .where(where),
    db
      .select({
        total: sql<number>`coalesce(sum(${PaymentTransactionTable.amount}), 0)::int`,
      })
      .from(PaymentTransactionTable)
      .where(eq(PaymentTransactionTable.status, "paid")),
    db
      .select({ total: count() })
      .from(PaymentTransactionTable)
      .where(eq(PaymentTransactionTable.status, "pending")),
  ])

  return {
    transactions: rows.map(row => {
      const normalizedStatus = normalizeAdminTransactionStatus(row.status)

      return {
        id: row.id,
        userId: row.userId,
        userName: row.userName ?? "Unknown",
        userEmail: row.userEmail ?? "",
        planKey: row.planKey,
        planLabel: formatAdminTransactionPlanLabel(row.planKey),
        orderCode: row.orderCode,
        amount: row.amount,
        currency: row.currency,
        amountLabel: formatAdminTransactionAmount(row.amount, row.currency),
        status: normalizedStatus.key,
        statusLabel: normalizedStatus.label,
        checkoutUrl: row.checkoutUrl,
        paidAt: row.paidAt?.toISOString() ?? null,
        createdAt: row.createdAt.toISOString(),
      }
    }),
    pagination: {
      page,
      pageSize,
      total: totalRows[0]?.total ?? 0,
    },
    stats: {
      totalPaidAmount: Number(totalPaidRows[0]?.total ?? 0),
      totalPaidAmountLabel: formatAdminTransactionAmount(
        Number(totalPaidRows[0]?.total ?? 0),
        "VND"
      ),
      pendingTransactions: pendingRows[0]?.total ?? 0,
    },
  }
}
