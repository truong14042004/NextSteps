import { Storage } from "@google-cloud/storage"

const projectId = process.env.GOOGLE_CLOUD_PROJECT_ID
const bucketName = process.env.GOOGLE_CLOUD_STORAGE_BUCKET
const serviceAccountKeyBase64 = process.env.GOOGLE_CLOUD_SERVICE_ACCOUNT_KEY_BASE64

function assertServerEnv(value: string | undefined, name: string) {
  if (!value || value.trim() === "" || value === "PASTE_BASE64_KEY_HERE") {
    throw new Error(`Missing or invalid ${name}`)
  }

  return value
}

function getServiceAccountCredentials() {
  const encodedKey = assertServerEnv(
    serviceAccountKeyBase64,
    "GOOGLE_CLOUD_SERVICE_ACCOUNT_KEY_BASE64",
  )

  try {
    return JSON.parse(Buffer.from(encodedKey, "base64").toString("utf8"))
  } catch {
    throw new Error("GOOGLE_CLOUD_SERVICE_ACCOUNT_KEY_BASE64 must be a valid base64 JSON key")
  }
}

export const googleCloudStorageBucketName = assertServerEnv(
  bucketName,
  "GOOGLE_CLOUD_STORAGE_BUCKET",
)

export const googleCloudStorage = new Storage({
  projectId: assertServerEnv(projectId, "GOOGLE_CLOUD_PROJECT_ID"),
  credentials: getServiceAccountCredentials(),
})

export const googleCloudStorageBucket = googleCloudStorage.bucket(
  googleCloudStorageBucketName,
)

export async function uploadBufferToGoogleCloudStorage(params: {
  buffer: Buffer
  contentType: string
  destination: string
  cacheControl?: string
}) {
  const file = googleCloudStorageBucket.file(params.destination)

  await file.save(params.buffer, {
    resumable: false,
    metadata: {
      contentType: params.contentType,
      cacheControl:
        params.cacheControl ?? "public, max-age=31536000, immutable",
    },
  })

  return {
    bucket: googleCloudStorageBucketName,
    path: params.destination,
    publicUrl: `https://storage.googleapis.com/${googleCloudStorageBucketName}/${params.destination}`,
  }
}

export async function createGoogleCloudStorageReadUrl(path: string) {
  const [url] = await googleCloudStorageBucket.file(path).getSignedUrl({
    version: "v4",
    action: "read",
    expires: Date.now() + 15 * 60 * 1000,
  })

  return url
}
