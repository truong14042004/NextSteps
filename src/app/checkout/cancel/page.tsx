"use client"

import { Suspense } from "react"
import Link from "next/link"
import Image from "next/image"
import { useSearchParams } from "next/navigation"
import {
  AlertTriangle,
  ArrowLeft,
  Home,
  MessageCircle,
  RefreshCcw,
} from "lucide-react"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"

const CANCEL_REASONS = [
  "Bạn đã chủ động huỷ giao dịch",
  "Hết thời gian thanh toán (timeout)",
  "Giao dịch bị gián đoạn",
  "Ngân hàng từ chối giao dịch",
]

function ReceiptRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-dashed border-white/8 last:border-0">
      <span className="text-sm text-slate-400">{label}</span>
      <span className="text-sm font-medium text-slate-200">{value}</span>
    </div>
  )
}

function CheckoutCancelContent() {
  const searchParams = useSearchParams()
  const orderCode = searchParams.get("orderCode")
  const planParam = searchParams.get("plan") ?? "premium"
  const priceParam = searchParams.get("price")

  const planLabel = planParam === "start" ? "NextStep Start" : "NextStep Premium"
  const amount = priceParam ? Number(priceParam).toLocaleString("vi-VN") + " ₫" : "—"

  const cancelTime = new Date().toLocaleString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })

  // Reconstruct checkout URL from params
  const retryHref = `/checkout?plan=${planParam}${priceParam ? `&price=${priceParam}` : ""}`

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50">
      {/* Background */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-slate-950" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-56 bg-rose-600/5 blur-3xl rounded-full" />
        <div className="absolute bottom-1/4 right-1/3 w-64 h-64 bg-amber-500/4 blur-3xl rounded-full" />
      </div>

      {/* Nav */}
      <header className="border-b border-white/8 bg-slate-950/70 backdrop-blur-md">
        <div className="container mx-auto px-4 max-w-3xl">
          <div className="flex h-14 items-center justify-between">
            <Link href="/" className="flex items-center gap-2.5">
              <Image src="/logo.png" alt="NextStep" width={28} height={28} className="rounded-md object-contain" />
              <span className="text-base font-bold text-white">NextStep</span>
            </Link>
            <Link
              href="/#pricing"
              className="flex items-center gap-1.5 text-sm text-slate-400 hover:text-white transition-colors"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Bảng giá
            </Link>
          </div>
        </div>
      </header>

      <main className="py-12 px-4">
        <div className="mx-auto max-w-lg space-y-6">

          {/* ── Warning hero ───────────────────── */}
          <motion.div
            initial={{ opacity: 0, y: -16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, type: "spring", bounce: 0.2 }}
            className="text-center space-y-4"
          >
            <div className="relative mx-auto w-fit">
              <div className="absolute inset-0 rounded-full bg-amber-500/15 blur-2xl" />
              <div className="relative flex h-20 w-20 items-center justify-center rounded-full border-2 border-amber-500/40 bg-amber-500/10">
                <AlertTriangle className="h-10 w-10 text-amber-400" />
              </div>
            </div>

            <div>
              <h1 className="text-2xl font-bold text-white">Thanh toán đã huỷ</h1>
              <p className="mt-1.5 text-sm text-slate-400">
                Giao dịch của bạn chưa được hoàn tất. Không có khoản tiền nào bị trừ.
              </p>
            </div>
          </motion.div>

          {/* ── Transaction card ────────────────── */}
          <motion.div
            initial={{ opacity: 0, y: 28 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15, duration: 0.5 }}
            className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md overflow-hidden shadow-2xl"
          >
            {/* Card header */}
            <div className="bg-amber-500/8 border-b border-white/8 px-6 py-4 flex items-center justify-between">
              <div>
                <div className="text-xs text-amber-400 font-medium uppercase tracking-wider mb-0.5">Lịch sử giao dịch</div>
                <div className="text-sm font-bold text-white">Chi tiết giao dịch bị huỷ</div>
              </div>
              <div className="flex items-center gap-1.5 rounded-full bg-slate-700/60 border border-white/10 px-3 py-1">
                <div className="h-1.5 w-1.5 rounded-full bg-amber-400" />
                <span className="text-xs font-bold text-amber-300 uppercase tracking-wider">Cancelled</span>
              </div>
            </div>

            {/* Transaction details */}
            <div className="px-6 py-2">
              <div className="py-2 mb-1">
                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Thông tin đơn hàng</span>
              </div>
              <ReceiptRow label="Mã đơn hàng" value={orderCode ?? "—"} />
              <ReceiptRow label="Gói đã chọn" value={planLabel} />
              <ReceiptRow label="Số tiền" value={amount} />
              <ReceiptRow label="Cổng thanh toán" value="payOS" />
              <ReceiptRow label="Thời gian huỷ" value={cancelTime} />
              <ReceiptRow label="Trạng thái" value="Đã huỷ" />
            </div>

            {/* Dotted separator */}
            <div className="relative mx-6 my-1">
              <div className="absolute -left-6 -top-3 h-6 w-6 rounded-full bg-slate-950 border-r border-white/10" />
              <div className="absolute -right-6 -top-3 h-6 w-6 rounded-full bg-slate-950 border-l border-white/10" />
              <div className="border-t border-dashed border-white/12" />
            </div>

            {/* Possible reasons */}
            <div className="px-6 py-4">
              <div className="mb-3">
                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Lý do có thể xảy ra</span>
              </div>
              <ul className="space-y-2">
                {CANCEL_REASONS.map((reason, i) => (
                  <motion.li
                    key={reason}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 + i * 0.07 }}
                    className="flex items-start gap-2.5 text-sm text-slate-400"
                  >
                    <div className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-white/8 text-slate-500">
                      <span className="text-[9px] font-bold">{i + 1}</span>
                    </div>
                    {reason}
                  </motion.li>
                ))}
              </ul>
            </div>

            <div className="border-t border-white/8 bg-white/3 px-6 py-3 text-center">
              <p className="text-[11px] text-slate-500">
                Không có khoản phí nào được trừ • Tài khoản của bạn vẫn an toàn
              </p>
            </div>
          </motion.div>

          {/* ── Action buttons ──────────────────── */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.4 }}
            className="space-y-3"
          >
            {/* Primary: retry */}
            <div className="relative group">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-rose-600 to-rose-400 rounded-xl blur opacity-40 group-hover:opacity-70 transition duration-300" />
              <Button
                asChild
                className="relative w-full h-12 rounded-xl bg-gradient-to-r from-rose-600 to-rose-500 text-white font-semibold border-0 shadow-none hover:opacity-90 transition-opacity"
              >
                <Link href={retryHref}>
                  <RefreshCcw className="mr-2 h-4 w-4" />
                  Thử thanh toán lại
                </Link>
              </Button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Button
                asChild
                variant="outline"
                className="h-11 rounded-xl border-white/15 bg-white/5 text-slate-300 hover:bg-white/10 hover:text-white hover:border-white/25 transition-all"
              >
                <Link href="/#pricing">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Về bảng giá
                </Link>
              </Button>
              <Button
                asChild
                variant="ghost"
                className="h-11 rounded-xl text-slate-400 hover:bg-white/5 hover:text-white transition-all"
              >
                <Link href="/">
                  <Home className="mr-2 h-4 w-4" />
                  Trang chủ
                </Link>
              </Button>
            </div>

            <Button
              asChild
              variant="ghost"
              className="w-full h-10 text-slate-500 hover:text-slate-300 text-sm"
            >
              <Link href="/app">
                <MessageCircle className="mr-2 h-3.5 w-3.5" />
                Liên hệ hỗ trợ
              </Link>
            </Button>
          </motion.div>
        </div>
      </main>
    </div>
  )
}

export default function CheckoutCancelPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="h-8 w-8 rounded-full border-2 border-amber-500/30 border-t-amber-500 animate-spin" />
      </div>
    }>
      <CheckoutCancelContent />
    </Suspense>
  )
}
