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
  Lock,
  QrCode,
  ShieldCheck,
  Zap,
  Star,
} from "lucide-react"
import { motion } from "framer-motion"

import { Button } from "@/components/ui/button"
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
  badge: string
}

function formatVnd(value: number) {
  return `${value.toLocaleString("vi-VN")} ₫`
}

const steps = [
  { label: "Chọn gói", step: 1 },
  { label: "Thanh toán", step: 2 },
  { label: "Kích hoạt", step: 3 },
]

function StepProgress({ current }: { current: number }) {
  return (
    <div className="flex items-center justify-center gap-0 mb-8">
      {steps.map((s, i) => (
        <div key={s.step} className="flex items-center">
          <div className="flex flex-col items-center gap-1.5">
            <div
              className={`flex h-8 w-8 items-center justify-center rounded-full border-2 text-xs font-bold transition-all ${
                s.step < current
                  ? "border-rose-500 bg-rose-500 text-white"
                  : s.step === current
                  ? "border-rose-500 bg-rose-500/10 text-rose-400"
                  : "border-white/20 bg-white/5 text-slate-500"
              }`}
            >
              {s.step < current ? <Check className="h-4 w-4" /> : s.step}
            </div>
            <span
              className={`text-xs font-medium ${
                s.step === current ? "text-rose-400" : s.step < current ? "text-rose-500" : "text-slate-500"
              }`}
            >
              {s.label}
            </span>
          </div>
          {i < steps.length - 1 && (
            <div
              className={`h-px w-16 mx-2 mb-5 transition-all ${
                s.step < current ? "bg-rose-500" : "bg-white/10"
              }`}
            />
          )}
        </div>
      ))}
    </div>
  )
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
      name: isStart ? "NextStep Start" : "NextStep Premium",
      subtitle: isStart ? "Gói trả phí cơ bản" : "Gói đầy đủ tính năng",
      description: isStart
        ? "Phù hợp để luyện phỏng vấn và phân tích CV với giới hạn sử dụng rõ ràng."
        : "Dành cho người cần luyện tập chuyên sâu với nhiều tính năng AI hơn.",
      price: resolvedPrice,
      priceLabel: formatVnd(resolvedPrice),
      billingLabel: billing === "annual" ? "Thanh toán năm" : "Thanh toán tháng",
      badge: isStart ? "Phổ biến nhất" : "Nổi bật",
      features: isStart
        ? [
            "Phân tích CV nâng cao",
            "Luyện phỏng vấn AI theo vị trí ứng tuyển",
            "Lưu lịch sử kết quả",
            "100 lượt sử dụng/tháng",
          ]
        : [
            "Mở đầy đủ tính năng trả phí",
            "Nhiều lượt luyện phỏng vấn và tạo câu hỏi hơn",
            "Ưu tiên trải nghiệm tính năng mới",
            "Mock Interview không giới hạn",
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
        throw new Error(data?.message ?? "Không tạo được link thanh toán.")
      }

      window.location.href = data.checkoutUrl
    } catch (err) {
      setError(err instanceof Error ? err.message : "Thanh toán thất bại.")
      setProcessing(false)
    }
  }

  const activationDate = new Date()
  activationDate.setDate(activationDate.getDate() + 1)
  const activationLabel = activationDate.toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  })

  return (
    <>
      <CheckoutNavbar />

      {/* Background */}
      <div className="fixed inset-0 -z-10 bg-slate-950">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-rose-600/8 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-indigo-600/6 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-rose-500/4 rounded-full blur-[100px]" />
      </div>

      <main className="min-h-screen py-10 md:py-14 text-slate-50">
        <div className="container mx-auto px-4 max-w-6xl">
          {/* Back link */}
          <div className="mb-6">
            <Link
              href="/#pricing"
              className="inline-flex items-center gap-2 text-sm text-slate-400 transition-colors hover:text-white"
            >
              <ArrowLeft className="h-4 w-4" />
              Quay lại bảng giá
            </Link>
          </div>

          {/* Step Progress */}
          <StepProgress current={2} />

          {/* Main grid */}
          <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr] items-start">

            {/* ── LEFT: Payment Details ─────────────────────── */}
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="space-y-5"
            >
              {/* Header card */}
              <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md p-6 shadow-xl">
                <div className="flex items-center gap-3 mb-1">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-rose-500/15 text-rose-400">
                    <Lock className="h-4 w-4" />
                  </div>
                  <span className="text-xs font-medium text-rose-400 tracking-wider uppercase">Kết nối bảo mật SSL</span>
                </div>
                <h1 className="text-2xl font-bold text-white mt-3">Hoàn tất thanh toán</h1>
                <p className="mt-1 text-sm text-slate-400">
                  Bạn sẽ được chuyển đến trang thanh toán bảo mật của payOS để hoàn tất giao dịch.
                </p>
              </div>

              {/* Payment method */}
              <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md p-6 shadow-xl">
                <div className="mb-4 text-sm font-semibold text-slate-300">Phương thức thanh toán</div>
                <button
                  type="button"
                  className="grid w-full gap-4 rounded-xl border border-rose-500/40 bg-rose-500/5 p-4 text-left ring-1 ring-rose-500/20 sm:grid-cols-[auto_1fr_auto] sm:items-center hover:bg-rose-500/10 transition-colors"
                >
                  <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/10 text-rose-400">
                    <QrCode className="h-5 w-5" />
                  </span>
                  <span>
                    <span className="block font-semibold text-white">payOS</span>
                    <span className="mt-0.5 block text-xs text-slate-400">
                      QR Napas 247, ứng dụng ngân hàng và ví điện tử
                    </span>
                  </span>
                  <span className="rounded-full bg-rose-500/20 border border-rose-500/30 px-3 py-1 text-xs font-medium text-rose-300">
                    Đang chọn
                  </span>
                </button>
              </div>

              {/* How it works */}
              <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md p-6 shadow-xl">
                <div className="flex items-start gap-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-500/15 text-indigo-400">
                    <CreditCard className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="font-semibold text-white">Quy trình thanh toán an toàn</div>
                    <p className="mt-1.5 text-sm leading-relaxed text-slate-400">
                      NextStep tạo mã đơn hàng trên server và chuyển bạn sang checkout của payOS. Sau khi thanh toán thành công, webhook đã xác minh chữ ký sẽ tự động kích hoạt gói cho tài khoản.
                    </p>
                  </div>
                </div>
              </div>

              {/* Email */}
              <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md p-6 shadow-xl">
                <div className="mb-3 text-sm font-semibold text-slate-300">Email nhận hóa đơn <span className="text-slate-500 font-normal">(tùy chọn)</span></div>
                <Input
                  value={buyerEmail}
                  onChange={event => setBuyerEmail(event.target.value)}
                  placeholder="you@email.com"
                  className="h-11 rounded-xl bg-white/5 border-white/10 text-white placeholder:text-slate-500 focus:border-rose-500/50 focus:ring-rose-500/20"
                  type="email"
                />
              </div>

              {/* Error */}
              {error != null && (
                <motion.div
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-300"
                >
                  {error}
                </motion.div>
              )}

              {/* Trust badges */}
              <div className="rounded-2xl border border-white/5 bg-white/3 p-5">
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { icon: ShieldCheck, text: "Thanh toán qua payOS bảo mật" },
                    { icon: Lock, text: "Mã hóa SSL 256-bit" },
                    { icon: CreditCard, text: "Không lưu thông tin thẻ" },
                    { icon: Zap, text: "Kích hoạt tự động" },
                  ].map(({ icon: Icon, text }) => (
                    <div key={text} className="flex items-center gap-2 text-xs text-slate-400">
                      <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-500/15">
                        <Check className="h-3 w-3 text-emerald-400" />
                      </div>
                      {text}
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>

            {/* ── RIGHT: Order Summary (sticky) ──────────────── */}
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.1 }}
              className="lg:sticky lg:top-24 space-y-5"
            >
              <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md p-6 shadow-xl">
                <div className="mb-5 text-sm font-semibold text-slate-300 uppercase tracking-wider">Tóm tắt đơn hàng</div>

                {/* Plan header */}
                <div className="flex items-start gap-4 pb-5 border-b border-white/10">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-rose-500 to-indigo-500 shadow-lg shadow-rose-500/20">
                    <Star className="h-6 w-6 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white">{product.name}</span>
                      <span className="rounded-full bg-rose-500/20 border border-rose-500/30 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-rose-300">
                        {product.badge}
                      </span>
                    </div>
                    <div className="mt-1 text-sm text-slate-400">{product.subtitle}</div>
                  </div>
                </div>

                {/* Features */}
                <ul className="mt-5 space-y-2.5">
                  {product.features.map(item => (
                    <li key={item} className="flex items-start gap-2.5 text-sm text-slate-300">
                      <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-emerald-500/15">
                        <Check className="h-2.5 w-2.5 text-emerald-400" />
                      </span>
                      {item}
                    </li>
                  ))}
                </ul>

                {/* Meta */}
                <div className="mt-5 space-y-3 rounded-xl bg-white/5 border border-white/8 p-4">
                  {[
                    { label: "Chu kỳ thanh toán", value: product.billingLabel },
                    { label: "Cổng thanh toán", value: "payOS" },
                    { label: "Kích hoạt dự kiến", value: activationLabel },
                  ].map(({ label, value }) => (
                    <div key={label} className="flex items-center justify-between text-sm">
                      <span className="text-slate-400">{label}</span>
                      <span className="font-medium text-slate-200">{value}</span>
                    </div>
                  ))}
                  <div className="h-px bg-white/10" />
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-white">Tổng thanh toán</span>
                    <span className="text-xl font-bold bg-gradient-to-r from-rose-400 to-rose-300 bg-clip-text text-transparent">
                      {product.priceLabel}
                    </span>
                  </div>
                </div>

                {/* CTA */}
                <div className="mt-5 relative group">
                  <div className="absolute -inset-0.5 bg-gradient-to-r from-rose-600 to-rose-400 rounded-xl blur opacity-50 group-hover:opacity-75 transition duration-300" />
                  <Button
                    onClick={onPay}
                    disabled={processing}
                    className="relative w-full h-12 rounded-xl bg-gradient-to-r from-rose-600 via-rose-500 to-rose-400 text-white font-semibold shadow-none border-0 hover:opacity-90 transition-opacity"
                  >
                    {processing ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Đang tạo link payOS...
                      </>
                    ) : (
                      <>
                        <ShieldCheck className="mr-2 h-4 w-4" />
                        Thanh toán với payOS
                      </>
                    )}
                  </Button>
                </div>

                <p className="mt-3 text-center text-xs text-slate-500">
                  Bằng cách nhấn thanh toán, bạn đồng ý với{" "}
                  <Link href="/" className="text-rose-400 hover:underline">Điều khoản dịch vụ</Link>
                </p>
              </div>
            </motion.div>
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
        <div className="min-h-screen bg-slate-950 flex items-center justify-center">
          <div className="text-center space-y-4">
            <Loader2 className="h-8 w-8 animate-spin text-rose-500 mx-auto" />
            <p className="text-sm text-slate-400">Đang tải trang thanh toán...</p>
          </div>
        </div>
      }
    >
      <CheckoutPageContent />
    </Suspense>
  )
}

function CheckoutNavbar() {
  return (
    <header className="sticky top-0 z-50 border-b border-white/8 bg-slate-950/70 backdrop-blur-md">
      <div className="container mx-auto px-4 max-w-6xl">
        <div className="flex h-16 items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <Image
              src="/logo.png"
              alt="NextStep logo"
              width={32}
              height={32}
              className="rounded-md object-contain"
              priority
            />
            <span className="text-lg font-bold tracking-tight text-white">NextStep</span>
          </Link>
          <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-slate-400">
            <Lock className="h-3 w-3 text-emerald-400" />
            Kết nối bảo mật
          </div>
        </div>
      </div>
    </header>
  )
}
