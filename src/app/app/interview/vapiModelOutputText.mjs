export function extractModelOutputText(value) {
  if (typeof value === "string") return value

  if (Array.isArray(value)) {
    return value.map(extractModelOutputText).join("")
  }

  if (value == null || typeof value !== "object") return ""

  const payload = value
  const keys = [
    "text",
    "content",
    "delta",
    "token",
    "output",
    "message",
    "data",
  ]

  for (const key of keys) {
    const text = extractModelOutputText(payload[key])
    if (text) return text
  }

  return ""
}

export function mergeModelOutputText(previousText, nextText) {
  const previous = String(previousText ?? "")
  const next = String(nextText ?? "")

  if (!next) return previous
  if (!previous) return next
  if (next.startsWith(previous)) return next
  if (previous.endsWith(next)) return previous

  return `${previous}${next}`
}
