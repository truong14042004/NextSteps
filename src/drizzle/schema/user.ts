import { pgEnum, pgTable, varchar } from "drizzle-orm/pg-core"
import { createdAt, updatedAt } from "../schemaHelpers"
import { relations } from "drizzle-orm/relations"
import { JobInfoTable } from "./jobInfo"
import {
  ExploreCommentTable,
  ExplorePostTable,
  RecruiterRequestTable,
} from "./explore"

export const userRoles = ["user", "pro", "recruiter", "admin"] as const
export type UserRole = (typeof userRoles)[number]
export const userRoleEnum = pgEnum("users_role", userRoles)
export const userStatuses = ["active", "deleted"] as const
export type UserStatus = (typeof userStatuses)[number]

export const UserTable = pgTable("users", {
  id: varchar().primaryKey(),
  name: varchar().notNull(),
  email: varchar().notNull().unique(),
  imageUrl: varchar().notNull(),
  role: userRoleEnum().notNull().default("user"),
  status: varchar({ length: 24 }).notNull().default("active"),
  createdAt,
  updatedAt,
})

export const userRelations = relations(UserTable, ({ many }) => ({
  jobInfos: many(JobInfoTable),
  explorePosts: many(ExplorePostTable, { relationName: "explorePostAuthor" }),
  exploreComments: many(ExploreCommentTable, {
    relationName: "exploreCommentAuthor",
  }),
  recruiterRequests: many(RecruiterRequestTable, {
    relationName: "recruiterRequestUser",
  }),
  reviewedExplorePosts: many(ExplorePostTable, {
    relationName: "explorePostReviewer",
  }),
  reviewedRecruiterRequests: many(RecruiterRequestTable, {
    relationName: "recruiterRequestReviewer",
  }),
}))
