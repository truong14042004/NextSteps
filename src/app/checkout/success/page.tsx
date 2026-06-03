"use client"

import { Suspense, useEffect, useRef, useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { useSearchParams } from "next/navigation"
import {
  CheckCircle2,
  Loader2,
  Download,
  Home,
  LayoutDashboard,
  Copy,
  Check,
} from "lucide-react"
import { motion, useInView, useMotionValue, useTransform, animate } from "framer-motion"

import { Button } from "@/components/ui/button"

// ── Confetti burst ────────────────────────────────────────────────────────────
function ConfettiCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const hasRun = useRef(false)

  useEffect(() => {
    if (hasRun.current) return
    hasRun.current = true
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    canvas.width = window.innerWidth
    canvas.height = window.innerHeight

    const particles: {
      x: number; y: number; vx: number; vy: number
      color: string; size: number; alpha: number; rot: number; rotV: number
    }[] = []

    const colors = ["#f43f5e", "#e11d48", "#f97316", "#facc15", "#a78bfa", "#60a5fa", "#34d399"]

    for (let i = 0; i < 120; i++) {
      particles.push({
        x: canvas.width / 2,
        y: canvas.height / 3,
        vx: (Math.random() - 0.5) * 14,
        vy: (Math.random() - 0.5) * 14 - 4,
        color: colors[Math.floor(Math.random() * colors.length)],
        size: Math.random() * 8 + 4,
        alpha: 1,
        rot: Math.random() * 360,
        rotV: (Math.random() - 0.5) * 8,
      })
    }

    let frame = 0
    const loop = () => {
      if (frame > 120) { canvas.style.display = "none"; return }
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      particles.forEach(p => {
        p.x += p.vx
        p.y += p.vy
        p.vy += 0.3
        p.alpha -= 0.012
        p.rot += p.rotV
        ctx.save()
        ctx.globalAlpha = Math.max(0, p.alpha)
        ctx.translate(p.x, p.y)
        ctx.rotate((p.rot * Math.PI) / 180)
        ctx.fillStyle = p.color
        ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.5)
        ctx.restore()
      })
      frame++
      requestAnimationFrame(loop)
    }
    loop()
  }, [])

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none fixed inset-0 z-50"
    />
  )
}

// ── Count-up amount ────────────────────────────────────────────────────────────
function CountUpAmount({ value, label }: { value: number; label: string }) {
  const ref = useRef<HTMLSpanElement>(null)
  const motionVal = useMotionValue(0)
  const rounded = useTransform(motionVal, v => {
    return `${Math.floor(v).toLocaleString("vi-VN")} ₫`
  })
  const inView = useInView(ref, { once: true })

  useEffect(() => {
    if (!inView) return
    const ctrl = animate(motionVal, value, { duration: 1.2, ease: "easeOut" })
    return () => ctrl.stop()
  }, [inView, motionVal, value])

  return (
    <div className="text-center">
      <span ref={ref} className="sr-only">{label}</span>
      <motion.span className="text-3xl font-bold text-emerald-400">
        {rounded}
      </motion.span>
    </div>
  )
}

// ── Copy button ───────────────────────────────────────────────────────────────
function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)
  function handleCopy() {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }
  return (
    <button onClick={handleCopy} className="ml-2 text-slate-500 hover:text-slate-300 transition-colors">
      {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
    </button>
  )
}

// ── Row helper ────────────────────────────────────────────────────────────────
function ReceiptRow({ label, value, mono = false, copyable = false }: {
  label: string; value: string; mono?: boolean; copyable?: boolean
}) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-dashed border-white/8 last:border-0">
      <span className="text-sm text-slate-400">{label}</span>
      <span className={`text-sm font-medium text-slate-200 flex items-center ${mono ? "font-mono text-xs tracking-wider" : ""}`}>
        {value}
        {copyable && <CopyButton text={value} />}
      </span>
    </div>
  )
}

// ── Main page content ─────────────────────────────────────────────────────────
function CheckoutSuccessContent() {
  const searchParams = useSearchParams()
  const orderCode = searchParams.get("orderCode")
  const [status, setStatus] = useState<string>("pending")
  const [paymentData, setPaymentData] = useState<Record<string, unknown> | null>(null)

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
        setPaymentData(data)
      }
    }

    void syncPayment()
    return () => { cancelled = true }
  }, [orderCode])

  const isPaid = status === "paid"
  const isPending = status === "pending"

  const now = new Date()
  const paymentTime = now.toLocaleString("vi-VN", {
    day: "2-digit", month: "2-digit", year: "numeric",
    hour: "2-digit", minute: "2-digit", second: "2-digit",
  })

  const expireDate = new Date(now)
  expireDate.setMonth(expireDate.getMonth() + 1)
  const expireLabel = expireDate.toLocaleDateString("vi-VN", {
    day: "2-digit", month: "2-digit", year: "numeric",
  })

  const amount = typeof paymentData?.amount === "number"
    ? paymentData.amount as number
    : planAmountFromCode(orderCode)

  function planAmountFromCode(_code: string | null) {
    return 399000
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50">
      {/* Background */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-slate-950" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-64 bg-emerald-500/6 blur-3xl rounded-full" />
        <div className="absolute top-24 right-1/4 w-64 h-64 bg-rose-500/5 blur-3xl rounded-full" />
      </div>

      {isPaid && <ConfettiCanvas />}

      {/* Nav */}
      <header className="border-b border-white/8 bg-slate-950/70 backdrop-blur-md">
        <div className="container mx-auto px-4 max-w-3xl">
          <div className="flex h-14 items-center">
            <Link href="/" className="flex items-center gap-2.5">
              <Image src="/logo.png" alt="NextStep" width={28} height={28} className="rounded-md object-contain" />
              <span className="text-base font-bold text-white">NextStep</span>
            </Link>
          </div>
        </div>
      </header>

      <main className="py-10 px-4">
        <div className="mx-auto max-w-lg space-y-6">

          {/* ── Success hero ───────────────────────── */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, type: "spring", bounce: 0.3 }}
            className="text-center space-y-4"
          >
            {/* Icon */}
            <div className="relative mx-auto w-fit">
              {isPaid && (
                <>
                  <motion.div
                    animate={{ scale: [1, 1.2, 1], opacity: [0.4, 0.7, 0.4] }}
                    transition={{ duration: 2.5, repeat: Infinity }}
                    className="absolute inset-0 rounded-full bg-emerald-400/20 blur-xl"
                  />
                  <motion.div
                    animate={{ scale: [1, 1.4, 1], opacity: [0.2, 0.5, 0.2] }}
                    transition={{ duration: 2.5, repeat: Infinity, delay: 0.5 }}
                    className="absolute inset-0 rounded-full bg-emerald-400/10 blur-2xl"
                  />
                </>
              )}
              <div className={`relative flex h-20 w-20 items-center justify-center rounded-full border-2 ${
                isPaid
                  ? "border-emerald-400/50 bg-emerald-400/10"
                  : "border-slate-600 bg-slate-800"
              }`}>
                {isPaid
                  ? <CheckCircle2 className="h-10 w-10 text-emerald-400" />
                  : <Loader2 className="h-10 w-10 text-slate-400 animate-spin" />
                }
              </div>
            </div>

            <div>
              <h1 className="text-2xl font-bold text-white">
                {isPaid ? "Thanh toán thành công!" : "Đang xác nhận giao dịch..."}
              </h1>
              <p className="mt-1.5 text-slate-400 text-sm">
                {isPaid
                  ? "Gói của bạn đã được kích hoạt. Cảm ơn bạn đã tin dùng NextStep."
                  : "payOS đang gửi kết quả về hệ thống. Vui lòng chờ trong giây lát."}
              </p>
            </div>

            {/* Amount display */}
            {isPaid && amount > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="inline-block rounded-2xl border border-emerald-500/20 bg-emerald-500/5 px-8 py-4"
              >
                <div className="text-xs text-slate-400 mb-1 uppercase tracking-wider">Số tiền thanh toán</div>
                <CountUpAmount value={amount} label={`${amount.toLocaleString("vi-VN")} ₫`} />
              </motion.div>
            )}
          </motion.div>

          {/* ── Receipt card ───────────────────────── */}
          {isPaid && (
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.5 }}
            >
              {/* Receipt */}
              <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md overflow-hidden shadow-2xl">
                {/* Receipt header */}
                <div className="bg-gradient-to-r from-emerald-500/15 to-teal-500/10 border-b border-white/8 px-6 py-4 flex items-center justify-between">
                  <div>
                    <div className="text-xs text-emerald-400 font-medium uppercase tracking-wider mb-0.5">Biên lai giao dịch</div>
                    <div className="text-sm font-bold text-white">Thanh toán dịch vụ NextStep</div>
                  </div>
                  <div className="flex items-center gap-1.5 rounded-full bg-emerald-500/20 border border-emerald-500/30 px-3 py-1">
                    <div className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="text-xs font-bold text-emerald-300">PAID</span>
                  </div>
                </div>

                {/* Transaction info */}
                <div className="px-6 py-2">
                  <div className="py-2 mb-1">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Thông tin giao dịch</span>
                  </div>
                  <ReceiptRow
                    label="Mã đơn hàng"
                    value={orderCode ?? "—"}
                    mono
                    copyable
                  />
                  <ReceiptRow label="Cổng thanh toán" value="payOS" />
                  <ReceiptRow label="Thời gian thanh toán" value={paymentTime} />
                  <ReceiptRow label="Trạng thái" value="✓ Thành công" />
                </div>

                {/* Dotted separator */}
                <div className="relative mx-6">
                  <div className="absolute -left-6 -top-3 h-6 w-6 rounded-full bg-slate-950 border-r border-white/10" />
                  <div className="absolute -right-6 -top-3 h-6 w-6 rounded-full bg-slate-950 border-l border-white/10" />
                  <div className="border-t border-dashed border-white/15 my-1" />
                </div>

                {/* Account info */}
                <div className="px-6 py-2">
                  <div className="py-2 mb-1">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Trạng thái tài khoản</span>
                  </div>
                  <ReceiptRow label="Gói đã kích hoạt" value="Premium / Start" />
                  <ReceiptRow label="Ngày kích hoạt" value={new Date().toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" })} />
                  <ReceiptRow label="Ngày hết hạn" value={expireLabel} />
                </div>

                {/* Footer */}
                <div className="border-t border-white/8 bg-white/3 px-6 py-3 text-center">
                  <p className="text-[11px] text-slate-500">
                    Hóa đơn này được tự động tạo bởi hệ thống NextStep • Lưu lại để tham khảo
                  </p>
                </div>
              </div>
            </motion.div>
          )}

          {/* Pending skeleton */}
          {isPending && (
            <div className="rounded-2xl border border-white/10 bg-white/5 p-6 space-y-3 animate-pulse">
              {[140, 100, 120, 90].map(w => (
                <div key={w} className="flex justify-between items-center">
                  <div className="h-3 w-24 bg-white/10 rounded" />
                  <div className={`h-3 bg-white/10 rounded`} style={{ width: w / 2 }} />
                </div>
              ))}
            </div>
          )}

          {/* ── Action buttons ───────────────────────── */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.4 }}
            className="space-y-3"
          >
            <div className="relative group">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-rose-600 to-rose-400 rounded-xl blur opacity-40 group-hover:opacity-70 transition duration-300" />
              <Button asChild className="relative w-full h-12 rounded-xl bg-gradient-to-r from-rose-600 to-rose-500 text-white font-semibold border-0 shadow-none hover:opacity-90 transition-opacity">
                <Link href="/app">
                  <LayoutDashboard className="mr-2 h-4 w-4" />
                  Vào Dashboard
                </Link>
              </Button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Button
                variant="outline"
                onClick={() => window.print()}
                className="h-11 rounded-xl border-white/15 bg-white/5 text-slate-300 hover:bg-white/10 hover:text-white hover:border-white/25 transition-all"
              >
                <Download className="mr-2 h-4 w-4" />
                Tải biên lai
              </Button>
              <Button asChild variant="ghost" className="h-11 rounded-xl text-slate-400 hover:bg-white/5 hover:text-white transition-all">
                <Link href="/">
                  <Home className="mr-2 h-4 w-4" />
                  Trang chủ
                </Link>
              </Button>
            </div>
          </motion.div>
        </div>
      </main>
    </div>
  )
}

export default function CheckoutSuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-rose-500" />
      </div>
    }>
      <CheckoutSuccessContent />
    </Suspense>
  )
}
