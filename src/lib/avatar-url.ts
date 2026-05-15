const GOOGLE_STORAGE_HOST = "storage.googleapis.com"
const IMAGE_READ_PATH = "/api/uploads/image/read"

function getStorageObjectPath(url: URL) {
  if (url.hostname === GOOGLE_STORAGE_HOST) {
    const [, , ...objectParts] = url.pathname.split("/")
    return objectParts.join("/")
  }

  if (url.hostname.endsWith(`.${GOOGLE_STORAGE_HOST}`)) {
    return url.pathname.replace(/^\/+/, "")
  }

  return null
}

export function getAvatarImageSrc(imageUrl: string | null | undefined) {
  const value = imageUrl?.trim()

  if (!value) return ""
  if (value.startsWith(IMAGE_READ_PATH)) return value
  if (value.startsWith("uploads/avatars/")) {
    return `${IMAGE_READ_PATH}?path=${encodeURIComponent(value)}`
  }

  try {
    const url = new URL(value)
    const path = getStorageObjectPath(url)

    if (path?.startsWith("uploads/avatars/")) {
      return `${IMAGE_READ_PATH}?path=${encodeURIComponent(path)}`
    }
  } catch {
    return value
  }

  return value
}
