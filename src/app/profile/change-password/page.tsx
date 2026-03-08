import Link from "next/link"
import { ChevronLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import ChangePasswordClient from "./ChangePasswordClient"

export default function ChangePasswordPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-md py-10">
        <div className="mb-6">
          <Link href="/profile" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
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
