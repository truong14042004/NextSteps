"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { BrainCircuitIcon, LogOut, User, Lock } from "lucide-react"
import { toast } from "sonner"

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

export default function ProfileClient({
  user,
}: {
  user: { name: string; email: string; imageUrl: string }
}) {
  const router = useRouter()
  const [isSigningOut, setIsSigningOut] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [name, setName] = useState(user.name)
  const [email, setEmail] = useState(user.email)

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

    // Validate email format
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
        body: JSON.stringify({ name, email }),
      })

      if (!response.ok) {
        toast.error("Cập nhật thất bại")
        return
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
    setName(user.name)
    setEmail(user.email)
  }

  return (
    <>
      {/* NAVBAR */}
      <nav className="h-header border-b">
        <div className="container flex h-full items-center justify-between">
          <Link href="/app" className="flex items-center gap-2">
            <BrainCircuitIcon className="size-8 text-primary" />
            <span className="text-xl font-bold">Landr</span>
          </Link>

          <div className="flex items-center gap-4">
            <ThemeToggle />

            <DropdownMenu>
              <DropdownMenuTrigger>
                <UserAvatar user={user} />
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

      {/* PROFILE CARD */}
      <div className="container max-w-3xl py-10">
        <Card className="rounded-2xl shadow-sm">
          <CardHeader className="flex flex-row items-center gap-4">
            <Avatar className="h-16 w-16">
              <AvatarImage src={user.imageUrl} />
              <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
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