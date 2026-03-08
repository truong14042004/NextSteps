"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { FileSearch, MessageSquare } from "lucide-react";
import { AppLogo } from "@/components/ui/AppLogo";

export function Sidebar() {
  const pathname = usePathname();

  const menuItems = [
    { id: "analyze", label: "Phân tích CV", icon: FileSearch, href: "/app" },
    {
      id: "interview",
      label: "Phỏng vấn với AI",
      icon: MessageSquare,
      href: "/app/interview",
    },
  ];

  return (
    <aside className="hidden md:flex md:flex-col w-60 flex-shrink-0 h-screen sticky top-0 left-0 z-20 border-r bg-card/70 backdrop-blur box-border">
      {/* header area sized to match navbar height */}
      <div className="px-5 py-4 min-h-[64px] flex items-center">
        <AppLogo />
      </div>

      {/* nav scrolls internally if menu is long, but sidebar stays fixed */}
      <nav className="flex-1 overflow-auto p-3 space-y-1">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;

          return (
            <Link
              key={item.id}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
              )}
            >
              <Icon className="h-5 w-5 shrink-0" />
              <span className="truncate">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="border-t px-4 py-4 text-center text-xs text-muted-foreground">
        © 2026 NextStep
      </div>
    </aside>
  );
}
