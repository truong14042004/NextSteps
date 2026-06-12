import "server-only"

import { randomUUID } from "node:crypto"
import { and, count, desc, eq, gt, ilike, inArray, isNull, lte, ne, or, sql } from "drizzle-orm"
import { revalidateTag } from "next/cache"
import { z } from "zod"

import { db } from "@/drizzle/db"
import {
  AuthCredentialTable,
  AuthSessionTable,
  PaymentTransactionTable,
  UserSubscriptionTable,
  UserTable,
  userRoles,
} from "@/drizzle/schema"
import { getUserIdTag } from "@/features/users/dbCache"
import { hashPassword } from "@/services/auth/lib/password"

const userPayloadSchema = z.object({
  name: z.string().trim().min(1).max(120),
  email: z.string().trim().email().max(255),
  role: z.enum(userRoles).optional(),
  password: z
    .string()
    .trim()
    .transform(value => (value === "" ? undefined : value))
    .pipe(z.string().min(8).max(128).optional())
    .optional(),
})

export type AdminUserRow = {
  id: string
  name: string
  email: string
  role: string
  plan: string
  status: "Active" | "Inactive" | "Deleted"
  createdAt: Date
  updatedAt: Date
  lastActiveAt: Date
  revenue: number
}

function normalizeEmail(email: string) {
  return email.trim().toLowerCase()
}

function getPlanFromRole(role: string) {
  if (role === "admin") return "Admin"
  return "Free"
}

function getPlanLabel(planKey: string | undefined, role: string) {
  if (role === "admin") return "Admin"
  if (planKey === "premium") return "Premium"
  if (planKey === "start") return "Start"
  return getPlanFromRole(role)
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

export function parseAdminUserListParams(searchParams: URLSearchParams) {
  return {
    page: clampPage(searchParams.get("page")),
    pageSize: clampPageSize(searchParams.get("pageSize")),
    q: searchParams.get("q")?.trim() ?? "",
    role: searchParams.get("role")?.trim() ?? "",
  }
}

export async function listAdminUsers({
  page,
  pageSize,
  q,
  role,
}: {
  page: number
  pageSize: number
  q: string
  role: string
}) {
  const filters = []

  filters.push(ne(UserTable.status, "deleted"))

  if (q.length > 0) {
    const pattern = `%${q}%`
    filters.push(
      or(
        ilike(UserTable.id, pattern),
        ilike(UserTable.name, pattern),
        ilike(UserTable.email, pattern)
      )
    )
  }

  if (userRoles.includes(role as (typeof userRoles)[number])) {
    filters.push(eq(UserTable.role, role as (typeof userRoles)[number]))
  }

  const where = filters.length > 0 ? and(...filters) : undefined
  const offset = (page - 1) * pageSize

  const [rows, totalRows] = await Promise.all([
    db
      .select({
        id: UserTable.id,
        name: UserTable.name,
        email: UserTable.email,
        role: UserTable.role,
        userStatus: UserTable.status,
        createdAt: UserTable.createdAt,
        updatedAt: UserTable.updatedAt,
        lastActiveAt: UserTable.updatedAt,
      })
      .from(UserTable)
      .where(where)
      .orderBy(desc(UserTable.updatedAt), desc(UserTable.createdAt))
      .limit(pageSize)
      .offset(offset),
    db.select({ total: count() }).from(UserTable).where(where),
  ])

  const ids = rows.map(user => user.id)
  let activeSessionRows: { userId: string }[] = []
  if (ids.length > 0) {
    try {
      activeSessionRows = await db
        .select({ userId: AuthSessionTable.userId })
        .from(AuthSessionTable)
        .where(
          and(
            inArray(AuthSessionTable.userId, ids),
            isNull(AuthSessionTable.revokedAt),
            gt(AuthSessionTable.expiresAt, new Date()),
            gt(AuthSessionTable.updatedAt, new Date(Date.now() - 5 * 60 * 1000))
          )
        )
    } catch (error) {
      console.warn("Admin user list could not load active sessions", error)
    }
  }

  const activeUserIds = new Set(activeSessionRows.map(session => session.userId))
  const now = new Date()
  let subscriptions: { userId: string; planKey: string }[] = []
  if (ids.length > 0) {
    try {
      subscriptions = await db
        .select({
          userId: UserSubscriptionTable.userId,
          planKey: UserSubscriptionTable.planKey,
        })
        .from(UserSubscriptionTable)
        .where(
          and(
            inArray(UserSubscriptionTable.userId, ids),
            eq(UserSubscriptionTable.status, "active"),
            lte(UserSubscriptionTable.currentPeriodStart, now),
            gt(UserSubscriptionTable.currentPeriodEnd, now)
          )
        )
        .orderBy(desc(UserSubscriptionTable.currentPeriodEnd))
    } catch (error) {
      console.warn("Admin user list could not load subscriptions", error)
    }
  }
  const activePlanByUserId = new Map<string, string>()
  for (const subscription of subscriptions) {
    if (!activePlanByUserId.has(subscription.userId)) {
      activePlanByUserId.set(subscription.userId, subscription.planKey)
    }
  }

  let revenues: { userId: string | null; totalAmount: number }[] = []
  if (ids.length > 0) {
    try {
      revenues = await db
        .select({
          userId: PaymentTransactionTable.userId,
          totalAmount: sql<number>`coalesce(sum(${PaymentTransactionTable.amount}), 0)::int`,
        })
        .from(PaymentTransactionTable)
        .where(
          and(
            inArray(PaymentTransactionTable.userId, ids),
            eq(PaymentTransactionTable.status, "paid")
          )
        )
        .groupBy(PaymentTransactionTable.userId)
    } catch (error) {
      console.warn("Admin user list could not load revenues", error)
    }
  }

  const revenueByUserId = new Map<string, number>()
  for (const r of revenues) {
    if (r.userId) {
      revenueByUserId.set(r.userId, r.totalAmount)
    }
  }

  return {
    users: rows.map(user => {
      const { userStatus, ...row } = user

      return {
        ...row,
        plan: getPlanLabel(activePlanByUserId.get(user.id), user.role),
        status:
          userStatus === "deleted"
            ? "Deleted"
            : activeUserIds.has(user.id)
              ? "Active"
              : "Inactive",
        revenue: revenueByUserId.get(user.id) ?? 0,
      }
    }) satisfies AdminUserRow[],
    pagination: {
      page,
      pageSize,
      total: totalRows[0]?.total ?? 0,
    },
  }
}

export async function createAdminUser(payload: unknown) {
  const parsed = userPayloadSchema.safeParse(payload)
  if (!parsed.success) {
    return { ok: false as const, status: 400, message: "Invalid user payload" }
  }

  const data = parsed.data
  const email = normalizeEmail(data.email)
  const existing = await db.query.UserTable.findFirst({
    where: eq(UserTable.email, email),
    columns: { id: true, status: true },
  })

  if (existing != null && existing.status !== "deleted") {
    return { ok: false as const, status: 409, message: "Email already exists" }
  }

  const id = existing?.id ?? randomUUID()

  if (existing?.status === "deleted") {
    await db
      .update(UserTable)
      .set({
        name: data.name,
        email,
        role: data.role ?? "user",
        status: "active",
        updatedAt: new Date(),
      })
      .where(eq(UserTable.id, id))
  } else {
    await db.insert(UserTable).values({
      id,
      name: data.name,
      email,
      imageUrl: "",
      role: data.role ?? "user",
    })
  }

  if (data.password != null) {
    const passwordHash = await hashPassword(data.password)

    await db
      .insert(AuthCredentialTable)
      .values({
        userId: id,
        username: email,
        passwordHash,
      })
      .onConflictDoUpdate({
        target: [AuthCredentialTable.userId],
        set: {
          username: email,
          passwordHash,
          updatedAt: new Date(),
        },
      })
  }

  return { ok: true as const, user: { id } }
}

export async function updateAdminUser(id: string, payload: unknown) {
  const parsed = userPayloadSchema.safeParse(payload)
  if (!parsed.success) {
    return { ok: false as const, status: 400, message: "Invalid user payload" }
  }

  const data = parsed.data
  const email = normalizeEmail(data.email)
  const existing = await db.query.UserTable.findFirst({
    where: eq(UserTable.email, email),
    columns: { id: true },
  })

  if (existing != null && existing.id !== id) {
    return { ok: false as const, status: 409, message: "Email already exists" }
  }

  const updated = await db
    .update(UserTable)
    .set({
      name: data.name,
      email,
      role: data.role,
      status: "active",
    })
    .where(eq(UserTable.id, id))
    .returning({ id: UserTable.id })

  if (updated.length === 0) {
    return { ok: false as const, status: 404, message: "User not found" }
  }

  if (data.password != null) {
    const passwordHash = await hashPassword(data.password)

    await db
      .insert(AuthCredentialTable)
      .values({
        userId: id,
        username: email,
        passwordHash,
      })
      .onConflictDoUpdate({
        target: [AuthCredentialTable.userId],
        set: {
          username: email,
          passwordHash,
          updatedAt: new Date(),
        },
      })
  }

  revalidateTag(getUserIdTag(id), "default")
  return { ok: true as const, user: updated[0] }
}

export async function deleteAdminUser(id: string, currentAdminId: string) {
  if (id === currentAdminId) {
    return {
      ok: false as const,
      status: 400,
      message: "Admins cannot delete their own account",
    }
  }

  const deleted = await db
    .update(UserTable)
    .set({ status: "deleted", updatedAt: new Date() })
    .where(and(eq(UserTable.id, id), ne(UserTable.status, "deleted")))
    .returning({ id: UserTable.id })

  if (deleted.length === 0) {
    return { ok: false as const, status: 404, message: "User not found" }
  }

  await db
    .update(AuthSessionTable)
    .set({ revokedAt: new Date(), updatedAt: new Date() })
    .where(and(eq(AuthSessionTable.userId, id), isNull(AuthSessionTable.revokedAt)))

  revalidateTag(getUserIdTag(id), "default")
  return { ok: true as const }
}
