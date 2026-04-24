import Link from "next/link"
import { XCircle } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

export default function CheckoutCancelPage() {
  return (
    <main className="min-h-screen bg-background px-4 py-16">
      <Card className="mx-auto max-w-xl rounded-3xl border bg-card/80 shadow-sm">
        <CardContent className="space-y-6 p-8 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-destructive/10 text-destructive">
            <XCircle className="h-7 w-7" />
          </div>

          <div>
            <h1 className="text-2xl font-semibold">Thanh toan da huy</h1>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              Giao dich chua hoan tat. Ban co the quay lai trang bang gia va tao
              thanh toan moi khi san sang.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Button asChild className="rounded-2xl">
              <Link href="/#pricing">Chon lai goi</Link>
            </Button>
            <Button asChild variant="outline" className="rounded-2xl">
              <Link href="/">Ve trang chu</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </main>
  )
}
