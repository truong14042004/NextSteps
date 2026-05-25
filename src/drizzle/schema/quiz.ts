import {
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core"
import { relations } from "drizzle-orm"
import { createdAt, id, updatedAt } from "../schemaHelpers"
import { JobInfoTable } from "./jobInfo"
import { UserTable } from "./user"

export const quizAttemptStatuses = [
  "in_progress",
  "submitted",
  "expired",
] as const
export type QuizAttemptStatus = (typeof quizAttemptStatuses)[number]
export const quizAttemptStatusEnum = pgEnum(
  "quiz_attempt_status",
  quizAttemptStatuses
)

export type QuizAnswer = {
  questionId: string
  selectedIndex: number | null
}

export const QuizTable = pgTable("quizzes", {
  id,
  jobInfoId: uuid()
    .references(() => JobInfoTable.id, { onDelete: "cascade" })
    .notNull(),
  userId: varchar()
    .references(() => UserTable.id, { onDelete: "cascade" })
    .notNull(),
  title: varchar({ length: 200 }).notNull(),
  totalQuestions: integer().notNull().default(30),
  durationSeconds: integer().notNull().default(45 * 60),
  maxAttempts: integer().notNull().default(5),
  createdAt,
  updatedAt,
})

export const QuizQuestionTable = pgTable("quiz_questions", {
  id,
  quizId: uuid()
    .references(() => QuizTable.id, { onDelete: "cascade" })
    .notNull(),
  order: integer().notNull(),
  text: text().notNull(),
  options: jsonb().$type<string[]>().notNull(),
  correctIndex: integer().notNull(),
  explanation: text().notNull(),
  createdAt,
})

export const QuizAttemptTable = pgTable("quiz_attempts", {
  id,
  quizId: uuid()
    .references(() => QuizTable.id, { onDelete: "cascade" })
    .notNull(),
  userId: varchar()
    .references(() => UserTable.id, { onDelete: "cascade" })
    .notNull(),
  status: quizAttemptStatusEnum().notNull().default("in_progress"),
  startedAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  submittedAt: timestamp({ withTimezone: true }),
  expiresAt: timestamp({ withTimezone: true }).notNull(),
  score: integer(),
  answers: jsonb().$type<QuizAnswer[]>().notNull().default([]),
  createdAt,
  updatedAt,
})

export const quizRelations = relations(QuizTable, ({ one, many }) => ({
  jobInfo: one(JobInfoTable, {
    fields: [QuizTable.jobInfoId],
    references: [JobInfoTable.id],
  }),
  user: one(UserTable, {
    fields: [QuizTable.userId],
    references: [UserTable.id],
  }),
  questions: many(QuizQuestionTable),
  attempts: many(QuizAttemptTable),
}))

export const quizQuestionRelations = relations(
  QuizQuestionTable,
  ({ one }) => ({
    quiz: one(QuizTable, {
      fields: [QuizQuestionTable.quizId],
      references: [QuizTable.id],
    }),
  })
)

export const quizAttemptRelations = relations(QuizAttemptTable, ({ one }) => ({
  quiz: one(QuizTable, {
    fields: [QuizAttemptTable.quizId],
    references: [QuizTable.id],
  }),
  user: one(UserTable, {
    fields: [QuizAttemptTable.userId],
    references: [UserTable.id],
  }),
}))
