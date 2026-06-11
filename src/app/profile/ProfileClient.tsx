"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { LogOut, User, Lock, UploadCloud, ArrowLeft, FileSearch, MessageSquare, ListChecks, TrendingUp, Crown, Trophy, Sparkles } from "lucide-react"
import { toast } from "sonner"

import { AppLogo } from "@/components/ui/AppLogo"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { ThemeToggle } from "@/components/ThemeToggle"
import { getAvatarImageSrc } from "@/lib/avatar-url"

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"

import { UserAvatar } from "@/features/users/components/UserAvatar"
import { cn } from "@/lib/utils"

type ProfileUser = {
  name: string
  email: string
  imageUrl: string
  role: string
}

type StatsProps = {
  xp: number
  level: number
  levelLabel: string
  totalAnalyses: number
  totalInterviews: number
  totalQuizAttempts: number
  readinessScore: number
}

type PlanSummary = {
  planKey: string
  planName: string;
  resetText: string;
}

export default function ProfileClient({
  user,
  stats,
  plan,
}: {
  user: ProfileUser
  stats?: StatsProps
  plan?: PlanSummary
}) {
  const router = useRouter()
  const [savedUser, setSavedUser] = useState(user)
  const [isSigningOut, setIsSigningOut] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false)
  const [isDragOver, setIsDragOver] = useState(false)
  const [name, setName] = useState(user.name)
  const [email, setEmail] = useState(user.email)
  const [imageUrl, setImageUrl] = useState(user.imageUrl)

  const avatarUser = {
    name,
    imageUrl,
  }
  const avatarSrc = getAvatarImageSrc(imageUrl)

  async function handleSignOut() {
    if (isSigningOut) return

    setIsSigningOut(true)

    try {
      await fetch("/api/auth/logout", { method: "POST" })
      router.push("/")
      router.refresh()
    } finally {
      setIsSigningOut(false)
    }
  }

  async function handleSave() {
    if (isSaving) return

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      toast.error("Email không hợp lệ")
      return
    }

    if (!name.trim()) {
      toast.error("Tên không được để trống")
      return
    }

    setIsSaving(true)
    try {
      const response = await fetch("/api/user/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, imageUrl }),
      })
      const data = await response.json().catch(() => null)

      if (!response.ok) {
        toast.error(data?.message ?? "Cập nhật thất bại")
        return
      }

      if (data?.user) {
        const updatedUser: ProfileUser = {
          name: data.user.name,
          email: data.user.email,
          imageUrl: data.user.imageUrl,
          role: savedUser.role,
        }
        setSavedUser(updatedUser)
        setName(updatedUser.name)
        setEmail(updatedUser.email)
        setImageUrl(updatedUser.imageUrl)
      }

      toast.success("Cập nhật thành công")
      router.refresh()
    } catch (error) {
      toast.error("Lỗi khi cập nhật")
      console.error(error)
    } finally {
      setIsSaving(false)
    }
  }

  function handleCancel() {
    setName(savedUser.name)
    setEmail(savedUser.email)
    setImageUrl(savedUser.imageUrl)
    router.back()
  }

  async function handleAvatarUpload(file: File | null) {
    if (!file || isUploadingAvatar) return

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Kích thước ảnh phải nhỏ hơn 5MB")
      return
    }

    if (!["image/jpeg", "image/png", "image/webp", "image/gif"].includes(file.type)) {
      toast.error("Vui lòng chọn ảnh JPEG, PNG, WebP hoặc GIF")
      return
    }

    const formData = new FormData()
    formData.append("file", file)
    formData.append("folder", "avatars")

    setIsUploadingAvatar(true)
    try {
      const response = await fetch("/api/uploads/image", {
        method: "POST",
        body: formData,
      })
      const data = await response.json()

      if (!response.ok) {
        toast.error(data.error ?? "Không thể tải avatar")
        return
      }

      setImageUrl(data.publicUrl)
      toast.success("Đã tải avatar. Bấm Cập nhật để lưu.")
    } catch (error) {
      console.error(error)
      toast.error("Lỗi khi tải avatar")
    } finally {
      setIsUploadingAvatar(false)
    }
  }

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault()
    setIsDragOver(true)
  }

  function handleDragLeave() {
    setIsDragOver(false)
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    setIsDragOver(false)
    const file = e.dataTransfer.files?.[0] ?? null
    handleAvatarUpload(file)
  }

  const dashboardPath = savedUser.role === "recruiter" ? "/explore" : "/app"

  return (
    <div className="min-h-screen bg-slate-50/50 dark:bg-slate-950/20">
      <nav className="h-16 border-b border-slate-100 dark:border-slate-800/80 bg-white/80 dark:bg-slate-950/80 backdrop-blur-md sticky top-0 z-10">
        <div className="container flex h-full items-center justify-between">
          <AppLogo href={dashboardPath} />

          <div className="flex items-center gap-4">
            <ThemeToggle />

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-2 rounded-full outline-none transition-all hover:scale-105">
                  <UserAvatar user={avatarUser} />
                </button>
              </DropdownMenuTrigger>

              <DropdownMenuContent align="end" className="w-56 rounded-2xl p-2 border border-slate-100 dark:border-white/10 shadow-xl bg-white dark:bg-slate-950">
                <DropdownMenuItem className="flex items-center gap-2 rounded-xl p-2">
                  <User className="h-4 w-4" />
                  <span className="text-sm font-semibold truncate">{name}</span>
                </DropdownMenuItem>

                <DropdownMenuSeparator className="my-1 border-slate-50 dark:border-white/5" />

                <DropdownMenuItem
                  onClick={handleSignOut}
                  disabled={isSigningOut}
                  className="flex items-center gap-2 rounded-xl p-2 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/20 cursor-pointer"
                >
                  <LogOut className="h-4 w-4" />
                  <span>Đăng xuất</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </nav>

      <div className="container max-w-4xl py-8 space-y-6">
        {/* Back button */}
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            onClick={() => router.push(dashboardPath)}
            className="flex items-center gap-2 rounded-xl text-slate-600 dark:text-slate-400 hover:text-slate-900 hover:bg-slate-100 dark:hover:bg-white/5 transition-all text-xs font-semibold px-3 py-1.5"
          >
            <ArrowLeft className="h-4 w-4" />
            Quay lại Dashboard
          </Button>

          <Button
            variant="outline"
            className="gap-2 rounded-xl text-xs font-semibold border-slate-200 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-white/5 transition-all"
            onClick={() => router.push("/profile/change-password")}
          >
            <Lock className="h-3.5 w-3.5" />
            Thay đổi mật khẩu
          </Button>
        </div>

        {/* Hero Card */}
        <div className="relative overflow-hidden rounded-3xl border border-slate-100 dark:border-white/5 bg-gradient-to-br from-indigo-500/5 via-rose-500/5 to-amber-500/5 dark:from-indigo-500/10 dark:via-rose-500/10 dark:to-amber-500/10 p-6 sm:p-8 shadow-sm flex flex-col sm:flex-row sm:items-center gap-6">
          <div className="absolute top-0 right-0 h-40 w-40 bg-gradient-to-br from-rose-500/10 to-amber-500/10 rounded-full filter blur-2xl -z-10" />

          {/* Large Avatar */}
          <div className="relative shrink-0 mx-auto sm:mx-0">
            <Avatar className="h-24 w-24 border-4 border-white dark:border-slate-800 shadow-md">
              <AvatarImage key={avatarSrc} src={avatarSrc} alt={name} />
              <AvatarFallback className="text-2xl font-bold bg-slate-100 dark:bg-white/5">{name.charAt(0)}</AvatarFallback>
            </Avatar>
          </div>

          {/* User Profile Info Details */}
          <div className="flex-1 text-center sm:text-left min-w-0">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mb-1.5">
              <h2 className="text-xl font-extrabold text-slate-800 dark:text-slate-100 tracking-tight leading-none">
                {name}
              </h2>
              {plan && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 shadow-sm uppercase">
                  <Crown className="size-3 shrink-0" />
                  {plan.planName}
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mb-3">{email}</p>

            {/* {stats && (
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3">
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-xs font-bold bg-rose-500/10 text-rose-500">
                  Cấp {stats.level}
                </span>
                <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                  {stats.levelLabel} · <span className="text-slate-400 dark:text-slate-500 font-medium">{stats.xp} XP</span>
                </span>
              </div>
            )} */}
          </div>
        </div>

        {/* Statistics Grid */}
        {/* {stats && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="rounded-2xl border-slate-100 dark:border-white/5 bg-white dark:bg-slate-900/50 shadow-sm">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-500">
                  <FileSearch className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <span className="block text-lg font-bold text-slate-800 dark:text-slate-100">{stats.totalAnalyses}</span>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">CV đã phân tích</span>
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-2xl border-slate-100 dark:border-white/5 bg-white dark:bg-slate-900/50 shadow-sm">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-500/10 text-blue-500">
                  <MessageSquare className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <span className="block text-lg font-bold text-slate-800 dark:text-slate-100">{stats.totalInterviews}</span>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Mock Interview</span>
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-2xl border-slate-100 dark:border-white/5 bg-white dark:bg-slate-900/50 shadow-sm">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-violet-500/10 text-violet-500">
                  <ListChecks className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <span className="block text-lg font-bold text-slate-800 dark:text-slate-100">{stats.totalQuizAttempts}</span>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Quiz đã làm</span>
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-2xl border-slate-100 dark:border-white/5 bg-white dark:bg-slate-900/50 shadow-sm">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-rose-500/10 text-rose-500 animate-pulse">
                  <TrendingUp className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <span className="block text-lg font-bold text-rose-500">{stats.readinessScore}%</span>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Điểm sẵn sàng</span>
                </div>
              </CardContent>
            </Card>
          </div>
        )} */}

        {/* Edit Info Form in a separate Card */}
        <Card className="rounded-3xl border-slate-100 dark:border-white/5 bg-white dark:bg-slate-900/50 shadow-sm">
          {/* <CardHeader className="pb-3 border-b border-slate-50 dark:border-white/5">
            <CardTitle className="text-base font-bold text-slate-800 dark:text-slate-200">
              Thông tin chi tiết
            </CardTitle>
          </CardHeader> */}
          <CardContent className="p-6 space-y-6">
            {/* Drag and drop avatar upload area */}
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-400">Ảnh đại diện (Avatar)</label>

              <div className="flex flex-col md:flex-row items-center gap-6 p-4 rounded-2xl bg-slate-50/50 dark:bg-white/3 border border-slate-100 dark:border-white/5">
                <Avatar className="h-16 w-16 shrink-0 border border-slate-200 dark:border-white/10">
                  <AvatarImage key={avatarSrc} src={avatarSrc} alt={name} />
                  <AvatarFallback className="text-xl font-bold bg-slate-100 dark:bg-white/5">{name.charAt(0)}</AvatarFallback>
                </Avatar>

                {/* Drag and Drop Zone */}
                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={() => document.getElementById("avatar-file-input")?.click()}
                  className={cn(
                    "flex-1 w-full border-2 border-dashed rounded-xl p-5 flex flex-col items-center justify-center cursor-pointer transition-all duration-250 text-center gap-1.5",
                    isDragOver
                      ? "border-primary bg-primary/5 scale-[0.99]"
                      : "border-slate-200 hover:border-slate-300 dark:border-white/10 dark:hover:border-white/20 bg-white dark:bg-slate-950/20"
                  )}
                >
                  <UploadCloud className={cn("h-6 w-6 text-slate-400", isUploadingAvatar && "animate-bounce")} />
                  <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    {isUploadingAvatar ? "Đang tải ảnh..." : "Kéo thả ảnh vào đây, hoặc nhấp để chọn"}
                  </span>
                  <span className="text-[10px] text-slate-400 font-medium">
                    Hỗ trợ JPEG, PNG, WebP, GIF. Tối đa 5MB.
                  </span>
                  <input
                    id="avatar-file-input"
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/gif"
                    className="hidden"
                    disabled={isUploadingAvatar}
                    onChange={(event) =>
                      handleAvatarUpload(event.target.files?.[0] ?? null)
                    }
                  />
                </div>
              </div>
            </div>

            {/* Fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-400">Họ và tên</label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Nhập họ và tên"
                  className="rounded-xl border-slate-200 dark:border-white/10 focus:ring-primary focus:border-primary bg-slate-50/30 focus:bg-white transition-all"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-400">Địa chỉ Email</label>
                <Input
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Nhập địa chỉ email"
                  className="rounded-xl border-slate-200 dark:border-white/10 focus:ring-primary focus:border-primary bg-slate-50/30 focus:bg-white transition-all"
                />
              </div>
            </div>

            {/* Actions button */}
            <div className="flex gap-2 pt-2 justify-end border-t border-slate-50 dark:border-white/5">
              <Button
                type="button"
                variant="ghost"
                onClick={handleCancel}
                disabled={isSaving}
                className="rounded-xl text-xs font-bold px-4 py-2 hover:bg-slate-100 dark:hover:bg-white/5"
              >
                Hủy thay đổi
              </Button>
              <Button
                type="button"
                onClick={handleSave}
                disabled={isSaving}
                className="rounded-xl text-xs font-bold px-5 py-2 bg-rose-500 hover:bg-rose-600 text-white shadow-md hover:shadow-lg transition-all"
              >
                {isSaving ? "Đang cập nhật..." : "Cập nhật thông tin"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
