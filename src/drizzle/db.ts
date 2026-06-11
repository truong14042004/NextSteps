import { env } from "@/data/env/server"
import { drizzle } from "drizzle-orm/node-postgres"
import { Pool } from "pg"
import * as schema from "@/drizzle/schema"

const pool = new Pool({
  connectionString: env.DATABASE_URL,
  // Recycle idle connections before Neon's serverless instance suspends them
  idleTimeoutMillis: 10_000,
  // Fail fast if the DB is unreachable instead of hanging
  connectionTimeoutMillis: 10_000,
  // Keep a small pool; Neon handles concurrency on its side
  max: 5,
})

export const db = drizzle(pool, { schema })
