"use client"

import {
  BrainCircuitIcon,
  LogOut,
  User,
} from "lucide-react"
import { ThemeToggle } from "@/components/ThemeToggle"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { SignOutButton, useClerk } from "@clerk/nextjs"
import Link from "next/link"
import { UserAvatar } from "@/features/users/components/UserAvatar"
import { useState, useEffect } from "react"

export function Navbar({ user }: { user: { name: string; imageUrl: string } }) {
  const { openUserProfile } = useClerk()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  return (
    <nav className="h-header border-b">
      <div className="container flex h-full items-center justify-between">
        <Link href="/app" className="flex items-center gap-2">
          <BrainCircuitIcon className="size-8 text-primary" />
          <span className="text-xl font-bold">Landr</span>
        </Link>

        <div className="flex items-center gap-4">

          <ThemeToggle />

          {mounted && (
            <DropdownMenu>
              <DropdownMenuTrigger>
                <UserAvatar user={user} />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuItem onClick={() => openUserProfile()}>
                  <User className="mr-2" />
                  Profile
                </DropdownMenuItem>
                <SignOutButton>
                  <DropdownMenuItem>
                    <LogOut className="mr-2" />
                    Logout
                  </DropdownMenuItem>
                </SignOutButton>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>
    </nav>
  )
}
