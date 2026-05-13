import { randomUUID } from "crypto"
import { NextRequest, NextResponse } from "next/server"
import { uploadBufferToGoogleCloudStorage } from "@/lib/google-cloud-storage"

const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024

const ALLOWED_IMAGE_TYPES = new Map([
  ["image/jpeg", "jpg"],
  ["image/png", "png"],
  ["image/webp", "webp"],
  ["image/gif", "gif"],
])

function createSafeFileName(originalName: string, extension: string) {
  const baseName = originalName
    .replace(/\.[^/.]+$/, "")
    .toLowerCase()
    .replace(/[^a-z0-9-_]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48)

  return `${baseName || "image"}-${randomUUID()}.${extension}`
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get("file")
    const folder = formData.get("folder")

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "File is required" }, { status: 400 })
    }

    const extension = ALLOWED_IMAGE_TYPES.get(file.type)

    if (!extension) {
      return NextResponse.json(
        { error: "Only JPEG, PNG, WebP, or GIF images are allowed" },
        { status: 400 },
      )
    }

    if (file.size > MAX_IMAGE_SIZE_BYTES) {
      return NextResponse.json(
        { error: "Image size must be less than 5MB" },
        { status: 400 },
      )
    }

    const safeFolder =
      typeof folder === "string" && folder.trim() !== ""
        ? folder
            .toLowerCase()
            .replace(/[^a-z0-9-_/]+/g, "-")
            .replace(/^\/+|\/+$/g, "")
        : "images"

    const fileName = createSafeFileName(file.name, extension)
    const destination = `uploads/${safeFolder}/${new Date().getFullYear()}/${fileName}`

    const uploadedFile = await uploadBufferToGoogleCloudStorage({
      buffer: Buffer.from(await file.arrayBuffer()),
      contentType: file.type,
      destination,
    })

    return NextResponse.json(uploadedFile)
  } catch (error) {
    console.error("Google Cloud Storage image upload failed:", error)

    return NextResponse.json(
      { error: "Failed to upload image" },
      { status: 500 },
    )
  }
}
