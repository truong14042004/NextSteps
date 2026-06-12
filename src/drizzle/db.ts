import { env } from "@/data/env/server"
import { drizzle } from "drizzle-orm/node-postgres"
import { Pool } from "pg"
import * as schema from "@/drizzle/schema"

const pool = new Pool({
  connectionString: env.DATABASE_URL,
  // Kill idle connections quickly so Neon's serverless sleep doesn't leave stale sockets
  idleTimeoutMillis: 5_000,
  // Give Neon enough time to wake from sleep before timing out
  connectionTimeoutMillis: 15_000,
  // Small pool — Neon handles concurrency on its side
  max: 3,
  // Let the process exit if all connections are idle (good for serverless)
  allowExitOnIdle: true,
})


export const db = drizzle(pool, { schema })
