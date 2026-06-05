import { OtpAuthForm } from "@/features/auth/components/OtpAuthForm"
import { getCurrentUser } from "@/services/clerk/lib/getCurrentUser"
import { redirect } from "next/navigation"

export default async function SignUpPage() {
  const { userId, user } = await getCurrentUser({ allData: true })

  if (userId != null && user != null) {
    if (user.role === "recruiter") redirect("/explore")
    if (user.role === "admin") redirect("/admin")
    redirect("/")
  }

  return (
    <div className="flex min-h-screen w-full items-center justify-center p-4">
      <div className="w-full max-w-md">
        <OtpAuthForm mode="sign_up" />
      </div>
    </div>
  )
}
