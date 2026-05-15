import Link from "next/link"
import { redirect } from "next/navigation"
import { ChevronLeft } from "lucide-react"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { getCurrentUser } from "@/services/clerk/lib/getCurrentUser"
import ChangePasswordClient from "./ChangePasswordClient"

export default async function ChangePasswordPage() {
  const { userId, user, redirectToSignIn } = await getCurrentUser({
    allData: true,
  })

  if (userId == null) redirectToSignIn()
  if (user?.role === "recruiter") redirect("/explore")

  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-md py-10">
        <div className="mb-6">
          <Link
            href="/profile"
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
          >
            <ChevronLeft className="h-4 w-4" />
            Quay lại
          </Link>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Thay đổi mật khẩu</CardTitle>
          </CardHeader>
          <CardContent>
            <ChangePasswordClient />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
