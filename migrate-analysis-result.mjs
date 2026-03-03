import pg from "pg"
import { config } from "dotenv"

config({ path: ".env.local" })

const connectionString = process.env.POSTGRES_URL ?? process.env.DATABASE_URL
if (!connectionString) {
  throw new Error("Set POSTGRES_URL or DATABASE_URL in .env.local")
}

const client = new pg.Client({ connectionString })
await client.connect()
await client.query('ALTER TABLE "job_info" ADD COLUMN IF NOT EXISTS "analysisResult" text')
console.log("Migration applied: analysisResult column added to job_info")
await client.end()
