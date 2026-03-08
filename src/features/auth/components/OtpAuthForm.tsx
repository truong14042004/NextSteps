"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { AppLogo } from "@/components/ui/AppLogo"
import { Input } from "@/components/ui/input"
import { LoadingSwap } from "@/components/ui/loading-swap"
import { MailIcon, Chrome, Eye, EyeOff } from "lucide-react"

type Mode = "sign_in" | "sign_up"
type Step = "form" | "verify_otp"

type SignUpFormState = {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  confirmPassword: string;
};

const GOOGLE_ERROR_MESSAGES: Record<string, string> = {
  google_not_configured: "Đăng nhập Google chưa được cấu hình trên server.",
  google_rejected: "Bạn đã hủy đăng nhập bằng Google.",
  google_state_invalid:
    "Phiên đăng nhập Google không hợp lệ. Vui lòng thử lại.",
  google_token_failed: "Không lấy được token từ Google. Vui lòng thử lại.",
  google_profile_failed: "Không đọc được thông tin tài khoản Google.",
  google_profile_invalid: "Tài khoản Google chưa xác minh email.",
  google_db_failed: "Không tạo được phiên đăng nhập. Vui lòng thử lại.",
};

async function callApi<T>(url: string, body: unknown): Promise<T> {
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  const json = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(json?.message ?? "Yêu cầu thất bại.");
  }

  return json as T;
}

function GoogleIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" {...props}>
      <path
        d="M21.805 10.023H12.24v3.955h5.478c-.236 1.273-.963 2.352-2.054 3.079v2.557h3.32c1.943-1.789 3.06-4.424 3.06-7.564 0-.684-.061-1.342-.239-2.027Z"
        fill="#4285F4"
      />
      <path
        d="M12.24 22c2.764 0 5.088-.912 6.784-2.465l-3.32-2.557c-.924.621-2.104.99-3.464.99-2.663 0-4.923-1.797-5.73-4.215H3.085v2.637A10.242 10.242 0 0 0 12.24 22Z"
        fill="#34A853"
      />
      <path
        d="M6.51 13.753a6.14 6.14 0 0 1-.321-1.953c0-.678.117-1.336.321-1.953V7.21H3.085a10.246 10.246 0 0 0 0 9.18l3.425-2.637Z"
        fill="#FBBC05"
      />
      <path
        d="M12.24 5.632c1.503 0 2.85.518 3.91 1.535l2.93-2.93C17.323 2.602 15 1.6 12.24 1.6 8.245 1.6 4.809 3.89 3.085 7.21l3.425 2.637c.807-2.418 3.067-4.215 5.73-4.215Z"
        fill="#EA4335"
      />
    </svg>
  );
}

function AuthShell({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <Card className="overflow-hidden rounded-[28px] border-primary/10 bg-white/90 shadow-lg shadow-black/5 backdrop-blur dark:bg-card/90">
      <CardHeader className="space-y-4 pb-2">
        <div className="mx-auto">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-primary/10 bg-white shadow-sm dark:bg-background">
            <AppLogo href="/" showText={false} imageSize={38} />
          </div>
        </div>

        <div className="space-y-1 text-center">
          <CardTitle className="text-2xl font-bold tracking-tight">
            {title}
          </CardTitle>
          <CardDescription className="text-sm leading-6">
            {description}
          </CardDescription>
        </div>
      </CardHeader>

      <CardContent className="pt-4">{children}</CardContent>
    </Card>
  );
}

export function OtpAuthForm({ mode }: { mode: Mode }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const handledGoogleError = useRef<string | null>(null);

  const [signInEmail, setSignInEmail] = useState("");
  const [signInPassword, setSignInPassword] = useState("");

  const [signUpForm, setSignUpForm] = useState<SignUpFormState>({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const [code, setCode] = useState("")
  const [step, setStep] = useState<Step>("form")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [resendInSeconds, setResendInSeconds] = useState(0)
  const [showSignInPassword, setShowSignInPassword] = useState(false)

  const altLink = mode === "sign_up" ? "/sign-in" : "/sign-up";
  const altText =
    mode === "sign_up" ? "Đã có tài khoản?" : "Chưa có tài khoản?";
  const altCta = mode === "sign_up" ? "Đăng nhập" : "Đăng ký";

  useEffect(() => {
    if (resendInSeconds <= 0) return;

    const timer = window.setInterval(() => {
      setResendInSeconds((prev) => (prev <= 1 ? 0 : prev - 1));
    }, 1000);

    return () => {
      window.clearInterval(timer);
    };
  }, [resendInSeconds]);

  useEffect(() => {
    const errorCode = searchParams.get("error");
    if (errorCode == null || handledGoogleError.current === errorCode) return;

    handledGoogleError.current = errorCode;
    toast.error(
      GOOGLE_ERROR_MESSAGES[errorCode] ??
        "Đăng nhập Google thất bại. Vui lòng thử lại.",
    );
  }, [searchParams]);

  async function onSignInWithPassword(e: FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      await callApi("/api/auth/login", {
        email: signInEmail,
        password: signInPassword,
      });
      toast.success("Đăng nhập thành công.");
      router.push("/");
      router.refresh();
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Đăng nhập thất bại. Vui lòng thử lại.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

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

  async function onSignUpRequestOtp(e: FormEvent) {
    e.preventDefault();

    if (signUpForm.password !== signUpForm.confirmPassword) {
      toast.error("Mật khẩu xác nhận không khớp.");
      return;
    }

    const passwordError = validatePassword(signUpForm.password)
    if (passwordError) {
      toast.error(passwordError)
      return
    }

    setIsSubmitting(true)
    try {
      await callApi("/api/auth/request-otp", {
        email: signUpForm.email,
        firstName: signUpForm.firstName,
        lastName: signUpForm.lastName,
        password: signUpForm.password,
        purpose: "sign_up",
      });

      setStep("verify_otp");
      setResendInSeconds(60);
      toast.success("Đã gửi mã OTP về email của bạn.");
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Không gửi được OTP. Vui lòng thử lại.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  async function onVerifyOtp(e: FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      await callApi<{ isNewUser?: boolean }>("/api/auth/verify-otp", {
        email: signUpForm.email,
        code,
        purpose: "sign_up",
      });

      toast.success("Xác thực thành công. Chào mừng bạn đến dashboard.");
      router.push("/app");
      router.refresh();
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "OTP không hợp lệ hoặc đã hết hạn.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  async function onResendOtp() {
    setIsSubmitting(true);
    try {
      await callApi("/api/auth/request-otp", {
        email: signUpForm.email,
        firstName: signUpForm.firstName,
        lastName: signUpForm.lastName,
        password: signUpForm.password,
        purpose: "sign_up",
      });
      setResendInSeconds(60);
      toast.success("Đã gửi lại mã OTP.");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Không thể gửi lại OTP.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  function onGoogleAuth() {
    window.location.href = `/api/auth/google/start?mode=${mode}`;
  }

  if (mode === "sign_up" && step === "verify_otp") {
    return (
      <AuthShell
        title="Xác thực OTP"
        description="Nhập mã xác thực đã được gửi đến email của bạn."
      >
        <div className="mb-5 rounded-2xl border border-primary/10 bg-primary/5 p-4 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-white text-primary shadow-sm">
            <MailIcon className="h-5 w-5" />
          </div>
          <p className="text-sm font-medium text-foreground">
            {signUpForm.email}
          </p>
        </div>

        <form onSubmit={onVerifyOtp} className="space-y-4">
          <Input
            value={code}
            onChange={(e) =>
              setCode(e.target.value.replace(/\D/g, "").slice(0, 6))
            }
            inputMode="numeric"
            autoComplete="one-time-code"
            className="h-14 rounded-2xl border-primary/10 text-center text-2xl tracking-[0.35em]"
            placeholder="000000"
            required
          />

          <Button
            className="btn-cta h-12 w-full rounded-2xl"
            disabled={isSubmitting || code.length !== 6}
          >
            <LoadingSwap isLoading={isSubmitting}>Xác nhận OTP</LoadingSwap>
          </Button>
        </form>

        <div className="mt-4 space-y-2">
          <Button
            variant="outline"
            className="h-11 w-full rounded-2xl border-primary/10"
            disabled={isSubmitting || resendInSeconds > 0}
            onClick={onResendOtp}
          >
            {resendInSeconds > 0
              ? `Gửi lại mã sau ${resendInSeconds}s`
              : "Gửi lại mã OTP"}
          </Button>

          <Button
            variant="ghost"
            className="h-11 w-full rounded-2xl"
            disabled={isSubmitting}
            onClick={() => setStep("form")}
          >
            Quay lại chỉnh thông tin
          </Button>
        </div>
      </AuthShell>
    );
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
              type="email"
              value={signInEmail}
              onChange={e => setSignInEmail(e.target.value)}
              placeholder="Email"
              autoComplete="email"
              required
            />
            <div className="space-y-2">
              <div className="relative">
                <Input
                  type={showSignInPassword ? "text" : "password"}
                  value={signInPassword}
                  onChange={e => setSignInPassword(e.target.value)}
                  placeholder="Mật khẩu"
                  autoComplete="current-password"
                  required
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowSignInPassword(!showSignInPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  disabled={isSubmitting}
                >
                  {showSignInPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              <Link href="/forgot-password" className="text-sm text-primary hover:underline block text-right">
                Quên mật khẩu?
              </Link>
            </div>
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
              <Chrome className="mr-2 h-4 w-4" />
              Đăng nhập bằng Google
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
    <AuthShell
      title="Tạo tài khoản"
      description="Đăng ký để bắt đầu phân tích CV/JD và sử dụng các tính năng AI của NextStep."
    >
      <form onSubmit={onSignUpRequestOtp} className="space-y-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input
            value={signUpForm.firstName}
            onChange={(e) =>
              setSignUpForm((prev) => ({ ...prev, firstName: e.target.value }))
            }
            placeholder="Tên"
            autoComplete="given-name"
            className="h-12 rounded-2xl border-primary/10"
            required
          />

          <Input
            value={signUpForm.lastName}
            onChange={(e) =>
              setSignUpForm((prev) => ({ ...prev, lastName: e.target.value }))
            }
            placeholder="Họ"
            autoComplete="family-name"
            className="h-12 rounded-2xl border-primary/10"
            required
          />
        </div>

        <Input
          type="email"
          value={signUpForm.email}
          onChange={(e) =>
            setSignUpForm((prev) => ({ ...prev, email: e.target.value }))
          }
          placeholder="you@example.com"
          autoComplete="email"
          className="h-12 rounded-2xl border-primary/10"
          required
        />

        <Input
          type="password"
          value={signUpForm.password}
          onChange={(e) =>
            setSignUpForm((prev) => ({ ...prev, password: e.target.value }))
          }
          placeholder="Mật khẩu (ít nhất 8 ký tự)"
          autoComplete="new-password"
          className="h-12 rounded-2xl border-primary/10"
          required
        />

        <Input
          type="password"
          value={signUpForm.confirmPassword}
          onChange={(e) =>
            setSignUpForm((prev) => ({
              ...prev,
              confirmPassword: e.target.value,
            }))
          }
          placeholder="Xác nhận mật khẩu"
          autoComplete="new-password"
          className="h-12 rounded-2xl border-primary/10"
          required
        />

        <Button
          className="btn-cta h-12 w-full rounded-2xl"
          disabled={isSubmitting}
        >
          <LoadingSwap isLoading={isSubmitting}>Đăng ký</LoadingSwap>
        </Button>

        <div className="relative py-1">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-border" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-card px-3 text-muted-foreground">Hoặc</span>
          </div>
        </div>

        <Button
          type="button"
          variant="outline"
          className="h-12 w-full rounded-2xl border-primary/10 bg-white hover:bg-primary/5 dark:bg-background"
          disabled={isSubmitting}
          onClick={onGoogleAuth}
        >
          <GoogleIcon className="mr-2 h-4 w-4" />
          Đăng ký bằng Google
        </Button>

        <div className="rounded-2xl border border-primary/10 bg-primary/5 px-4 py-3 text-xs text-muted-foreground">
          Sau khi đăng ký, bạn cần nhập OTP từ email để xác thực trước khi vào
          dashboard.
        </div>

        <p className="pt-1 text-center text-sm text-muted-foreground">
          {altText}{" "}
          <Link
            href={altLink}
            className="font-medium text-primary hover:underline"
          >
            {altCta}
          </Link>
        </p>
      </form>
    </AuthShell>
  );
}
