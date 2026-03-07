import Link from "next/link"
import { ChevronLeft } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import ForgotPasswordClient from "./ForgotPasswordClient"

export default function ForgotPasswordPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="w-full max-w-md space-y-4">
        <Link href="/sign-in" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
          <ChevronLeft className="h-4 w-4" />
          Quay lại đăng nhập
        </Link>

        <Card>
          <CardHeader>
            <CardTitle>Quên mật khẩu</CardTitle>
          </CardHeader>
          <CardContent>
            <ForgotPasswordClient />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
