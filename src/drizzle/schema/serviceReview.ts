import { relations } from "drizzle-orm"
import { index, integer, pgTable, text, varchar } from "drizzle-orm/pg-core"

import { createdAt, id, updatedAt } from "../schemaHelpers"
import { UserTable } from "./user"

export const serviceReviewStatuses = ["pending", "published", "hidden"] as const
export type ServiceReviewStatus = (typeof serviceReviewStatuses)[number]

export const serviceReviewServiceKeys = [
  "system",
  "resume_analysis",
  "ai_question",
  "mock_interview",
] as const
export type ServiceReviewServiceKey = (typeof serviceReviewServiceKeys)[number]

export const ServiceReviewTable = pgTable(
  "service_reviews",
  {
    id,
    userId: varchar()
      .notNull()
      .references(() => UserTable.id, { onDelete: "cascade" }),
    serviceKey: varchar({ length: 40 }).notNull().default("system"),
    rating: integer().notNull(),
    comment: text(),
    status: varchar({ length: 24 }).notNull().default("pending"),
    createdAt,
    updatedAt,
  },
  table => ({
    userCreatedIdx: index("service_reviews_user_created_idx").on(
      table.userId,
      table.createdAt
    ),
    statusCreatedIdx: index("service_reviews_status_created_idx").on(
      table.status,
      table.createdAt
    ),
  })
)

export const serviceReviewRelations = relations(
  ServiceReviewTable,
  ({ one }) => ({
    user: one(UserTable, {
      fields: [ServiceReviewTable.userId],
      references: [UserTable.id],
    }),
  })
)
