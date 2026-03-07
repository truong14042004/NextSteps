import { OtpAuthForm } from "@/features/auth/components/OtpAuthForm"

export default function SignInPage() {
  return (
    <div className="flex min-h-screen w-full items-center justify-center p-4">
      <div className="w-full max-w-md">
        <OtpAuthForm mode="sign_in" />
      </div>
    </div>
  )
}
