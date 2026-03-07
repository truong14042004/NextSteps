import { pgEnum, pgTable, varchar } from "drizzle-orm/pg-core"
import { createdAt, updatedAt } from "../schemaHelpers"
import { relations } from "drizzle-orm/relations"
import { JobInfoTable } from "./jobInfo"

export const userRoles = ["user", "pro", "admin"] as const
export type UserRole = (typeof userRoles)[number]
export const userRoleEnum = pgEnum("users_role", userRoles)

export const UserTable = pgTable("users", {
  id: varchar().primaryKey(),
  name: varchar().notNull(),
  email: varchar().notNull().unique(),
  imageUrl: varchar().notNull(),
  role: userRoleEnum().notNull().default("user"),
  createdAt,
  updatedAt,
})

export const userRelations = relations(UserTable, ({ many }) => ({
  jobInfos: many(JobInfoTable),
}))
