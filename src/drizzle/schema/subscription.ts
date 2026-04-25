import { relations } from "drizzle-orm"
import {
  integer,
  pgTable,
  timestamp,
  uuid,
  varchar,
  index,
} from "drizzle-orm/pg-core"

import { createdAt, id, updatedAt } from "../schemaHelpers"
import { PaymentTransactionTable } from "./payment"
import { AdminPlanTable } from "./plan"
import { UserTable } from "./user"

export const subscriptionStatuses = ["active", "expired", "cancelled"] as const
export type SubscriptionStatus = (typeof subscriptionStatuses)[number]

export const usageFeatures = [
  "resume_analysis",
  "ai_question",
  "mock_interview",
] as const
export type UsageFeature = (typeof usageFeatures)[number]

export const UserSubscriptionTable = pgTable(
  "user_subscriptions",
  {
    id,
    userId: varchar()
      .notNull()
      .references(() => UserTable.id, { onDelete: "cascade" }),
    planId: uuid().references(() => AdminPlanTable.id, { onDelete: "set null" }),
    planKey: varchar({ length: 32 }).notNull(),
    status: varchar({ length: 24 }).notNull().default("active"),
    currentPeriodStart: timestamp({ withTimezone: true }).notNull(),
    currentPeriodEnd: timestamp({ withTimezone: true }).notNull(),
    paymentTransactionId: uuid().references(() => PaymentTransactionTable.id, {
      onDelete: "set null",
    }),
    createdAt,
    updatedAt,
  },
  table => ({
    userPeriodIdx: index("user_subscriptions_user_period_idx").on(
      table.userId,
      table.currentPeriodStart,
      table.currentPeriodEnd
    ),
  })
)

export const UserUsageEventTable = pgTable(
  "user_usage_events",
  {
    id,
    userId: varchar()
      .notNull()
      .references(() => UserTable.id, { onDelete: "cascade" }),
    subscriptionId: uuid().references(() => UserSubscriptionTable.id, {
      onDelete: "set null",
    }),
    feature: varchar({ length: 40 }).notNull(),
    amount: integer().notNull().default(1),
    createdAt,
    updatedAt,
  },
  table => ({
    userFeatureCreatedIdx: index("user_usage_events_user_feature_created_idx").on(
      table.userId,
      table.feature,
      table.createdAt
    ),
  })
)

export const userSubscriptionRelations = relations(
  UserSubscriptionTable,
  ({ one, many }) => ({
    user: one(UserTable, {
      fields: [UserSubscriptionTable.userId],
      references: [UserTable.id],
    }),
    plan: one(AdminPlanTable, {
      fields: [UserSubscriptionTable.planId],
      references: [AdminPlanTable.id],
    }),
    paymentTransaction: one(PaymentTransactionTable, {
      fields: [UserSubscriptionTable.paymentTransactionId],
      references: [PaymentTransactionTable.id],
    }),
    usageEvents: many(UserUsageEventTable),
  })
)

export const userUsageEventRelations = relations(
  UserUsageEventTable,
  ({ one }) => ({
    user: one(UserTable, {
      fields: [UserUsageEventTable.userId],
      references: [UserTable.id],
    }),
    subscription: one(UserSubscriptionTable, {
      fields: [UserUsageEventTable.subscriptionId],
      references: [UserSubscriptionTable.id],
    }),
  })
)
