"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { LogOut, User, Lock, UploadCloud } from "lucide-react"
import { toast } from "sonner"

import { AppLogo } from "@/components/ui/AppLogo"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { ThemeToggle } from "@/components/ThemeToggle"

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

import { UserAvatar } from "@/features/users/components/UserAvatar"

type ProfileUser = {
  name: string
  email: string
  imageUrl: string
}

export default function ProfileClient({ user }: { user: ProfileUser }) {
  const router = useRouter()
  const [savedUser, setSavedUser] = useState(user)
  const [isSigningOut, setIsSigningOut] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false)
  const [name, setName] = useState(user.name)
  const [email, setEmail] = useState(user.email)
  const [imageUrl, setImageUrl] = useState(user.imageUrl)

  const avatarUser = {
    name,
    imageUrl,
  }

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

  return (
    <>
      <nav className="h-header border-b">
        <div className="container flex h-full items-center justify-between">
          <AppLogo href="/app" />

          <div className="flex items-center gap-4">
            <ThemeToggle />

            <DropdownMenu>
              <DropdownMenuTrigger>
                <UserAvatar user={avatarUser} />
              </DropdownMenuTrigger>

              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuItem>
                  <User className="mr-2" />
                  {name}
                </DropdownMenuItem>

                <DropdownMenuItem
                  onClick={handleSignOut}
                  disabled={isSigningOut}
                >
                  <LogOut className="mr-2" />
                  Đăng xuất
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </nav>

      <div className="container max-w-3xl py-10">
        <Card className="rounded-2xl shadow-sm">
          <CardHeader className="flex flex-row items-center gap-4">
            <Avatar className="h-16 w-16">
              <AvatarImage key={imageUrl} src={imageUrl} alt={name} />
              <AvatarFallback>{name.charAt(0)}</AvatarFallback>
            </Avatar>

            <div className="flex-1">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <CardTitle className="text-2xl">Hồ sơ</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Quản lý thông tin tài khoản
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-2"
                  onClick={() => router.push("/profile/change-password")}
                >
                  <Lock className="h-4 w-4" />
                  Thay đổi mật khẩu
                </Button>
              </div>
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            <div className="space-y-3 rounded-2xl border bg-muted/20 p-4">
              <label className="text-sm font-medium">Avatar</label>
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                <Avatar className="h-20 w-20">
                  <AvatarImage key={imageUrl} src={imageUrl} alt={name} />
                  <AvatarFallback>{name.charAt(0)}</AvatarFallback>
                </Avatar>

                <div className="space-y-2">
                  <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl border px-4 py-2 text-sm font-medium transition-colors hover:bg-accent">
                    <UploadCloud className="h-4 w-4" />
                    {isUploadingAvatar ? "Đang tải..." : "Tải avatar"}
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp,image/gif"
                      className="hidden"
                      disabled={isUploadingAvatar}
                      onChange={(event) =>
                        handleAvatarUpload(event.target.files?.[0] ?? null)
                      }
                    />
                  </label>
                  <p className="text-xs text-muted-foreground">
                    Hỗ trợ JPEG, PNG, WebP, GIF. Tối đa 5MB.
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Tên</label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Email</label>
              <Input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div className="flex gap-3">
              <Button
                onClick={handleSave}
                disabled={isSaving}
              >
                {isSaving ? "Đang cập nhật..." : "Cập nhật"}
              </Button>
              <Button
                variant="outline"
                onClick={handleCancel}
                disabled={isSaving}
              >
                Hủy
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  )
}
