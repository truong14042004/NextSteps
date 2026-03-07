"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { 
  FileSearch, 
  MessageSquare,
  BrainCircuitIcon 
} from "lucide-react"

export function Sidebar() {
  const pathname = usePathname()

  const menuItems = [
    {
      id: "analyze",
      label: "Phân tích CV/JD",
      icon: FileSearch,
      href: "/app",
      description: "Upload CV và nhập JD để phân tích",
    },
    {
      id: "interview",
      label: "Phỏng vấn AI",
      icon: MessageSquare,
      href: "/app/interview",
      description: "Mock interview với AI",
    },
  ]

  return (
    <aside className="w-60 border-r bg-card h-screen sticky top-0 flex flex-col">
      {/* Header */}
      <div className="p-6 border-b">
        <Link href="/app" className="flex items-center gap-2">
          <BrainCircuitIcon className="size-8 text-primary" />
          <h1 className="text-xl font-bold">Landr</h1>
        </Link>
      </div>

      {/* Menu Items */}
      <nav className="flex-1 p-4 space-y-1">
        {menuItems.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href

          return (
            <Link
              key={item.id}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors",
                "hover:bg-accent hover:text-accent-foreground",
                isActive && "bg-primary text-primary-foreground hover:bg-primary/90"
              )}
            >
              <Icon className="size-5 shrink-0" />
              <span className="text-sm font-medium">{item.label}</span>
            </Link>
          )
        })}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t text-xs text-muted-foreground text-center">
        <p>© 2026 </p>
      </div>
    </aside>
  )
}
