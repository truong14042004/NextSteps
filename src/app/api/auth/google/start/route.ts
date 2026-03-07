import { beginGoogleAuth } from "@/services/auth/lib/google"

export async function GET(request: Request) {
  return beginGoogleAuth(request)
}
