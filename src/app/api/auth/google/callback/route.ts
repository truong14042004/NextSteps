import { finishGoogleAuth } from "@/services/auth/lib/google"

export async function GET(request: Request) {
  return finishGoogleAuth(request)
}
