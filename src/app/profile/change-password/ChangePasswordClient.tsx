"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Eye, EyeOff } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"

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
      <form onSubmit={handleVerifyOtp} className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Mã OTP đã được gửi về email: <span className="font-medium">{email}</span>
        </p>

        <div className="space-y-2">
          <label className="text-sm font-medium">Mã OTP</label>
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
          onClick={() => setStep("form")}
          disabled={isLoading}
        >
          Quay lại
        </Button>
      </form>
    )
  }

  return (
    <form onSubmit={handleRequestOtp} className="space-y-4">
      <div className="space-y-2">
        <label className="text-sm font-medium">Mật khẩu hiện tại</label>
        <div className="relative">
          <Input
            type={showCurrentPassword ? "text" : "password"}
            placeholder="Nhập mật khẩu hiện tại"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            disabled={isLoading}
            className="pr-10"
          />
          <button
            type="button"
            onClick={() => setShowCurrentPassword(!showCurrentPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            disabled={isLoading}
          >
            {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Mật khẩu mới</label>
        <div className="relative">
          <Input
            type={showNewPassword ? "text" : "password"}
            placeholder="Nhập mật khẩu mới"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            disabled={isLoading}
            className="pr-10"
          />
          <button
            type="button"
            onClick={() => setShowNewPassword(!showNewPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            disabled={isLoading}
          >
            {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
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
        {isLoading ? "Đang gửi mã OTP..." : "Tiếp tục"}
      </Button>
    </form>
  )
}
