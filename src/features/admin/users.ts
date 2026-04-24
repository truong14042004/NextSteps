import "server-only"

import { randomUUID } from "node:crypto"
import { and, count, desc, eq, gt, ilike, inArray, isNull, or } from "drizzle-orm"
import { revalidateTag } from "next/cache"
import { z } from "zod"

import { db } from "@/drizzle/db"
import { AuthCredentialTable, AuthSessionTable, UserTable, userRoles } from "@/drizzle/schema"
import { getUserIdTag } from "@/features/users/dbCache"
import { hashPassword } from "@/services/auth/lib/password"

const userPayloadSchema = z.object({
  name: z.string().trim().min(1).max(120),
  email: z.string().trim().email().max(255),
  role: z.enum(userRoles).optional(),
  password: z.string().min(8).max(128).optional(),
})

export type AdminUserRow = {
  id: string
  name: string
  email: string
  role: string
  plan: string
  status: "Active" | "Inactive"
  createdAt: Date
  updatedAt: Date
}

function normalizeEmail(email: string) {
  return email.trim().toLowerCase()
}

function getPlanFromRole(role: string) {
  if (role === "admin") return "Admin"
  if (role === "pro") return "Premium"
  return "Free"
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
        createdAt: UserTable.createdAt,
        updatedAt: UserTable.updatedAt,
      })
      .from(UserTable)
      .where(where)
      .orderBy(desc(UserTable.createdAt))
      .limit(pageSize)
      .offset(offset),
    db.select({ total: count() }).from(UserTable).where(where),
  ])

  const ids = rows.map(user => user.id)
  const activeSessionRows =
    ids.length > 0
      ? await db
          .select({ userId: AuthSessionTable.userId })
          .from(AuthSessionTable)
          .where(
            and(
              inArray(AuthSessionTable.userId, ids),
              isNull(AuthSessionTable.revokedAt),
              gt(AuthSessionTable.expiresAt, new Date())
            )
          )
      : []

  const activeUserIds = new Set(activeSessionRows.map(session => session.userId))

  return {
    users: rows.map(user => ({
      ...user,
      plan: getPlanFromRole(user.role),
      status: activeUserIds.has(user.id) ? "Active" : "Inactive",
    })) satisfies AdminUserRow[],
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
    columns: { id: true },
  })

  if (existing != null) {
    return { ok: false as const, status: 409, message: "Email already exists" }
  }

  const id = randomUUID()

  await db.insert(UserTable).values({
    id,
    name: data.name,
    email,
    imageUrl: "",
    role: data.role ?? "user",
  })

  if (data.password != null) {
    await db.insert(AuthCredentialTable).values({
      userId: id,
      username: email,
      passwordHash: await hashPassword(data.password),
    })
  }

  return { ok: true as const, user: { id } }
}

export async function updateAdminUser(id: string, payload: unknown) {
  const parsed = userPayloadSchema.partial({ password: true }).safeParse(payload)
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
    })
    .where(eq(UserTable.id, id))
    .returning({ id: UserTable.id })

  if (updated.length === 0) {
    return { ok: false as const, status: 404, message: "User not found" }
  }

  if (data.password != null) {
    await db
      .insert(AuthCredentialTable)
      .values({
        userId: id,
        username: email,
        passwordHash: await hashPassword(data.password),
      })
      .onConflictDoUpdate({
        target: [AuthCredentialTable.userId],
        set: {
          username: email,
          passwordHash: await hashPassword(data.password),
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
    .delete(UserTable)
    .where(eq(UserTable.id, id))
    .returning({ id: UserTable.id })

  if (deleted.length === 0) {
    return { ok: false as const, status: 404, message: "User not found" }
  }

  revalidateTag(getUserIdTag(id), "default")
  return { ok: true as const }
}
