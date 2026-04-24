"use client"

import { Suspense, useEffect, useState } from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { CheckCircle2, Loader2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

function CheckoutSuccessContent() {
  const searchParams = useSearchParams()
  const orderCode = searchParams.get("orderCode")
  const [status, setStatus] = useState("pending")

  useEffect(() => {
    if (orderCode == null) return

    let cancelled = false

    async function syncPayment() {
      const response = await fetch(`/api/payments/payos/${orderCode}`, {
        cache: "no-store",
      })
      const data = await response.json().catch(() => null)

      if (!cancelled && response.ok && data?.status != null) {
        setStatus(data.status)
      }
    }

    void syncPayment()

    return () => {
      cancelled = true
    }
  }, [orderCode])

  const isPaid = status === "paid"

  return (
    <main className="min-h-screen bg-background px-4 py-16">
      <Card className="mx-auto max-w-xl rounded-3xl border bg-card/80 shadow-sm">
        <CardContent className="space-y-6 p-8 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary">
            {isPaid ? (
              <CheckCircle2 className="h-7 w-7" />
            ) : (
              <Loader2 className="h-7 w-7 animate-spin" />
            )}
          </div>

          <div>
            <h1 className="text-2xl font-semibold">
              {isPaid ? "Thanh toan thanh cong" : "Dang xac nhan thanh toan"}
            </h1>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              {isPaid
                ? "Goi cua ban da duoc kich hoat. Ban co the quay lai ung dung de su dung tinh nang tra phi."
                : "payOS dang gui ket qua ve he thong. Neu da tru tien, webhook se tu dong kich hoat goi trong giay lat."}
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Button asChild className="rounded-2xl">
              <Link href="/app">Vao ung dung</Link>
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

export default function CheckoutSuccessPage() {
  return (
    <Suspense fallback={null}>
      <CheckoutSuccessContent />
    </Suspense>
  )
}
