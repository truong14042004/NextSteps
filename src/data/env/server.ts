import { createEnv } from "@t3-oss/env-nextjs"
import z from "zod"

export const env = createEnv({
  server: {
    // For production (Vercel + Neon), use POSTGRES_URL or DATABASE_URL
    DATABASE_URL: z.string().url().optional(),
    POSTGRES_URL: z.string().url().optional(),
    // For local development, use individual DB variables
    DB_PASSWORD: z.string().min(1).optional(),
    DB_HOST: z.string().min(1).optional(),
    DB_PORT: z.string().min(1).optional(),
    DB_USER: z.string().min(1).optional(),
    DB_NAME: z.string().min(1).optional(),
    ARCJET_KEY: z.string().min(1).default("placeholder"),
    CLERK_SECRET_KEY: z.string().min(1).default("placeholder"),
    AUTH_SESSION_SECRET: z.string().min(32).default("replace-this-with-32-plus-chars"),
    AUTH_OTP_SECRET: z.string().min(32).default("replace-this-with-32-plus-chars"),
    SMTP_HOST: z.string().min(1).default("smtp.gmail.com"),
    SMTP_PORT: z.coerce.number().int().positive().default(587),
    SMTP_USER: z.string().email().default("placeholder@example.com"),
    SMTP_PASS: z.string().min(1).default("placeholder"),
    SMTP_FROM: z.string().email().default("placeholder@example.com"),
    SMTP_FROM_NAME: z.string().min(1).default("NextSteps App"),
    OTP_CODE_EXPIRY_MINUTES: z.coerce.number().int().min(1).max(60).default(10),
    GOOGLE_CLIENT_ID: z.string().min(1).default("placeholder"),
    GOOGLE_CLIENT_SECRET: z.string().min(1).default("placeholder"),
    GOOGLE_REDIRECT_URI: z.string().default(""),
    HUME_API_KEY: z.string().min(1).default("placeholder"),
    HUME_SECRET_KEY: z.string().min(1).default("placeholder"),
    VAPI_PRIVATE_KEY: z.string().min(1).optional(),
    GEMINI_API_KEY: z.string().min(1).default("placeholder"),
  },
  client: {
    NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: z.string().min(1).default("placeholder"),
    NEXT_PUBLIC_CLERK_SIGN_IN_URL: z.string().default("/sign-in"),
    NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL: z.string().default("/app"),
    NEXT_PUBLIC_CLERK_SIGN_UP_FORCE_REDIRECT_URL: z.string().default("/app"),
    NEXT_PUBLIC_HUME_CONFIG_ID: z.string().default("placeholder"),
    NEXT_PUBLIC_VAPI_PUBLIC_KEY: z.string().min(1).optional(),
    NEXT_PUBLIC_VAPI_ASSISTANT_ID: z.string().min(1).optional(),
  },
  createFinalSchema: env => {
    return z.object(env).transform(val => {
      const { DB_HOST, DB_NAME, DB_PASSWORD, DB_PORT, DB_USER, DATABASE_URL, POSTGRES_URL, ...rest } = val
      const smtpUserAlias = process.env.EmailSettings__SenderEmail
      const smtpPassAlias = process.env.EmailSettings__AppPassword
      const smtpFromAlias = process.env.EmailSettings__SenderEmail
      const smtpFromNameAlias = process.env.EmailSettings__SenderName
      const otpExpiryAlias = process.env.EmailSettings__VerificationCodeExpiryMinutes
      
      // Use POSTGRES_URL (Vercel Neon), DATABASE_URL, or build from parts (local)
      const finalDatabaseUrl = POSTGRES_URL || DATABASE_URL || 
        `postgres://${DB_USER}:${DB_PASSWORD}@${DB_HOST}:${DB_PORT}/${DB_NAME}`

      const smtpUser =
        val.SMTP_USER === "placeholder@example.com" && smtpUserAlias != null
          ? smtpUserAlias
          : val.SMTP_USER
      const smtpPass =
        val.SMTP_PASS === "placeholder" && smtpPassAlias != null
          ? smtpPassAlias
          : val.SMTP_PASS
      const smtpFrom =
        val.SMTP_FROM === "placeholder@example.com" && smtpFromAlias != null
          ? smtpFromAlias
          : val.SMTP_FROM
      const smtpFromName =
        val.SMTP_FROM_NAME === "NextSteps App" && smtpFromNameAlias != null
          ? smtpFromNameAlias
          : val.SMTP_FROM_NAME
      const otpExpiryRaw = Number(otpExpiryAlias ?? val.OTP_CODE_EXPIRY_MINUTES)
      const otpExpiry =
        Number.isFinite(otpExpiryRaw) && otpExpiryRaw >= 1 && otpExpiryRaw <= 60
          ? otpExpiryRaw
          : val.OTP_CODE_EXPIRY_MINUTES
      
      return {
        ...rest,
        DATABASE_URL: finalDatabaseUrl,
        ARCJET_KEY: val.ARCJET_KEY!,
        CLERK_SECRET_KEY: val.CLERK_SECRET_KEY!,
        AUTH_SESSION_SECRET: val.AUTH_SESSION_SECRET!,
        AUTH_OTP_SECRET: val.AUTH_OTP_SECRET!,
        SMTP_HOST: val.SMTP_HOST!,
        SMTP_PORT: val.SMTP_PORT!,
        SMTP_USER: smtpUser,
        SMTP_PASS: smtpPass,
        SMTP_FROM: smtpFrom,
        SMTP_FROM_NAME: smtpFromName,
        OTP_CODE_EXPIRY_MINUTES: otpExpiry,
        GOOGLE_CLIENT_ID: val.GOOGLE_CLIENT_ID!,
        GOOGLE_CLIENT_SECRET: val.GOOGLE_CLIENT_SECRET!,
        GOOGLE_REDIRECT_URI: val.GOOGLE_REDIRECT_URI!,
        HUME_API_KEY: val.HUME_API_KEY,
        HUME_SECRET_KEY: val.HUME_SECRET_KEY,
        VAPI_PRIVATE_KEY: val.VAPI_PRIVATE_KEY,
        GEMINI_API_KEY: val.GEMINI_API_KEY!,
      }
    })
  },
  emptyStringAsUndefined: true,
  experimental__runtimeEnv: {
    NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,
    NEXT_PUBLIC_CLERK_SIGN_IN_URL: process.env.NEXT_PUBLIC_CLERK_SIGN_IN_URL,
    NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL: process.env.NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL,
    NEXT_PUBLIC_CLERK_SIGN_UP_FORCE_REDIRECT_URL: process.env.NEXT_PUBLIC_CLERK_SIGN_UP_FORCE_REDIRECT_URL,
    NEXT_PUBLIC_HUME_CONFIG_ID: process.env.NEXT_PUBLIC_HUME_CONFIG_ID,
    NEXT_PUBLIC_VAPI_PUBLIC_KEY: process.env.NEXT_PUBLIC_VAPI_PUBLIC_KEY,
    NEXT_PUBLIC_VAPI_ASSISTANT_ID: process.env.NEXT_PUBLIC_VAPI_ASSISTANT_ID,
  },
  skipValidation: !!process.env.SKIP_ENV_VALIDATION || process.env.npm_lifecycle_event === "build",
})
