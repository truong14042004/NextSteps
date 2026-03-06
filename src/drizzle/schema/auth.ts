import { relations } from "drizzle-orm"
import {
  index,
  integer,
  pgEnum,
  pgTable,
  timestamp,
  uniqueIndex,
  varchar,
} from "drizzle-orm/pg-core"
import { createdAt, id, updatedAt } from "../schemaHelpers"
import { UserTable } from "./user"

export const otpPurposes = ["sign_in", "sign_up"] as const
export type OtpPurpose = (typeof otpPurposes)[number]
export const otpPurposeEnum = pgEnum("auth_otp_purpose", otpPurposes)

export const AuthOtpTable = pgTable(
  "auth_otps",
  {
    id,
    email: varchar().notNull(),
    purpose: otpPurposeEnum().notNull(),
    name: varchar(),
    firstName: varchar(),
    lastName: varchar(),
    username: varchar(),
    passwordHash: varchar(),
    codeHash: varchar().notNull(),
    attempts: integer().notNull().default(0),
    expiresAt: timestamp({ withTimezone: true }).notNull(),
    consumedAt: timestamp({ withTimezone: true }),
    createdAt,
  },
  table => ({
    emailIdx: index("auth_otps_email_idx").on(table.email),
  })
)

export const AuthSessionTable = pgTable(
  "auth_sessions",
  {
    id,
    userId: varchar()
      .notNull()
      .references(() => UserTable.id, { onDelete: "cascade" }),
    tokenHash: varchar().notNull(),
    expiresAt: timestamp({ withTimezone: true }).notNull(),
    revokedAt: timestamp({ withTimezone: true }),
    createdAt,
    updatedAt,
  },
  table => ({
    userIdIdx: index("auth_sessions_user_id_idx").on(table.userId),
    tokenHashUniqueIdx: uniqueIndex("auth_sessions_token_hash_unique").on(
      table.tokenHash
    ),
  })
)

export const AuthCredentialTable = pgTable(
  "auth_credentials",
  {
    userId: varchar()
      .primaryKey()
      .references(() => UserTable.id, { onDelete: "cascade" }),
    username: varchar().notNull(),
    passwordHash: varchar().notNull(),
    createdAt,
    updatedAt,
  },
  table => ({
    usernameUniqueIdx: uniqueIndex("auth_credentials_username_unique").on(
      table.username
    ),
  })
)

export const AuthGoogleAccountTable = pgTable(
  "auth_google_accounts",
  {
    id,
    userId: varchar()
      .notNull()
      .references(() => UserTable.id, { onDelete: "cascade" }),
    googleSub: varchar().notNull(),
    email: varchar().notNull(),
    createdAt,
    updatedAt,
  },
  table => ({
    userIdUniqueIdx: uniqueIndex("auth_google_accounts_user_id_unique").on(
      table.userId
    ),
    googleSubUniqueIdx: uniqueIndex(
      "auth_google_accounts_google_sub_unique"
    ).on(table.googleSub),
  })
)

export const authSessionRelations = relations(AuthSessionTable, ({ one }) => ({
  user: one(UserTable, {
    fields: [AuthSessionTable.userId],
    references: [UserTable.id],
  }),
}))

export const authCredentialRelations = relations(
  AuthCredentialTable,
  ({ one }) => ({
    user: one(UserTable, {
      fields: [AuthCredentialTable.userId],
      references: [UserTable.id],
    }),
  })
)

export const authGoogleAccountRelations = relations(
  AuthGoogleAccountTable,
  ({ one }) => ({
    user: one(UserTable, {
      fields: [AuthGoogleAccountTable.userId],
      references: [UserTable.id],
    }),
  })
)
