import { config } from "dotenv"
import { defineConfig } from "drizzle-kit"

// Load .env.local file
config({ path: ".env.local" })

const {
  POSTGRES_URL,
  DATABASE_URL,
  DB_HOST = "localhost",
  DB_PORT = "5432",
  DB_USER = "postgres",
  DB_PASSWORD,
  DB_NAME = "ai_job_prep",
} = process.env

const finalUrl =
  POSTGRES_URL ??
  DATABASE_URL ??
  (DB_PASSWORD
    ? `postgres://${DB_USER}:${DB_PASSWORD}@${DB_HOST}:${DB_PORT}/${DB_NAME}`
    : undefined)

if (!finalUrl) {
  throw new Error(
    "Set POSTGRES_URL, DATABASE_URL, or DB_PASSWORD in .env.local"
  )
}

export default defineConfig({
  out: "./src/drizzle/migrations",
  schema: "./src/drizzle/schema.ts",
  dialect: "postgresql",
  dbCredentials: {
    url: finalUrl,
  },
})
