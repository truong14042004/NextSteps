import { SignUp } from "@clerk/nextjs"
import Link from "next/link"

export default function SignUpPage() {
  return (
    <div className="flex h-screen w-screen items-center justify-center">
      <div className="space-y-6">
        <SignUp signInUrl="/sign-in" />

        <div className="text-center">
          <p className="text-sm text-muted-foreground">
            Đã có tài khoản?{" "}
            <Link
              href="/sign-in"
              className="text-primary hover:underline font-medium"
            >
              Đăng nhập ngay
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
