import { SignIn } from "@clerk/nextjs"
import Link from "next/link"

export default function SignInPage() {
  return (
    <div className="flex h-screen w-screen items-center justify-center">
      <div className="space-y-6">
        <SignIn
          signUpUrl="/sign-up"
          appearance={{
            elements: {
              footer: "hidden",
              badge: "hidden",
              footerActionLink: "hidden",
              poweredByClerkContainer: "hidden",
            },
          }}
        />
        <div className="text-center">
          <p className="text-sm text-muted-foreground">
            Chưa có tài khoản?{" "}
            <Link
              href="/sign-up"
              className="text-primary hover:underline font-medium"
            >
              Đăng ký ngay
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
