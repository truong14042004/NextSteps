"use client"

import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { FormEvent, useEffect, useRef, useState } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { LoadingSwap } from "@/components/ui/loading-swap"
import { MailIcon } from "lucide-react"

type Mode = "sign_in" | "sign_up"
type Step = "form" | "verify_otp"

type SignUpFormState = {
  firstName: string
  lastName: string
  username: string
  email: string
  password: string
  confirmPassword: string
}

const GOOGLE_ERROR_MESSAGES: Record<string, string> = {
  google_not_configured: "Đăng nhập Google chưa được cấu hình trên server.",
  google_rejected: "Bạn đã hủy đăng nhập bằng Google.",
  google_state_invalid: "Phiên đăng nhập Google không hợp lệ. Vui lòng thử lại.",
  google_token_failed: "Không lấy được token từ Google. Vui lòng thử lại.",
  google_profile_failed: "Không đọc được thông tin tài khoản Google.",
  google_profile_invalid: "Tài khoản Google chưa xác minh email.",
  google_db_failed: "Không tạo được phiên đăng nhập. Vui lòng thử lại.",
}

async function callApi<T>(url: string, body: unknown): Promise<T> {
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  })
  const json = await response.json().catch(() => null)

  if (!response.ok) {
    throw new Error(json?.message ?? "Yêu cầu thất bại.")
  }

  return json as T
}

export function OtpAuthForm({ mode }: { mode: Mode }) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const handledGoogleError = useRef<string | null>(null)

  const [signInUsername, setSignInUsername] = useState("")
  const [signInPassword, setSignInPassword] = useState("")

  const [signUpForm, setSignUpForm] = useState<SignUpFormState>({
    firstName: "",
    lastName: "",
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
  })

  const [code, setCode] = useState("")
  const [step, setStep] = useState<Step>("form")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [resendInSeconds, setResendInSeconds] = useState(0)

  const altLink = mode === "sign_up" ? "/sign-in" : "/sign-up"
  const altText = mode === "sign_up" ? "Đã có tài khoản?" : "Chưa có tài khoản?"
  const altCta = mode === "sign_up" ? "Đăng nhập" : "Đăng ký"

  useEffect(() => {
    if (resendInSeconds <= 0) return

    const timer = window.setInterval(() => {
      setResendInSeconds(prev => (prev <= 1 ? 0 : prev - 1))
    }, 1000)

    return () => {
      window.clearInterval(timer)
    }
  }, [resendInSeconds])

  useEffect(() => {
    const errorCode = searchParams.get("error")
    if (errorCode == null || handledGoogleError.current === errorCode) return

    handledGoogleError.current = errorCode
    toast.error(
      GOOGLE_ERROR_MESSAGES[errorCode] ?? "Đăng nhập Google thất bại. Vui lòng thử lại."
    )
  }, [searchParams])

  async function onSignInWithPassword(e: FormEvent) {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      await callApi("/api/auth/login", {
        username: signInUsername,
        password: signInPassword,
      })
      toast.success("Đăng nhập thành công.")
      router.push("/app")
      router.refresh()
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Đăng nhập thất bại. Vui lòng thử lại."
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  async function onSignUpRequestOtp(e: FormEvent) {
    e.preventDefault()

    if (signUpForm.password !== signUpForm.confirmPassword) {
      toast.error("Mật khẩu xác nhận không khớp.")
      return
    }

    setIsSubmitting(true)
    try {
      await callApi("/api/auth/request-otp", {
        email: signUpForm.email,
        firstName: signUpForm.firstName,
        lastName: signUpForm.lastName,
        username: signUpForm.username,
        password: signUpForm.password,
        purpose: "sign_up",
      })

      setStep("verify_otp")
      setResendInSeconds(60)
      toast.success("Đã gửi mã OTP về email của bạn.")
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Không gửi được OTP. Vui lòng thử lại."
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  async function onVerifyOtp(e: FormEvent) {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      await callApi<{ isNewUser?: boolean }>("/api/auth/verify-otp", {
        email: signUpForm.email,
        code,
        purpose: "sign_up",
      })

      toast.success("Xác thực thành công. Chào mừng bạn đến dashboard.")
      router.push("/app")
      router.refresh()
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "OTP không hợp lệ hoặc đã hết hạn."
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  async function onResendOtp() {
    setIsSubmitting(true)
    try {
      await callApi("/api/auth/request-otp", {
        email: signUpForm.email,
        firstName: signUpForm.firstName,
        lastName: signUpForm.lastName,
        username: signUpForm.username,
        password: signUpForm.password,
        purpose: "sign_up",
      })
      setResendInSeconds(60)
      toast.success("Đã gửi lại mã OTP.")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Không thể gửi lại OTP.")
    } finally {
      setIsSubmitting(false)
    }
  }

  function onGoogleAuth() {
    window.location.href = `/api/auth/google/start?mode=${mode}`
  }

  if (mode === "sign_up" && step === "verify_otp") {
    return (
      <Card>
        <CardHeader>
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <MailIcon className="h-6 w-6 text-primary" />
          </div>
          <CardTitle className="text-center">Xác thực OTP</CardTitle>
          <CardDescription className="text-center">{signUpForm.email}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <form onSubmit={onVerifyOtp} className="space-y-4">
            <Input
              value={code}
              onChange={e => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
              inputMode="numeric"
              autoComplete="one-time-code"
              className="text-center text-2xl tracking-widest"
              placeholder="000000"
              required
            />
            <Button className="w-full" disabled={isSubmitting || code.length !== 6}>
              <LoadingSwap isLoading={isSubmitting}>Xác nhận OTP</LoadingSwap>
            </Button>
          </form>

          <Button
            variant="ghost"
            className="w-full"
            disabled={isSubmitting || resendInSeconds > 0}
            onClick={onResendOtp}
          >
            {resendInSeconds > 0
              ? `Gửi lại mã sau ${resendInSeconds}s`
              : "Gửi lại mã OTP"}
          </Button>

          <Button
            variant="ghost"
            className="w-full"
            disabled={isSubmitting}
            onClick={() => setStep("form")}
          >
            Quay lại chỉnh thông tin
          </Button>
        </CardContent>
      </Card>
    )
  }

  if (mode === "sign_in") {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Đăng nhập</CardTitle>
          <CardDescription>Nhập tên đăng nhập và mật khẩu để vào hệ thống.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSignInWithPassword} className="space-y-4">
            <Input
              value={signInUsername}
              onChange={e => setSignInUsername(e.target.value)}
              placeholder="Tên đăng nhập"
              autoComplete="username"
              required
            />
            <Input
              type="password"
              value={signInPassword}
              onChange={e => setSignInPassword(e.target.value)}
              placeholder="Mật khẩu"
              autoComplete="current-password"
              required
            />
            <Button className="w-full" disabled={isSubmitting}>
              <LoadingSwap isLoading={isSubmitting}>Đăng nhập</LoadingSwap>
            </Button>
            <Button
              type="button"
              variant="outline"
              className="w-full"
              disabled={isSubmitting}
              onClick={onGoogleAuth}
            >
              Vào nhanh bằng Google
            </Button>
            <p className="text-center text-sm text-muted-foreground">
              {altText}{" "}
              <Link href={altLink} className="text-primary hover:underline">
                {altCta}
              </Link>
            </p>
          </form>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Đăng ký tài khoản</CardTitle>
        <CardDescription>
          Điền đầy đủ thông tin. Sau đó bạn phải nhập OTP để vào dashboard.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSignUpRequestOtp} className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input
              value={signUpForm.firstName}
              onChange={e =>
                setSignUpForm(prev => ({ ...prev, firstName: e.target.value }))
              }
              placeholder="Tên"
              autoComplete="given-name"
              required
            />
            <Input
              value={signUpForm.lastName}
              onChange={e =>
                setSignUpForm(prev => ({ ...prev, lastName: e.target.value }))
              }
              placeholder="Họ"
              autoComplete="family-name"
              required
            />
          </div>
          <Input
            value={signUpForm.username}
            onChange={e =>
              setSignUpForm(prev => ({ ...prev, username: e.target.value }))
            }
            placeholder="Tên đăng nhập"
            autoComplete="username"
            required
          />
          <Input
            type="email"
            value={signUpForm.email}
            onChange={e => setSignUpForm(prev => ({ ...prev, email: e.target.value }))}
            placeholder="you@example.com"
            autoComplete="email"
            required
          />
          <Input
            type="password"
            value={signUpForm.password}
            onChange={e =>
              setSignUpForm(prev => ({ ...prev, password: e.target.value }))
            }
            placeholder="Mật khẩu (ít nhất 8 ký tự)"
            autoComplete="new-password"
            required
          />
          <Input
            type="password"
            value={signUpForm.confirmPassword}
            onChange={e =>
              setSignUpForm(prev => ({ ...prev, confirmPassword: e.target.value }))
            }
            placeholder="Xác nhận mật khẩu"
            autoComplete="new-password"
            required
          />
          <Button className="w-full" disabled={isSubmitting}>
            <LoadingSwap isLoading={isSubmitting}>Đăng ký và nhận OTP</LoadingSwap>
          </Button>
          <Button
            type="button"
            variant="outline"
            className="w-full"
            disabled={isSubmitting}
            onClick={onGoogleAuth}
          >
            Đăng ký nhanh bằng Google
          </Button>
          <p className="text-xs text-muted-foreground">
            Sau khi đăng ký, bạn cần nhập OTP từ email để xác thực trước khi vào dashboard.
          </p>
          <p className="text-center text-sm text-muted-foreground">
            {altText}{" "}
            <Link href={altLink} className="text-primary hover:underline">
              {altCta}
            </Link>
          </p>
        </form>
      </CardContent>
    </Card>
  )
}
