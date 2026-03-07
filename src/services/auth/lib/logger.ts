import "server-only"

type AuthLogLevel = "info" | "warn" | "error"

function writeLog(level: AuthLogLevel, event: string, meta?: Record<string, unknown>) {
  const payload = {
    at: new Date().toISOString(),
    scope: "auth",
    level,
    event,
    ...meta,
  }

  const message = JSON.stringify(payload)
  if (level === "error") {
    console.error(message)
    return
  }

  if (level === "warn") {
    console.warn(message)
    return
  }

  console.info(message)
}

export function logAuthInfo(event: string, meta?: Record<string, unknown>) {
  writeLog("info", event, meta)
}

export function logAuthWarn(event: string, meta?: Record<string, unknown>) {
  writeLog("warn", event, meta)
}

export function logAuthError(event: string, meta?: Record<string, unknown>) {
  writeLog("error", event, meta)
}
