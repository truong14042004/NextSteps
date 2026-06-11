"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { Crown, LogOut } from "lucide-react"
import { useState } from "react"

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { UserAvatar } from "@/features/users/components/UserAvatar"
import { cn } from "@/lib/utils"

type HomeAccountMenuProps = {
  user: {
    name: string
    imageUrl: string
    role: string
  }
  plan: {
    planKey: string
    planName: string
    resetText: string
  }
}

export function HomeAccountMenu({ user, plan }: HomeAccountMenuProps) {
  const router = useRouter()
  const [isSigningOut, setIsSigningOut] = useState(false)
  const isPaidPlan = plan.planKey !== "free"
  const isRecruiter = user.role === "recruiter"
  const isAdmin = user.role === "admin"

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
    <div className="flex items-center gap-3">
      {/* Badge gói hiện tại */}
      {!isAdmin && (
        <span
          className={cn(
            "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold select-none transition-colors",
            isPaidPlan
              ? "border-amber-500/30 bg-amber-500/10 text-amber-300"
              : "border-slate-800 bg-slate-900 text-slate-400"
          )}
        >
          <Crown className="size-3 text-amber-400 shrink-0" />
          <span className="truncate">Gói {plan.planName}</span>
        </span>
      )}

      {/* Nút Dashboard */}
      {!isRecruiter && (
        <Link href={isAdmin ? "/admin" : "/app"}>
          <Button
            variant="outline"
            size="sm"
            className="rounded-full border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100 hover:text-slate-900 dark:border-white/10 dark:bg-white/5 dark:text-slate-200 dark:hover:bg-white/10 dark:hover:text-white transition-all text-xs font-semibold px-4 h-8"
          >
            Dashboard
          </Button>
        </Link>
      )}

      {/* Avatar & Dropdown */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            className="flex items-center rounded-full outline-none transition-opacity hover:opacity-90 focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            aria-label="Mở menu tài khoản"
          >
            <UserAvatar user={user} />
          </button>
        </DropdownMenuTrigger>

        <DropdownMenuContent align="end" className="w-60 rounded-3xl p-4 border border-white/10 shadow-2xl bg-slate-950 text-slate-200">
          <div className="flex items-center gap-3 mb-3">
            <UserAvatar user={user} className="size-10" />
            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-bold text-slate-200 truncate">{user.name}</h4>
              <p className="text-[11px] text-slate-400 truncate capitalize mt-0.5">
                {user.role === 'admin' ? 'Quản trị viên' : user.role === 'recruiter' ? 'Nhà tuyển dụng' : 'Thành viên'}
              </p>
            </div>
          </div>

          <DropdownMenuSeparator className="my-2 bg-white/5 border-none" />

          <DropdownMenuItem
            onClick={handleSignOut}
            disabled={isSigningOut}
            className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl cursor-pointer transition-colors text-rose-400 hover:bg-rose-950/20 focus:bg-rose-950/20 focus:text-rose-300"
          >
            <LogOut className="size-4 shrink-0" />
            <span className="text-sm font-bold">Đăng xuất</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}
