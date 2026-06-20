"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Compass, LogOut, User as UserIcon } from "lucide-react"

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ThemeToggle } from "@/components/ThemeToggle"
import { UserAvatar } from "@/features/users/components/UserAvatar"

export function RecruiterHeader({
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
    <header className="sticky top-0 z-40 h-16 border-b border-border/40 bg-background/60 backdrop-blur-md px-6">
      <div className="flex h-full items-center justify-between">
        <Link href="/recruiter" className="flex items-center gap-3">
          <span className="text-lg font-bold tracking-tight text-foreground flex items-center gap-1.5">
            Nhà tuyển dụng
            <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
          </span>
        </Link>

        <div className="flex items-center gap-4">
          <Link
            href="/explore"
            className="inline-flex h-9 items-center gap-2 rounded-full border border-primary/15 bg-primary/5 px-4 text-xs font-semibold uppercase tracking-wider text-primary transition-all duration-200 hover:bg-primary/10 hover:shadow-sm active:scale-95"
          >
            <Compass className="size-3.5" />
            Khám phá
          </Link>
          <ThemeToggle />

          {mounted && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  aria-label="Account"
                  className="group relative flex items-center justify-center rounded-full p-[2px] transition-transform duration-200 hover:scale-105 active:scale-95 focus:outline-none"
                >
                  <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-primary to-orange-500 opacity-70 group-hover:opacity-100 transition-opacity" />
                  <UserAvatar
                    user={{
                      name: user.name,
                      imageUrl: user.imageUrl ?? "/avatar.png",
                    }}
                    className="relative h-8 w-8 rounded-full border-2 border-background object-cover shadow-sm"
                  />
                </button>
              </DropdownMenuTrigger>

              <DropdownMenuContent align="end" className="w-60 rounded-3xl p-4 border border-zinc-100 dark:border-zinc-800/80 shadow-xl bg-white dark:bg-zinc-950 text-zinc-800 dark:text-zinc-200 mt-2">
                <div className="flex items-center gap-3 mb-3">
                  <UserAvatar
                    user={{
                      name: user.name,
                      imageUrl: user.imageUrl ?? "/avatar.png",
                    }}
                    className="size-10"
                  />
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 truncate">{user.name}</h4>
                    <p className="text-[11px] text-zinc-500 dark:text-zinc-400 truncate mt-0.5">
                      Nhà tuyển dụng
                    </p>
                  </div>
                </div>

                <div className="h-px bg-zinc-100 dark:bg-zinc-800/80 my-2" />

                <DropdownMenuItem asChild className="flex items-center gap-2.5 px-3 py-2 rounded-xl cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-850 focus:bg-zinc-100 dark:focus:bg-zinc-850">
                  <Link href="/profile">
                    <UserIcon className="h-4 w-4 shrink-0 text-zinc-500 dark:text-zinc-400" />
                    <span className="text-sm font-medium">Hồ sơ</span>
                  </Link>
                </DropdownMenuItem>

                <DropdownMenuItem
                  onSelect={handleSignOut}
                  disabled={isSigningOut}
                  className="flex items-center gap-2.5 px-3 py-2 rounded-xl cursor-pointer text-red-600 dark:text-rose-400 hover:bg-red-50 dark:hover:bg-rose-950/20 focus:bg-red-50 dark:focus:bg-rose-950/20 focus:text-red-600 dark:focus:text-rose-300 mt-1"
                >
                  <LogOut className="h-4 w-4 shrink-0" />
                  <span className="text-sm font-medium">Đăng xuất</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>
    </header>
  )
}
