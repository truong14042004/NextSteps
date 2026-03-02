import { SignUpForm } from "@/features/auth/components/SignUpForm"

export default function SignUpPage() {
  return (
    <div className="flex min-h-screen w-full items-center justify-center p-4">
      <div className="w-full max-w-md">
        <SignUpForm />
      </div>
    </div>
  )
}
