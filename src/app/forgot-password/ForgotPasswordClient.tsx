"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Eye, EyeOff } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"

type Step = "request" | "verify" | "reset"

export default function ForgotPasswordClient() {
  const [step, setStep] = useState<Step>("request")
  const [email, setEmail] = useState("")
  const [otp, setOtp] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const router = useRouter()

  function validatePassword(password: string): string | null {
    if (password.length < 8) {
      return "Mật khẩu phải có ít nhất 8 ký tự"
    }
    if (!/[a-z]/.test(password)) {
      return "Mật khẩu phải chứa chữ cái thường"
    }
    if (!/[A-Z]/.test(password)) {
      return "Mật khẩu phải chứa chữ cái hoa"
    }
    if (!/[0-9]/.test(password)) {
      return "Mật khẩu phải chứa ít nhất một số"
    }
    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
      return "Mật khẩu phải chứa ký tự đặc biệt (!@#$%^&* v.v.)"
    }
    return null
  }

  async function handleRequestOtp(e: React.FormEvent) {
    e.preventDefault()

    if (!email) {
      toast.error("Vui lòng nhập email")
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch("/api/auth/request-password-reset-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      })

      const data = await response.json()

      if (!response.ok) {
        toast.error(data.message || "Yêu cầu OTP thất bại")
        return
      }

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
      const response = await fetch("/api/auth/verify-password-reset-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp }),
      })

      const data = await response.json()

      if (!response.ok) {
        toast.error(data.message || "OTP không hợp lệ")
        return
      }

      setStep("reset")
      toast.success("OTP đã được xác nhận")
    } catch (error) {
      toast.error("Lỗi khi xác nhận OTP")
      console.error(error)
    } finally {
      setIsLoading(false)
    }
  }

  async function handleResetPassword(e: React.FormEvent) {
    e.preventDefault()

    if (!newPassword || !confirmPassword) {
      toast.error("Vui lòng điền đầy đủ mật khẩu")
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
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp, newPassword }),
      })

      const data = await response.json()

      if (!response.ok) {
        toast.error(data.message || "Reset mật khẩu thất bại")
        return
      }

      toast.success("Mật khẩu đã được reset thành công")

      setTimeout(() => {
        router.push("/sign-in")
      }, 1500)
    } catch (error) {
      toast.error("Lỗi khi reset mật khẩu")
      console.error(error)
    } finally {
      setIsLoading(false)
    }
  }

  if (step === "verify") {
    return (
      <form onSubmit={handleVerifyOtp} className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Mã OTP đã được gửi về email: <span className="font-medium">{email}</span>
        </p>

        <div className="space-y-2">
          <Input
            type="text"
            placeholder="Nhập mã OTP (6 ký tự)"
            value={otp}
            onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
            disabled={isLoading}
            maxLength={6}
            className="text-center text-2xl tracking-widest"
          />
        </div>

        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? "Đang xác nhận..." : "Xác nhận OTP"}
        </Button>

        <Button
          type="button"
          variant="outline"
          className="w-full"
          onClick={() => setStep("request")}
          disabled={isLoading}
        >
          Quay lại
        </Button>
      </form>
    )
  }

  if (step === "reset") {
    return (
      <form onSubmit={handleResetPassword} className="space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">Mật khẩu mới</label>
          <div className="relative">
            <Input
              type={showPassword ? "text" : "password"}
              placeholder="Nhập mật khẩu mới"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              disabled={isLoading}
              className="pr-10"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              disabled={isLoading}
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          <p className="text-xs text-muted-foreground">
            Mật khẩu phải có ít nhất 8 ký tự, chứa chữ cái (hoa và thường), số và ký tự đặc biệt
          </p>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Xác nhận mật khẩu mới</label>
          <div className="relative">
            <Input
              type={showConfirmPassword ? "text" : "password"}
              placeholder="Nhập lại mật khẩu mới"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              disabled={isLoading}
              className="pr-10"
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              disabled={isLoading}
            >
              {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>

        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? "Đang reset..." : "Reset mật khẩu"}
        </Button>
      </form>
    )
  }

  return (
    <form onSubmit={handleRequestOtp} className="space-y-4">
      <div className="space-y-2">
        <label className="text-sm font-medium">Email</label>
        <Input
          type="email"
          placeholder="Nhập email của bạn"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={isLoading}
          required
        />
      </div>

      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading ? "Đang gửi..." : "Gửi mã OTP"}
      </Button>
    </form>
  )
}
