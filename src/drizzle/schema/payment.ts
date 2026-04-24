import { relations } from "drizzle-orm"
import {
  bigint,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from "drizzle-orm/pg-core"

import { createdAt, id, updatedAt } from "../schemaHelpers"
import { AdminPlanTable } from "./plan"
import { UserTable } from "./user"

export const paymentStatuses = [
  "pending",
  "paid",
  "cancelled",
  "expired",
  "failed",
] as const

export type PaymentStatus = (typeof paymentStatuses)[number]

export const PaymentTransactionTable = pgTable(
  "payment_transactions",
  {
    id,
    userId: varchar()
      .notNull()
      .references(() => UserTable.id, { onDelete: "cascade" }),
    planId: uuid().references(() => AdminPlanTable.id, { onDelete: "set null" }),
    planKey: varchar({ length: 32 }).notNull(),
    orderCode: bigint({ mode: "number" }).notNull(),
    paymentLinkId: varchar({ length: 128 }),
    amount: integer().notNull(),
    currency: varchar({ length: 8 }).notNull().default("VND"),
    status: varchar({ length: 24 }).notNull().default("pending"),
    checkoutUrl: text(),
    qrCode: text(),
    providerPayload: jsonb(),
    paidAt: timestamp({ withTimezone: true }),
    createdAt,
    updatedAt,
  },
  table => ({
    orderCodeUniqueIdx: uniqueIndex("payment_transactions_order_code_unique").on(
      table.orderCode
    ),
  })
)

export const paymentTransactionRelations = relations(
  PaymentTransactionTable,
  ({ one }) => ({
    user: one(UserTable, {
      fields: [PaymentTransactionTable.userId],
      references: [UserTable.id],
    }),
    plan: one(AdminPlanTable, {
      fields: [PaymentTransactionTable.planId],
      references: [AdminPlanTable.id],
    }),
  })
)
