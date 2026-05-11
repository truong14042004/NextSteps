import "server-only"

import type { SQL } from "drizzle-orm"
import { and, count, desc, eq, ilike, or, sql } from "drizzle-orm"
import { z } from "zod"

import { db } from "@/drizzle/db"
import {
  ServiceReviewTable,
  UserTable,
  serviceReviewServiceKeys,
  serviceReviewStatuses,
} from "@/drizzle/schema"
import { getCurrentUser } from "@/services/clerk/lib/getCurrentUser"
import {
  clampServiceReviewRating,
  getServiceReviewServiceLabel,
  getServiceReviewStatusLabel,
} from "./serviceReviewRules.mjs"

const serviceReviewPayloadSchema = z.object({
  serviceKey: z.enum(serviceReviewServiceKeys).default("system"),
  rating: z.coerce.number().int().min(1).max(5),
  comment: z.string().trim().max(2000).optional().nullable(),
})

const reviewStatusPayloadSchema = z.object({
  status: z.enum(serviceReviewStatuses),
})

export type AdminServiceReviewListParams = {
  page: number
  pageSize: number
  q: string
  status: "all" | (typeof serviceReviewStatuses)[number]
  serviceKey: "all" | (typeof serviceReviewServiceKeys)[number]
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
  return serviceReviewStatuses.includes(
    value as (typeof serviceReviewStatuses)[number]
  )
    ? (value as (typeof serviceReviewStatuses)[number])
    : "all"
}

function parseServiceFilter(value: string | null) {
  if (value === "all" || value == null || value === "") return "all"
  return serviceReviewServiceKeys.includes(
    value as (typeof serviceReviewServiceKeys)[number]
  )
    ? (value as (typeof serviceReviewServiceKeys)[number])
    : "all"
}

export function parseAdminServiceReviewListParams(
  searchParams: URLSearchParams
): AdminServiceReviewListParams {
  return {
    page: clampPage(searchParams.get("page")),
    pageSize: clampPageSize(searchParams.get("pageSize")),
    q: searchParams.get("q")?.trim() ?? "",
    status: parseStatusFilter(searchParams.get("status")),
    serviceKey: parseServiceFilter(searchParams.get("serviceKey")),
  }
}

export async function createServiceReview(payload: unknown) {
  const { userId } = await getCurrentUser()
  if (userId == null) {
    return { ok: false as const, status: 401, message: "Authentication required" }
  }

  const parsed = serviceReviewPayloadSchema.safeParse(payload)
  if (!parsed.success) {
    return { ok: false as const, status: 400, message: "Invalid review payload" }
  }

  const data = parsed.data
  const [review] = await db
    .insert(ServiceReviewTable)
    .values({
      userId,
      serviceKey: data.serviceKey,
      rating: clampServiceReviewRating(data.rating),
      comment: data.comment?.trim() ? data.comment.trim() : null,
      status: "pending",
    })
    .returning({ id: ServiceReviewTable.id })

  return { ok: true as const, review }
}

export async function listAdminServiceReviews({
  page,
  pageSize,
  q,
  status,
  serviceKey,
}: AdminServiceReviewListParams) {
  const filters: SQL[] = []

  if (status !== "all") {
    filters.push(eq(ServiceReviewTable.status, status))
  }

  if (serviceKey !== "all") {
    filters.push(eq(ServiceReviewTable.serviceKey, serviceKey))
  }

  if (q.length > 0) {
    const pattern = `%${q}%`
    filters.push(
      or(
        ilike(UserTable.name, pattern),
        ilike(UserTable.email, pattern),
        ilike(ServiceReviewTable.comment, pattern)
      )!
    )
  }

  const where = filters.length > 0 ? and(...filters) : undefined
  const offset = (page - 1) * pageSize

  const [rows, totalRows, summaryRows, pendingRows] = await Promise.all([
    db
      .select({
        id: ServiceReviewTable.id,
        userId: ServiceReviewTable.userId,
        userName: UserTable.name,
        userEmail: UserTable.email,
        serviceKey: ServiceReviewTable.serviceKey,
        rating: ServiceReviewTable.rating,
        comment: ServiceReviewTable.comment,
        status: ServiceReviewTable.status,
        createdAt: ServiceReviewTable.createdAt,
        updatedAt: ServiceReviewTable.updatedAt,
      })
      .from(ServiceReviewTable)
      .leftJoin(UserTable, eq(ServiceReviewTable.userId, UserTable.id))
      .where(where)
      .orderBy(desc(ServiceReviewTable.createdAt))
      .limit(pageSize)
      .offset(offset),
    db
      .select({ total: count() })
      .from(ServiceReviewTable)
      .leftJoin(UserTable, eq(ServiceReviewTable.userId, UserTable.id))
      .where(where),
    db
      .select({
        total: count(),
        averageRating: sql<number>`coalesce(avg(${ServiceReviewTable.rating}), 0)`,
      })
      .from(ServiceReviewTable),
    db
      .select({ total: count() })
      .from(ServiceReviewTable)
      .where(eq(ServiceReviewTable.status, "pending")),
  ])

  const averageRating = Number(summaryRows[0]?.averageRating ?? 0)

  return {
    reviews: rows.map(row => ({
      id: row.id,
      userId: row.userId,
      userName: row.userName ?? "Unknown",
      userEmail: row.userEmail ?? "",
      serviceKey: row.serviceKey,
      serviceLabel: getServiceReviewServiceLabel(row.serviceKey),
      rating: row.rating,
      comment: row.comment,
      status: row.status,
      statusLabel: getServiceReviewStatusLabel(row.status),
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    })),
    pagination: {
      page,
      pageSize,
      total: totalRows[0]?.total ?? 0,
    },
    stats: {
      totalReviews: summaryRows[0]?.total ?? 0,
      pendingReviews: pendingRows[0]?.total ?? 0,
      averageRating: Math.round(averageRating * 10) / 10,
    },
  }
}

export async function updateAdminServiceReviewStatus(
  reviewId: string,
  payload: unknown
) {
  const parsed = reviewStatusPayloadSchema.safeParse(payload)
  if (!parsed.success) {
    return { ok: false as const, status: 400, message: "Invalid status payload" }
  }

  const updated = await db
    .update(ServiceReviewTable)
    .set({ status: parsed.data.status })
    .where(eq(ServiceReviewTable.id, reviewId))
    .returning({ id: ServiceReviewTable.id })

  if (updated.length === 0) {
    return { ok: false as const, status: 404, message: "Review not found" }
  }

  return { ok: true as const, review: updated[0] }
}
