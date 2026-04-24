import {
  boolean,
  integer,
  pgTable,
  text,
  uniqueIndex,
  uuid,
  varchar,
} from "drizzle-orm/pg-core"
import { relations } from "drizzle-orm"

import { createdAt, id, updatedAt } from "../schemaHelpers"

export const AdminPlanTable = pgTable(
  "admin_plans",
  {
    id,
    key: varchar({ length: 32 }).notNull(),
    name: varchar({ length: 80 }).notNull(),
    description: text().notNull(),
    monthlyPrice: integer().notNull().default(0),
    annualDiscountPercent: integer().notNull().default(0),
    trialDays: integer().notNull().default(0),
    resumeAnalysisLimit: integer(),
    aiQuestionLimit: integer(),
    mockInterviewLimit: integer(),
    isActive: boolean().notNull().default(true),
    sortOrder: integer().notNull().default(0),
    createdAt,
    updatedAt,
  },
  table => ({
    keyUniqueIdx: uniqueIndex("admin_plans_key_unique").on(table.key),
  })
)

export const AdminPlanFeatureTable = pgTable("admin_plan_features", {
  id,
  planId: uuid()
    .notNull()
    .references(() => AdminPlanTable.id, { onDelete: "cascade" }),
  label: varchar({ length: 160 }).notNull(),
  description: text(),
  isEnabled: boolean().notNull().default(true),
  sortOrder: integer().notNull().default(0),
  createdAt,
  updatedAt,
})

export const adminPlanRelations = relations(AdminPlanTable, ({ many }) => ({
  features: many(AdminPlanFeatureTable),
}))

export const adminPlanFeatureRelations = relations(
  AdminPlanFeatureTable,
  ({ one }) => ({
    plan: one(AdminPlanTable, {
      fields: [AdminPlanFeatureTable.planId],
      references: [AdminPlanTable.id],
    }),
  })
)
