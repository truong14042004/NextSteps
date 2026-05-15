import { NextRequest, NextResponse } from "next/server"

import { createGoogleCloudStorageReadUrl } from "@/lib/google-cloud-storage"

function isAllowedAvatarPath(path: string) {
  return (
    path.startsWith("uploads/avatars/") &&
    !path.includes("..") &&
    !path.includes("\\")
  )
}

export async function GET(request: NextRequest) {
  const path = request.nextUrl.searchParams.get("path")?.trim()

  if (!path || !isAllowedAvatarPath(path)) {
    return NextResponse.json({ message: "Invalid image path" }, { status: 400 })
  }

  try {
    const url = await createGoogleCloudStorageReadUrl(path)
    return NextResponse.redirect(url)
  } catch (error) {
    console.error("Create avatar read URL failed:", error)
    return NextResponse.json(
      { message: "Cannot load image" },
      { status: 500 }
    )
  }
}
