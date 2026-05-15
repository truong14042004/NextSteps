import { OtpAuthForm } from "@/features/auth/components/OtpAuthForm"
import { getCurrentUser } from "@/services/clerk/lib/getCurrentUser"
import { redirect } from "next/navigation"

export default async function SignInPage() {
  const { userId, user } = await getCurrentUser({ allData: true })

  if (userId != null) {
    redirect(user?.role === "recruiter" ? "/explore" : "/app")
  }

  return (
    <div className="flex min-h-screen w-full items-center justify-center p-4">
      <div className="w-full max-w-md">
        <OtpAuthForm mode="sign_in" />
      </div>
    </div>
  )
}
