import { randomUUID } from "crypto"
import { NextRequest, NextResponse } from "next/server"

import { uploadBufferToGoogleCloudStorage } from "@/lib/google-cloud-storage"
import { getCurrentUser } from "@/services/clerk/lib/getCurrentUser"

const MAX_CV_SIZE_BYTES = 10 * 1024 * 1024

const ALLOWED_CV_TYPES = new Map([
  ["application/pdf", "pdf"],
  ["application/msword", "doc"],
  [
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "docx",
  ],
  ["text/plain", "txt"],
])

function createSafeFileName(originalName: string, extension: string) {
  const baseName = originalName
    .replace(/\.[^/.]+$/, "")
    .toLowerCase()
    .replace(/[^a-z0-9-_]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48)

  return `${baseName || "cv"}-${randomUUID()}.${extension}`
}

export async function POST(request: NextRequest) {
  try {
    const { userId } = await getCurrentUser()

    if (userId == null) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get("file")

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "File is required" }, { status: 400 })
    }

    const extension = ALLOWED_CV_TYPES.get(file.type)

    if (!extension) {
      return NextResponse.json(
        { error: "Only PDF, DOC, DOCX, or TXT files are allowed" },
        { status: 400 }
      )
    }

    if (file.size > MAX_CV_SIZE_BYTES) {
      return NextResponse.json(
        { error: "CV size must be less than 10MB" },
        { status: 400 }
      )
    }

    const fileName = createSafeFileName(file.name, extension)
    const destination = `uploads/explore-cvs/${userId}/${new Date().getFullYear()}/${fileName}`

    const uploadedFile = await uploadBufferToGoogleCloudStorage({
      buffer: Buffer.from(await file.arrayBuffer()),
      contentType: file.type,
      destination,
    })

    return NextResponse.json({ ...uploadedFile, fileName: file.name })
  } catch (error) {
    console.error("Explore CV upload failed:", error)

    return NextResponse.json({ error: "Failed to upload CV" }, { status: 500 })
  }
}
