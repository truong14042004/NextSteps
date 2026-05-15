"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Home, LogOut, User as UserIcon } from "lucide-react"

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ThemeToggle } from "@/components/ThemeToggle"
import { UserAvatar } from "@/features/users/components/UserAvatar"

export function AdminHeader({
  user,
}: {
  user: { name: string; imageUrl?: string }
}) {
  const router = useRouter()
  const [mounted, setMounted] = useState(false)
  const [isSigningOut, setIsSigningOut] = useState(false)

  useEffect(() => setMounted(true), [])

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

  return (
    <header className="h-16 border-b bg-background/70">
      <div className="container mx-auto flex h-full items-center justify-between">
        <Link href="/admin" className="flex items-center gap-3">
          <span className="text-lg font-semibold">Admin Panel</span>
        </Link>

        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="inline-flex h-9 items-center gap-2 rounded-full border border-primary/15 bg-primary/5 px-3 text-sm font-semibold text-primary transition-colors hover:bg-primary/10"
          >
            <Home className="size-4" />
            Trang chủ
          </Link>
          <ThemeToggle />

          {mounted && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  aria-label="Account"
                  className="rounded-full focus:outline-none"
                >
                  <UserAvatar
                    user={{
                      name: user.name,
                      imageUrl: user.imageUrl ?? "/avatar.png",
                    }}
                    className="h-9 w-9"
                  />
                </button>
              </DropdownMenuTrigger>

              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuItem asChild>
                  <Link href="/admin/profile">
                    <UserIcon className="mr-2 h-4 w-4" />
                    Hồ sơ
                  </Link>
                </DropdownMenuItem>

                <DropdownMenuItem
                  onSelect={handleSignOut}
                  disabled={isSigningOut}
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Đăng xuất
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>
    </header>
  )
}
