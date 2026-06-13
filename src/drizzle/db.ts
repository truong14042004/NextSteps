import { env } from "@/data/env/server"
import { drizzle } from "drizzle-orm/node-postgres"
import { Pool } from "pg"
import * as schema from "@/drizzle/schema"

const pool = new Pool({
  connectionString: env.DATABASE_URL,
  // Kill idle connections quickly so Neon's serverless sleep doesn't leave stale sockets
  idleTimeoutMillis: 5_000,
  // Give Neon enough time to wake from cold start before timing out
  connectionTimeoutMillis: 20_000,
  // Small pool — Neon handles concurrency on its side
  max: 3,
  // Let the process exit if all connections are idle (good for serverless)
  allowExitOnIdle: true,
})

// Enable TCP keepalives on every new client so the OS detects and evicts
// dead sockets before pg tries to reuse them after a Neon serverless sleep.
pool.on("connect", (client) => {
  client.query("SET statement_timeout = '30s'").catch(() => {})
  // @ts-expect-error – underlying socket is a net.Socket
  const socket = client.connection?.stream
  if (socket?.setKeepAlive) {
    socket.setKeepAlive(true, 10_000) // send keepalive probe every 10 s
  }
})

// Prevent unhandled-rejection crashes when an idle client is killed by Neon.
// The pool will remove the dead client automatically after this fires.
pool.on("error", (err) => {
  console.warn("[db pool] idle client error (Neon wake-up):", err.message)
})

export const db = drizzle(pool, { schema })
