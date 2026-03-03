import pg from "pg"
import { config } from "dotenv"

config({ path: ".env.local" })

const connectionString = process.env.POSTGRES_URL ?? process.env.DATABASE_URL
if (!connectionString) {
  throw new Error("Set POSTGRES_URL or DATABASE_URL in .env.local")
}

const client = new pg.Client({ connectionString })
await client.connect()
await client.query('ALTER TABLE interviews ADD COLUMN IF NOT EXISTS "vapiTranscript" text')
console.log("Migration applied: vapiTranscript column added")
await client.end()
