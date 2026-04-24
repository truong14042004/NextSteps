"use client"

import { Suspense, useMemo, useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import {
  ArrowLeft,
  Check,
  CreditCard,
  Loader2,
  QrCode,
  ShieldCheck,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"

type CheckoutProduct = {
  planKey: string
  name: string
  subtitle: string
  description: string
  price: number
  priceLabel: string
  billingLabel: string
  features: string[]
}

function formatVnd(value: number) {
  return `${value.toLocaleString("vi-VN")} VND`
}

function CheckoutPageContent() {
  const searchParams = useSearchParams()
  const planKey = searchParams.get("plan") ?? "premium"
  const billing = searchParams.get("billing") ?? searchParams.get("type") ?? "monthly"
  const price = Number(searchParams.get("price"))

  const [buyerEmail, setBuyerEmail] = useState("")
  const [processing, setProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const product = useMemo<CheckoutProduct>(() => {
    const fallbackPrice = planKey === "start" ? 399000 : 799000
    const resolvedPrice = Number.isFinite(price) && price > 0 ? price : fallbackPrice
    const isStart = planKey === "start"

    return {
      planKey,
      name: isStart ? "NextSteps Start" : "NextSteps Premium",
      subtitle: isStart ? "Goi tra phi co ban" : "Goi day du tinh nang",
      description: isStart
        ? "Phu hop de luyen phong van va phan tich CV voi gioi han su dung ro rang."
        : "Danh cho nguoi can luyen tap chuyen sau voi nhieu tinh nang AI hon.",
      price: resolvedPrice,
      priceLabel: formatVnd(resolvedPrice),
      billingLabel: billing === "annual" ? "Thanh toan nam" : "Thanh toan thang",
      features: isStart
        ? [
            "Phan tich CV nang cao",
            "Luyen phong van AI theo vi tri ung tuyen",
            "Luu lich su ket qua",
          ]
        : [
            "Mo day du tinh nang tra phi",
            "Nhieu luot luyen phong van va tao cau hoi hon",
            "Uu tien trai nghiem tinh nang moi",
          ],
    }
  }, [billing, planKey, price])

  async function onPay() {
    setProcessing(true)
    setError(null)

    try {
      const response = await fetch("/api/payments/payos/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          planKey: product.planKey,
          buyerEmail,
        }),
      })
      const data = await response.json().catch(() => null)

      if (response.status === 401) {
        window.location.href = `/sign-in?redirect_url=${encodeURIComponent(
          window.location.pathname + window.location.search
        )}`
        return
      }

      if (!response.ok || typeof data?.checkoutUrl !== "string") {
        throw new Error(data?.message ?? "Khong tao duoc link thanh toan.")
      }

      window.location.href = data.checkoutUrl
    } catch (err) {
      setError(err instanceof Error ? err.message : "Thanh toan that bai.")
      setProcessing(false)
    }
  }

  return (
    <>
      <CheckoutNavbar />
      <main className="min-h-screen bg-background py-10 md:py-14">
        <div className="container mx-auto px-4">
          <div className="mx-auto mb-6 max-w-6xl">
            <Link
              href="/#pricing"
              className="inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              <ArrowLeft className="h-4 w-4" />
              Quay lai bang gia
            </Link>
          </div>

          <div className="mx-auto grid max-w-6xl gap-6 lg:grid-cols-[1.15fr_0.85fr]">
            <Card className="rounded-3xl border bg-card/70 shadow-sm">
              <CardHeader className="border-b bg-background/40 px-6 py-6 md:px-8">
                <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
                  <div>
                    <div className="inline-flex items-center gap-2 rounded-full border bg-background px-3 py-1 text-xs text-muted-foreground shadow-sm">
                      <ShieldCheck className="h-3.5 w-3.5 text-primary" />
                      Thanh toan qua payOS
                    </div>
                    <CardTitle className="mt-4 text-2xl md:text-3xl">
                      Hoan tat thanh toan
                    </CardTitle>
                    <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground md:text-base">
                      He thong se tao link thanh toan payOS theo gia goi dang
                      duoc cau hinh trong admin. Gia tren client chi dung de hien
                      thi, server se kiem tra lai truoc khi tao don.
                    </p>
                  </div>

                  <div className="rounded-2xl border bg-background px-4 py-3 text-left md:min-w-[220px] md:text-right">
                    <div className="text-xs text-muted-foreground">Tong thanh toan</div>
                    <div className="mt-1 text-2xl font-bold text-primary">
                      {product.priceLabel}
                    </div>
                    <div className="mt-1 text-xs text-muted-foreground">
                      {product.billingLabel}
                    </div>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-6 px-6 py-6 md:px-8">
                <div>
                  <div className="mb-3 text-sm font-medium">
                    Phuong thuc thanh toan
                  </div>
                  <button
                    type="button"
                    className="grid w-full gap-4 rounded-3xl border border-primary bg-primary/5 p-5 text-left ring-2 ring-primary/20 sm:grid-cols-[auto_1fr_auto] sm:items-center"
                  >
                    <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-background text-primary">
                      <QrCode className="h-6 w-6" />
                    </span>
                    <span>
                      <span className="block font-medium">payOS</span>
                      <span className="mt-1 block text-sm text-muted-foreground">
                        QR Napas 247, ung dung ngan hang va vi dien tu ho tro
                        qua trang thanh toan payOS.
                      </span>
                    </span>
                    <span className="rounded-full bg-primary px-3 py-1 text-xs font-medium text-primary-foreground">
                      Dang chon
                    </span>
                  </button>
                </div>

                <div className="rounded-3xl border bg-background/70 p-5 md:p-6">
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                      <CreditCard className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="font-medium">Redirect sang payOS Checkout</div>
                      <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                        Khi bam thanh toan, NextSteps se tao ma don hang tren
                        server va chuyen ban sang trang checkout cua payOS. Sau
                        khi thanh toan thanh cong, webhook da xac minh chu ky se
                        kich hoat goi cho tai khoan.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="rounded-3xl border bg-background/70 p-5">
                  <div className="mb-3 text-sm font-medium">Email nhan hoa don</div>
                  <Input
                    value={buyerEmail}
                    onChange={event => setBuyerEmail(event.target.value)}
                    placeholder="you@email.com"
                    className="h-11 rounded-2xl"
                    type="email"
                  />
                </div>

                {error != null ? (
                  <div className="rounded-2xl border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
                    {error}
                  </div>
                ) : null}
              </CardContent>

              <CardFooter className="border-t bg-background/30 px-6 py-4 text-xs text-muted-foreground md:px-8">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-primary" />
                  Khong luu thong tin the. Ket qua thanh toan duoc xac thuc bang
                  webhook payOS tren server.
                </div>
              </CardFooter>
            </Card>

            <Card className="rounded-3xl border bg-card/70 shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg">Tom tat don hang</CardTitle>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="rounded-2xl border bg-background/70 p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="font-medium">{product.name}</div>
                      <div className="mt-1 text-sm text-muted-foreground">
                        {product.subtitle}
                      </div>
                    </div>
                    <div className="text-right font-semibold text-primary">
                      {product.priceLabel}
                    </div>
                  </div>

                  <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                    {product.description}
                  </p>

                  <ul className="mt-4 space-y-2">
                    {product.features.map(item => (
                      <li
                        key={item}
                        className="flex items-start gap-2 text-sm text-muted-foreground"
                      >
                        <span className="mt-1 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                          <Check className="h-3.5 w-3.5" />
                        </span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="rounded-2xl border bg-background/70 p-4">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Goi da chon</span>
                      <span className="font-medium">{product.subtitle}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Cong thanh toan</span>
                      <span className="font-medium">payOS</span>
                    </div>
                    <div className="h-px bg-border" />
                    <div className="flex items-center justify-between">
                      <span className="font-medium">Tong thanh toan</span>
                      <span className="text-lg font-bold text-primary">
                        {formatVnd(product.price)}
                      </span>
                    </div>
                  </div>
                </div>

                <Button
                  onClick={onPay}
                  disabled={processing}
                  className="h-12 w-full rounded-2xl bg-gradient-to-r from-red-600 via-red-500 to-rose-500 text-white shadow-lg shadow-red-500/25"
                >
                  {processing ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Dang tao link payOS...
                    </>
                  ) : (
                    <>
                      Thanh toan voi payOS
                      <Check className="ml-2 h-4 w-4" />
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </>
  )
}

export default function CheckoutPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-background py-10 md:py-14">
          <div className="container mx-auto px-4">
            <div className="mx-auto max-w-3xl rounded-3xl border bg-card/70 p-8 text-center shadow-sm">
              <p className="text-sm text-muted-foreground">Dang tai trang thanh toan...</p>
            </div>
          </div>
        </main>
      }
    >
      <CheckoutPageContent />
    </Suspense>
  )
}

function CheckoutNavbar() {
  return (
    <header className="sticky top-0 z-50 border-b bg-background/70 backdrop-blur-md">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center">
          <Link href="/" className="flex items-center gap-3">
            <Image
              src="/logo.png"
              alt="NextStep logo"
              width={36}
              height={36}
              className="rounded-md object-contain"
              priority
            />
            <span className="text-lg font-semibold tracking-tight">NextStep</span>
          </Link>
        </div>
      </div>
    </header>
  )
}
