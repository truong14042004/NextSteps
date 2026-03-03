"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { useSignUp } from "@clerk/nextjs"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { LoadingSwap } from "@/components/ui/loading-swap"
import { signUpSchema, SignUpFormData } from "../schemas"
import { toast } from "sonner"
import { EyeIcon, EyeOffIcon, MailIcon } from "lucide-react"
import Link from "next/link"

type VerificationStep = "signup" | "verify"

export function SignUpForm() {
  const { signUp, setActive } = useSignUp()
  const router = useRouter()
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [verificationStep, setVerificationStep] = useState<VerificationStep>("signup")
  const [verificationCode, setVerificationCode] = useState("")
  const [isVerifying, setIsVerifying] = useState(false)
  const [isResending, setIsResending] = useState(false)
  const [resendTimer, setResendTimer] = useState(0)

  // Countdown timer for resend button
  useEffect(() => {
    if (resendTimer > 0) {
      const timeout = setTimeout(() => setResendTimer(resendTimer - 1), 1000)
      return () => clearTimeout(timeout)
    }
  }, [resendTimer])

  const form = useForm<SignUpFormData>({
    resolver: zodResolver(signUpSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  })

  async function onSubmit(values: SignUpFormData) {
    if (!signUp) return

    try {
      // Create the user account
      const result = await signUp.create({
        firstName: values.firstName,
        lastName: values.lastName,
        emailAddress: values.email,
        password: values.password,
      })

      if (result.status === "complete") {
        // Account created without verification requirement
        await setActive({ session: result.createdSessionId })
        router.push("/app?new=true")
      } else {
        // Email verification required
        await signUp.prepareEmailAddressVerification({ 
          strategy: "email_code" 
        })
        setVerificationStep("verify")
        setResendTimer(60)
        toast.success("Verification code sent to your email")
      }
    } catch (err: any) {
      const errorMessage = err?.errors?.[0]?.message || "Failed to create account"
      toast.error(errorMessage)
    }
  }

  async function handleVerifyCode() {
    if (!signUp || !verificationCode) return

    setIsVerifying(true)
    try {
      const result = await signUp.attemptEmailAddressVerification({
        code: verificationCode,
      })

      if (result.status === "complete") {
        await setActive({ session: result.createdSessionId })
        toast.success("Email verified successfully!")
        router.push("/app?new=true")
      } else {
        toast.error("Verification incomplete. Please try again.")
      }
    } catch (err: any) {
      const errorMessage = err?.errors?.[0]?.message || "Invalid verification code"
      toast.error(errorMessage)
    } finally {
      setIsVerifying(false)
    }
  }

  async function handleResendCode() {
    if (!signUp || resendTimer > 0) return

    setIsResending(true)
    try {
      await signUp.prepareEmailAddressVerification({ 
        strategy: "email_code" 
      })
      setResendTimer(60)
      toast.success("Verification code resent!")
    } catch (err: any) {
      toast.error("Failed to resend code. Please try again.")
    } finally {
      setIsResending(false)
    }
  }

  // Show verification step
  if (verificationStep === "verify") {
    return (
      <Card>
        <CardHeader>
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <MailIcon className="h-6 w-6 text-primary" />
          </div>
          <CardTitle className="text-center">Check your email</CardTitle>
          <CardDescription className="text-center">
            We sent a verification code to{" "}
            <span className="font-medium text-foreground">
              {signUp?.emailAddress}
            </span>
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="code" className="text-sm font-medium">
              Verification Code
            </label>
            <Input
              id="code"
              placeholder="Enter 6-digit code"
              value={verificationCode}
              onChange={(e) => setVerificationCode(e.target.value)}
              maxLength={6}
              className="text-center text-2xl tracking-widest"
              autoComplete="one-time-code"
            />
          </div>

          <Button
            onClick={handleVerifyCode}
            disabled={isVerifying || verificationCode.length !== 6}
            className="w-full"
          >
            <LoadingSwap isLoading={isVerifying}>
              Verify Email
            </LoadingSwap>
          </Button>

          <div className="text-center text-sm">
            <button
              type="button"
              onClick={handleResendCode}
              disabled={isResending || resendTimer > 0}
              className="text-primary hover:underline disabled:text-muted-foreground disabled:no-underline"
            >
              {resendTimer > 0 
                ? `Resend code in ${resendTimer}s` 
                : "Resend code"}
            </button>
          </div>

          <div className="text-center text-sm text-muted-foreground">
            <button
              type="button"
              onClick={() => setVerificationStep("signup")}
              className="text-primary hover:underline"
            >
              ← Back to sign up
            </button>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Show signup step
  return (
    <Card>
      <CardHeader>
        <CardTitle>Create an account</CardTitle>
        <CardDescription>
          Enter your information to get started
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="firstName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      First name <span className="text-destructive">*</span>
                    </FormLabel>
                    <FormControl>
                      <Input placeholder="John" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="lastName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Last name <span className="text-destructive">*</span>
                    </FormLabel>
                    <FormControl>
                      <Input placeholder="Doe" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Email address <span className="text-destructive">*</span>
                  </FormLabel>
                  <FormControl>
                    <Input
                      type="email"
                      placeholder="john.doe@example.com"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Password <span className="text-destructive">*</span>
                  </FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input
                        type={showPassword ? "text" : "password"}
                        placeholder="Enter your password"
                        {...field}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? (
                          <EyeOffIcon className="h-4 w-4" />
                        ) : (
                          <EyeIcon className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="confirmPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Confirm password <span className="text-destructive">*</span>
                  </FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input
                        type={showConfirmPassword ? "text" : "password"}
                        placeholder="Confirm your password"
                        {...field}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                        onClick={() =>
                          setShowConfirmPassword(!showConfirmPassword)
                        }
                      >
                        {showConfirmPassword ? (
                          <EyeOffIcon className="h-4 w-4" />
                        ) : (
                          <EyeIcon className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button
              type="submit"
              className="w-full"
              disabled={form.formState.isSubmitting}
            >
              <LoadingSwap isLoading={form.formState.isSubmitting}>
                Create account
              </LoadingSwap>
            </Button>

            <div className="text-center text-sm text-muted-foreground">
              Already have an account?{" "}
              <Link href="/sign-in" className="text-primary hover:underline">
                Sign in
              </Link>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  )
}
