"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Eye, EyeOff, Check, X, ShieldAlert } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

export default function ChangePasswordClient() {
  const [step, setStep] = useState<"form" | "verify">("form")
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [email, setEmail] = useState("")
  const [otp, setOtp] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const router = useRouter()

  // Password rules validation
  const rules = [
    { label: "Độ dài từ 8 ký tự trở lên", test: (pw: string) => pw.length >= 8 },
    { label: "Chứa chữ thường (a-z)", test: (pw: string) => /[a-z]/.test(pw) },
    { label: "Chứa chữ hoa (A-Z)", test: (pw: string) => /[A-Z]/.test(pw) },
    { label: "Chứa ít nhất 1 chữ số (0-9)", test: (pw: string) => /[0-9]/.test(pw) },
    { label: "Chứa ít nhất 1 ký tự đặc biệt (!@#...)", test: (pw: string) => /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(pw) },
  ]

  const getStrengthScore = () => {
    let score = 0
    rules.forEach(rule => {
      if (rule.test(newPassword)) score++
    })
    return score
  }

  const strengthScore = getStrengthScore()

  const getStrengthLabel = () => {
    if (!newPassword) return { text: "Trống", color: "text-slate-400", bg: "bg-slate-200" }
    if (strengthScore <= 2) return { text: "Yếu", color: "text-rose-500", bg: "bg-rose-500" }
    if (strengthScore <= 4) return { text: "Trung bình", color: "text-amber-500", bg: "bg-amber-500" }
    return { text: "Mạnh", color: "text-emerald-500", bg: "bg-emerald-500" }
  }

  const strengthInfo = getStrengthLabel()

  function validatePassword(password: string): string | null {
    for (const rule of rules) {
      if (!rule.test(password)) {
        return `Mật khẩu chưa đạt yêu cầu: ${rule.label.toLowerCase()}`
      }
    }
    return null
  }

  async function handleRequestOtp(e: React.FormEvent) {
    e.preventDefault()

    if (!currentPassword || !newPassword || !confirmPassword) {
      toast.error("Vui lòng điền đầy đủ thông tin")
      return
    }

    if (newPassword !== confirmPassword) {
      toast.error("Mật khẩu xác nhận không khớp")
      return
    }

    const passwordError = validatePassword(newPassword)
    if (passwordError) {
      toast.error(passwordError)
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch("/api/user/request-password-change-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      })

      const data = await response.json()

      if (!response.ok) {
        toast.error(data.message || "Yêu cầu OTP thất bại")
        return
      }

      setEmail(data.email)
      setStep("verify")
      toast.success("Mã OTP đã được gửi về email")
    } catch (error) {
      toast.error("Lỗi khi gửi OTP")
      console.error(error)
    } finally {
      setIsLoading(false)
    }
  }

  async function handleVerifyOtp(e: React.FormEvent) {
    e.preventDefault()

    if (!otp || otp.length !== 6) {
      toast.error("Vui lòng nhập đúng mã OTP (6 ký tự)")
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch("/api/user/verify-password-change-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ otp, newPassword }),
      })

      const data = await response.json()

      if (!response.ok) {
        toast.error(data.message || "OTP không hợp lệ")
        return
      }

      toast.success("Thay đổi mật khẩu thành công")
      setStep("form")
      setCurrentPassword("")
      setNewPassword("")
      setConfirmPassword("")
      setOtp("")
    } catch (error) {
      toast.error("Lỗi khi xác nhận OTP")
      console.error(error)
    } finally {
      setIsLoading(false)
    }
  }

  if (step === "verify") {
    return (
      <form onSubmit={handleVerifyOtp} className="space-y-6">
        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-300 flex gap-2.5 items-start">
          <ShieldAlert className="h-5 w-5 shrink-0 mt-0.5" />
          <div className="text-xs font-semibold leading-relaxed">
            Mã xác nhận bảo mật OTP đã được gửi về email của bạn: <span className="underline font-bold text-amber-800 dark:text-amber-200">{email}</span>. Vui lòng kiểm tra hộp thư.
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-xs font-bold uppercase tracking-wider text-slate-400">Mã xác nhận (OTP)</label>
          <Input
            type="text"
            placeholder="Nhập mã 6 chữ số"
            value={otp}
            onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
            disabled={isLoading}
            maxLength={6}
            className="text-center text-3xl font-extrabold tracking-[0.5em] pl-[0.5em] h-14 rounded-2xl border-slate-200 dark:border-white/10 focus:ring-primary focus:border-primary bg-slate-50/50 focus:bg-white transition-all"
          />
        </div>

        <div className="flex gap-2">
          <Button
            type="button"
            variant="ghost"
            className="rounded-xl text-xs font-bold px-4 py-2 hover:bg-slate-100 dark:hover:bg-white/5"
            onClick={() => setStep("form")}
            disabled={isLoading}
          >
            Quay lại
          </Button>
          <Button
            type="submit"
            className="flex-1 rounded-xl text-xs font-bold py-2.5 bg-rose-500 hover:bg-rose-600 text-white shadow-md hover:shadow-lg transition-all"
            disabled={isLoading}
          >
            {isLoading ? "Đang xác thực..." : "Xác nhận & Cập nhật"}
          </Button>
        </div>
      </form>
    )
  }

  return (
    <form onSubmit={handleRequestOtp} className="space-y-5">
      {/* Current Password */}
      <div className="space-y-1.5">
        <label className="text-xs font-bold uppercase tracking-wider text-slate-400">Mật khẩu hiện tại</label>
        <div className="relative">
          <Input
            type={showCurrentPassword ? "text" : "password"}
            placeholder="Nhập mật khẩu hiện tại"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            disabled={isLoading}
            className="pr-10 rounded-xl border-slate-200 dark:border-white/10 focus:ring-primary focus:border-primary bg-slate-50/30 focus:bg-white transition-all"
          />
          <button
            type="button"
            onClick={() => setShowCurrentPassword(!showCurrentPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
            disabled={isLoading}
          >
            {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
      </div>

      <hr className="border-slate-100 dark:border-white/5" />

      {/* New Password */}
      <div className="space-y-1.5">
        <label className="text-xs font-bold uppercase tracking-wider text-slate-400">Mật khẩu mới</label>
        <div className="relative">
          <Input
            type={showNewPassword ? "text" : "password"}
            placeholder="Nhập mật khẩu mới"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            disabled={isLoading}
            className="pr-10 rounded-xl border-slate-200 dark:border-white/10 focus:ring-primary focus:border-primary bg-slate-50/30 focus:bg-white transition-all"
          />
          <button
            type="button"
            onClick={() => setShowNewPassword(!showNewPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
            disabled={isLoading}
          >
            {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>

        {/* Real-time Password Strength Meter */}
        {newPassword && (
          <div className="space-y-1.5 pt-1.5">
            <div className="flex items-center justify-between text-[10px] font-bold uppercase">
              <span className="text-slate-400">Độ mạnh mật khẩu</span>
              <span className={strengthInfo.color}>{strengthInfo.text}</span>
            </div>
            {/* Visual Bar */}
            <div className="grid grid-cols-5 gap-1 h-1.5 rounded-full overflow-hidden bg-slate-100 dark:bg-white/10">
              {[1, 2, 3, 4, 5].map((levelIndex) => (
                <div
                  key={levelIndex}
                  className={cn(
                    "h-full rounded-full transition-colors duration-300",
                    levelIndex <= strengthScore ? strengthInfo.bg : "bg-transparent"
                  )}
                />
              ))}
            </div>

            {/* Checklist of rules */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 pt-2">
              {rules.map((rule, idx) => {
                const passed = rule.test(newPassword)
                return (
                  <div key={idx} className="flex items-center gap-1.5">
                    {passed ? (
                      <Check className="h-3 w-3 text-emerald-500 shrink-0" />
                    ) : (
                      <X className="h-3 w-3 text-slate-300 dark:text-slate-600 shrink-0" />
                    )}
                    <span className={cn(
                      "text-[10px] font-semibold transition-colors",
                      passed ? "text-slate-700 dark:text-slate-300" : "text-slate-400"
                    )}>
                      {rule.label}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>

      {/* Confirm Password */}
      <div className="space-y-1.5">
        <label className="text-xs font-bold uppercase tracking-wider text-slate-400">Xác nhận mật khẩu mới</label>
        <div className="relative">
          <Input
            type={showConfirmPassword ? "text" : "password"}
            placeholder="Nhập lại mật khẩu mới"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            disabled={isLoading}
            className="pr-10 rounded-xl border-slate-200 dark:border-white/10 focus:ring-primary focus:border-primary bg-slate-50/30 focus:bg-white transition-all"
          />
          <button
            type="button"
            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
            disabled={isLoading}
          >
            {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
      </div>

      <div className="pt-2">
        <Button
          type="submit"
          className="w-full rounded-xl text-xs font-bold py-2.5 bg-rose-500 hover:bg-rose-600 text-white shadow-md hover:shadow-lg transition-all"
          disabled={isLoading}
        >
          {isLoading ? "Đang gửi mã OTP..." : "Tiếp tục"}
        </Button>
      </div>
    </form>
  )
}
