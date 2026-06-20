import { relations } from "drizzle-orm"
import { pgEnum, pgTable, text, timestamp, uuid, varchar } from "drizzle-orm/pg-core"

import { createdAt, id, updatedAt } from "../schemaHelpers"
import { UserTable } from "./user"

export const explorePostTypes = ["job_post", "cv_showcase"] as const
export type ExplorePostType = (typeof explorePostTypes)[number]
export const explorePostTypeEnum = pgEnum("explore_post_type", explorePostTypes)

export const explorePostStatuses = [
  "pending",
  "published",
  "rejected",
  "hidden",
  "deleted",
] as const
export type ExplorePostStatus = (typeof explorePostStatuses)[number]
export const explorePostStatusEnum = pgEnum(
  "explore_post_status",
  explorePostStatuses
)

export const exploreCommentStatuses = ["published", "hidden", "deleted"] as const
export type ExploreCommentStatus = (typeof exploreCommentStatuses)[number]
export const exploreCommentStatusEnum = pgEnum(
  "explore_comment_status",
  exploreCommentStatuses
)

export const recruiterRequestStatuses = [
  "pending",
  "approved",
  "rejected",
  "cancelled",
] as const
export type RecruiterRequestStatus = (typeof recruiterRequestStatuses)[number]
export const recruiterRequestStatusEnum = pgEnum(
  "recruiter_request_status",
  recruiterRequestStatuses
)

export const jobApplicationStatuses = [
  "pending",
  "reviewing",
  "accepted",
  "rejected",
  "withdrawn",
] as const
export type JobApplicationStatus = (typeof jobApplicationStatuses)[number]
export const jobApplicationStatusEnum = pgEnum(
  "job_application_status",
  jobApplicationStatuses
)

export const ExplorePostTable = pgTable("explore_posts", {
  id,
  authorId: varchar()
    .references(() => UserTable.id, { onDelete: "cascade" })
    .notNull(),
  type: explorePostTypeEnum().notNull(),
  status: explorePostStatusEnum().notNull().default("pending"),
  title: varchar({ length: 180 }).notNull(),
  content: text().notNull(),
  companyName: varchar({ length: 160 }),
  positionTitle: varchar({ length: 160 }),
  location: varchar({ length: 160 }),
  salaryRange: varchar({ length: 120 }),
  skills: text(),
  cvUrl: varchar({ length: 1024 }),
  cvFileName: varchar({ length: 255 }),
  rejectionReason: text(),
  reviewedById: varchar().references(() => UserTable.id, { onDelete: "set null" }),
  reviewedAt: timestamp({ withTimezone: true }),
  createdAt,
  updatedAt,
})

export const ExploreCommentTable = pgTable("explore_comments", {
  id,
  postId: uuid()
    .references(() => ExplorePostTable.id, { onDelete: "cascade" })
    .notNull(),
  authorId: varchar()
    .references(() => UserTable.id, { onDelete: "cascade" })
    .notNull(),
  content: text().notNull(),
  status: exploreCommentStatusEnum().notNull().default("published"),
  createdAt,
  updatedAt,
})

export const RecruiterRequestTable = pgTable("recruiter_requests", {
  id,
  userId: varchar()
    .references(() => UserTable.id, { onDelete: "cascade" })
    .notNull(),
  companyName: varchar({ length: 160 }).notNull(),
  companyWebsite: varchar({ length: 255 }),
  businessEmail: varchar({ length: 255 }),
  position: varchar({ length: 120 }).notNull(),
  reason: text().notNull(),
  status: recruiterRequestStatusEnum().notNull().default("pending"),
  adminNote: text(),
  reviewedById: varchar().references(() => UserTable.id, { onDelete: "set null" }),
  reviewedAt: timestamp({ withTimezone: true }),
  createdAt,
  updatedAt,
})

export const explorePostRelations = relations(ExplorePostTable, ({ one, many }) => ({
  author: one(UserTable, {
    fields: [ExplorePostTable.authorId],
    references: [UserTable.id],
    relationName: "explorePostAuthor",
  }),
  reviewer: one(UserTable, {
    fields: [ExplorePostTable.reviewedById],
    references: [UserTable.id],
    relationName: "explorePostReviewer",
  }),
  comments: many(ExploreCommentTable),
  applications: many(JobApplicationTable),
}))

export const exploreCommentRelations = relations(ExploreCommentTable, ({ one }) => ({
  post: one(ExplorePostTable, {
    fields: [ExploreCommentTable.postId],
    references: [ExplorePostTable.id],
  }),
  author: one(UserTable, {
    fields: [ExploreCommentTable.authorId],
    references: [UserTable.id],
    relationName: "exploreCommentAuthor",
  }),
}))

export const recruiterRequestRelations = relations(
  RecruiterRequestTable,
  ({ one }) => ({
    user: one(UserTable, {
      fields: [RecruiterRequestTable.userId],
      references: [UserTable.id],
      relationName: "recruiterRequestUser",
    }),
    reviewer: one(UserTable, {
      fields: [RecruiterRequestTable.reviewedById],
      references: [UserTable.id],
      relationName: "recruiterRequestReviewer",
    }),
  })
)

export const JobApplicationTable = pgTable("job_applications", {
  id,
  postId: uuid()
    .references(() => ExplorePostTable.id, { onDelete: "cascade" })
    .notNull(),
  applicantId: varchar()
    .references(() => UserTable.id, { onDelete: "cascade" })
    .notNull(),
  status: jobApplicationStatusEnum().notNull().default("pending"),
  fullName: varchar({ length: 160 }).notNull(),
  email: varchar({ length: 255 }),
  phone: varchar({ length: 40 }),
  coverLetter: text(),
  cvUrl: varchar({ length: 1024 }).notNull(),
  cvFileName: varchar({ length: 255 }).notNull(),
  recruiterNote: text(),
  createdAt,
  updatedAt,
})

export const jobApplicationRelations = relations(
  JobApplicationTable,
  ({ one }) => ({
    post: one(ExplorePostTable, {
      fields: [JobApplicationTable.postId],
      references: [ExplorePostTable.id],
    }),
    applicant: one(UserTable, {
      fields: [JobApplicationTable.applicantId],
      references: [UserTable.id],
      relationName: "jobApplicationApplicant",
    }),
  })
)
