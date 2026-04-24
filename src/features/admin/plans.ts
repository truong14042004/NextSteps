import "server-only"

import { asc, eq, sql } from "drizzle-orm"
import { z } from "zod"

import { db } from "@/drizzle/db"
import { AdminPlanFeatureTable, AdminPlanTable } from "@/drizzle/schema"

export type AdminPlanConfig = {
  id: string
  key: string
  name: string
  description: string
  monthlyPrice: number
  annualDiscountPercent: number
  trialDays: number
  resumeAnalysisLimit: number | null
  aiQuestionLimit: number | null
  mockInterviewLimit: number | null
  isActive: boolean
  sortOrder: number
  features: AdminPlanFeature[]
}

export type AdminPlanFeature = {
  id: string
  planId: string
  label: string
  description: string | null
  isEnabled: boolean
  sortOrder: number
}

const usageLimitSchema = z.coerce
  .number()
  .int()
  .min(0)
  .max(1_000_000)
  .nullable()

const planSchema = z.object({
  name: z.string().trim().min(1).max(80),
  description: z.string().trim().min(1).max(1000),
  monthlyPrice: z.coerce.number().int().min(0).max(100_000_000),
  annualDiscountPercent: z.coerce.number().int().min(0).max(100),
  trialDays: z.coerce.number().int().min(0).max(365),
  resumeAnalysisLimit: usageLimitSchema,
  aiQuestionLimit: usageLimitSchema,
  mockInterviewLimit: usageLimitSchema,
  isActive: z.boolean(),
})

const featureSchema = z.object({
  label: z.string().trim().min(1).max(160),
  description: z.string().trim().max(1000).optional().nullable(),
  isEnabled: z.boolean(),
})

export function formatPlanPrice(value: number) {
  if (value === 0) return "0₫"
  return `${value.toLocaleString("vi-VN")}₫`
}

export function formatUsageLimit(value: number | null) {
  return value == null
    ? "Không giới hạn"
    : `${value.toLocaleString("vi-VN")}/tháng`
}

export function formatCompactPlanPrice(value: number) {
  if (value === 0) return "0đ"
  if (value % 1000 === 0) return `${value / 1000}k`
  return formatPlanPrice(value)
}

export async function listAdminPlanConfigs() {
  const plans = await db.query.AdminPlanTable.findMany({
    orderBy: [asc(AdminPlanTable.sortOrder)],
    with: {
      features: {
        orderBy: [asc(AdminPlanFeatureTable.sortOrder)],
      },
    },
  })

  return plans.map(plan => ({
    ...plan,
    features: plan.features.map(feature => ({
      id: feature.id,
      planId: feature.planId,
      label: feature.label,
      description: feature.description,
      isEnabled: feature.isEnabled,
      sortOrder: feature.sortOrder,
    })),
  })) satisfies AdminPlanConfig[]
}

export async function listPublicPlanConfigs() {
  const plans = await listAdminPlanConfigs()
  return plans.filter(plan => plan.isActive)
}

export async function updateAdminPlanConfig(planKey: string, payload: unknown) {
  const parsed = planSchema.safeParse(payload)
  if (!parsed.success) {
    return { ok: false as const, status: 400, message: "Invalid plan payload" }
  }

  const updated = await db
    .update(AdminPlanTable)
    .set(parsed.data)
    .where(eq(AdminPlanTable.key, planKey))
    .returning({ id: AdminPlanTable.id, key: AdminPlanTable.key })

  if (updated.length === 0) {
    return { ok: false as const, status: 404, message: "Plan not found" }
  }

  return { ok: true as const, plan: updated[0] }
}

export async function createAdminPlanFeature(planKey: string, payload: unknown) {
  const parsed = featureSchema.safeParse(payload)
  if (!parsed.success) {
    return {
      ok: false as const,
      status: 400,
      message: "Invalid feature payload",
    }
  }

  const plan = await db.query.AdminPlanTable.findFirst({
    where: eq(AdminPlanTable.key, planKey),
    columns: { id: true },
  })

  if (plan == null) {
    return { ok: false as const, status: 404, message: "Plan not found" }
  }

  const [{ nextSortOrder }] = await db
    .select({
      nextSortOrder:
        sql<number>`coalesce(max(${AdminPlanFeatureTable.sortOrder}), 0) + 10`,
    })
    .from(AdminPlanFeatureTable)
    .where(eq(AdminPlanFeatureTable.planId, plan.id))

  const inserted = await db
    .insert(AdminPlanFeatureTable)
    .values({
      planId: plan.id,
      label: parsed.data.label,
      description: parsed.data.description ?? null,
      isEnabled: parsed.data.isEnabled,
      sortOrder: nextSortOrder ?? 10,
    })
    .returning()

  return { ok: true as const, feature: inserted[0] }
}

export async function updateAdminPlanFeature(featureId: string, payload: unknown) {
  const parsed = featureSchema.safeParse(payload)
  if (!parsed.success) {
    return {
      ok: false as const,
      status: 400,
      message: "Invalid feature payload",
    }
  }

  const updated = await db
    .update(AdminPlanFeatureTable)
    .set({
      label: parsed.data.label,
      description: parsed.data.description ?? null,
      isEnabled: parsed.data.isEnabled,
    })
    .where(eq(AdminPlanFeatureTable.id, featureId))
    .returning()

  if (updated.length === 0) {
    return { ok: false as const, status: 404, message: "Feature not found" }
  }

  return { ok: true as const, feature: updated[0] }
}

export async function deleteAdminPlanFeature(featureId: string) {
  const deleted = await db
    .delete(AdminPlanFeatureTable)
    .where(eq(AdminPlanFeatureTable.id, featureId))
    .returning({ id: AdminPlanFeatureTable.id })

  if (deleted.length === 0) {
    return { ok: false as const, status: 404, message: "Feature not found" }
  }

  return { ok: true as const }
}
