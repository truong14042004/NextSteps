"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarChart3, CreditCard, Package, Settings, Users } from "lucide-react";

import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

const menu = [
  {
    id: "dashboard",
    label: "Tổng quan",
    icon: BarChart3,
    href: "/admin",
  },
  {
    id: "user-management",
    label: "Quản lý người dùng",
    icon: Users,
    href: "/admin/user-management",
  },
  {
    id: "revenue-management",
    label: "Quản lý doanh thu",
    icon: CreditCard,
    href: "/admin/revenue-management",
  },
  {
    id: "plan-management",
    label: "Quản lý gói mua",
    icon: Package,
    href: "/admin/plan-management",
  },
  {
    id: "settings",
    label: "Cài đặt",
    icon: Settings,
    href: "/admin/settings",
  },
];

export function AdminSidebar() {
  const pathname = usePathname() ?? "";

  return (
    <aside className="sticky top-0 h-screen w-64 shrink-0 border-r bg-background">
      <div className="flex h-full flex-col">
        <div className="px-5 py-5">
          <div className="text-base font-semibold tracking-tight">
            NextStep Admin
          </div>
          <div className="mt-1 text-xs text-muted-foreground">
            Executive Control
          </div>

          <div className="mt-4">
            <Badge
              variant="outline"
              className="w-fit border-primary/20 bg-primary/5 text-primary"
            >
              Admin
            </Badge>
          </div>
        </div>

        <nav className="flex-1 overflow-auto px-3 pb-4">
          <div className="space-y-1.5">
            {menu.map((item) => {
              const Icon = item.icon;

              const isActive =
                item.href === "/admin"
                  ? pathname === "/admin"
                  : pathname === item.href ||
                    pathname.startsWith(item.href + "/");

              return (
                <Link
                  key={item.id}
                  href={item.href}
                  className={cn(
                    "group relative flex w-full items-center gap-3 overflow-hidden rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200",
                    isActive
                      ? "bg-primary/10 text-primary shadow-sm"
                      : "text-muted-foreground hover:bg-accent/70 hover:text-foreground",
                  )}
                >
                  <span
                    className={cn(
                      "absolute left-0 top-1/2 h-0 w-1 -translate-y-1/2 rounded-r-full bg-primary transition-all duration-200",
                      isActive ? "h-7" : "h-0 group-hover:h-5",
                    )}
                  />

                  <span
                    className={cn(
                      "flex h-8 w-8 items-center justify-center rounded-lg transition-all duration-200",
                      isActive
                        ? "bg-primary/10 text-primary"
                        : "text-muted-foreground group-hover:bg-accent group-hover:text-foreground",
                    )}
                  >
                    <Icon
                      className={cn(
                        "h-4 w-4 shrink-0 transition-transform duration-200",
                        isActive && "scale-110",
                      )}
                    />
                  </span>

                  <span className="truncate">{item.label}</span>
                </Link>
              );
            })}
          </div>
        </nav>

        <div className="border-t px-4 py-4 text-center text-xs text-muted-foreground">
          <div>© 2026 NextStep</div>
        </div>
      </div>
    </aside>
  );
}
