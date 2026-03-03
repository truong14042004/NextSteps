import { env } from "@/data/env/server"
import { getCurrentUser } from "@/services/clerk/lib/getCurrentUser"
import { fetchAccessToken } from "hume"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    const { userId } = await getCurrentUser()
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check if Hume is configured
    if (!env.HUME_API_KEY || !env.HUME_SECRET_KEY) {
      return NextResponse.json(
        { error: "Voice interview feature requires Hume AI configuration" },
        { status: 503 }
      )
    }

    const accessToken = await fetchAccessToken({
      apiKey: env.HUME_API_KEY,
      secretKey: env.HUME_SECRET_KEY,
    })

    return NextResponse.json({ accessToken })
  } catch (error) {
    console.error("Failed to fetch Hume access token:", error)
    return NextResponse.json(
      { error: "Failed to fetch access token" },
      { status: 500 }
    )
  }
}
