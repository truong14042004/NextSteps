"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  BriefcaseBusiness,
  CreditCard,
  MessageSquareText,
  Newspaper,
  Package,
  ReceiptText,
  Settings,
  Users,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { AppLogo } from "@/components/ui/AppLogo";

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
    id: "recruiter-management",
    label: "Quản lý nhà tuyển dụng",
    icon: BriefcaseBusiness,
    href: "/admin/recruiter-management",
  },
  {
    id: "post-management",
    label: "Quản lý bài viết",
    icon: Newspaper,
    href: "/admin/post-management",
  },
  {
    id: "revenue-management",
    label: "Quản lý doanh thu",
    icon: CreditCard,
    href: "/admin/revenue-management",
  },
  {
    id: "transaction-management",
    label: "Quản lý giao dịch",
    icon: ReceiptText,
    href: "/admin/transaction-management",
  },
  {
    id: "plan-management",
    label: "Quản lý gói mua",
    icon: Package,
    href: "/admin/plan-management",
  },
  {
    id: "service-reviews",
    label: "Đánh giá dịch vụ",
    icon: MessageSquareText,
    href: "/admin/service-reviews",
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
    <aside className="sticky top-0 h-screen w-64 shrink-0 border-r border-border/40 bg-card/60 backdrop-blur-md shadow-sm">
      <div className="flex h-full flex-col">
        {/* Sidebar Header */}
        <div className="h-16 px-6 flex items-center border-b border-border/40">
          <AppLogo
            href="/admin"
            textClassName="text-base font-bold tracking-tight text-foreground bg-gradient-to-r from-red-600 to-rose-500 bg-clip-text text-transparent"
            imageSize={30}
          />
        </div>

        {/* Sidebar Menu */}
        <nav className="flex-1 overflow-y-auto px-4 py-6 scrollbar-thin">
          <div className="space-y-1">
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
                      ? "bg-gradient-to-r from-primary/10 to-primary/5 text-primary shadow-sm shadow-primary/5"
                      : "text-muted-foreground hover:bg-accent/50 hover:text-foreground",
                  )}
                >
                  {/* Left Active Indicator */}
                  <span
                    className={cn(
                      "absolute left-0 top-1/2 w-[3px] -translate-y-1/2 rounded-r-full bg-primary transition-all duration-300 ease-out",
                      isActive ? "h-6" : "h-0 group-hover:h-4",
                    )}
                  />

                  {/* Icon Wrapper */}
                  <span
                    className={cn(
                      "flex h-8 w-8 items-center justify-center rounded-lg transition-all duration-200",
                      isActive
                        ? "bg-gradient-to-br from-primary/15 to-primary/5 text-primary shadow-sm"
                        : "text-muted-foreground group-hover:bg-accent group-hover:text-foreground",
                    )}
                  >
                    <Icon
                      className={cn(
                        "h-4.5 w-4.5 shrink-0 transition-transform duration-200",
                        isActive && "scale-105",
                      )}
                    />
                  </span>

                  <span className="truncate tracking-wide">{item.label}</span>
                </Link>
              );
            })}
          </div>
        </nav>

        {/* Sidebar Footer */}
        <div className="border-t border-border/40 px-6 py-4 flex items-center justify-between text-xs text-muted-foreground/80">
          <span>© 2026 NextStep</span>
          <span className="rounded-full bg-muted px-2 py-0.5 font-mono text-[10px] border border-border/30">
            v1.2.0
          </span>
        </div>
      </div>
    </aside>
  );
}
