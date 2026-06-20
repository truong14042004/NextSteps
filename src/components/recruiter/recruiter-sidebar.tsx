"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Compass, LayoutDashboard, Users } from "lucide-react";

import { cn } from "@/lib/utils";
import { AppLogo } from "@/components/ui/AppLogo";

const menu = [
  {
    id: "posts",
    label: "Quản lý bài đăng",
    icon: LayoutDashboard,
    href: "/recruiter",
  },
  {
    id: "applicants",
    label: "Quản lý ứng viên",
    icon: Users,
    href: "/recruiter/applicants",
  },
  {
    id: "explore",
    label: "Về trang Khám phá",
    icon: Compass,
    href: "/explore",
  },
];

export function RecruiterSidebar() {
  const pathname = usePathname() ?? "";

  return (
    <aside className="sticky top-0 h-screen w-64 shrink-0 border-r border-border/40 bg-card/60 backdrop-blur-md shadow-sm">
      <div className="flex h-full flex-col">
        <div className="h-16 px-6 flex items-center border-b border-border/40">
          <AppLogo
            href="/recruiter"
            textClassName="text-base font-bold tracking-tight bg-gradient-to-r from-red-600 to-rose-500 bg-clip-text text-transparent"
            imageSize={30}
          />
        </div>

        <nav className="flex-1 overflow-y-auto px-4 py-6 scrollbar-thin">
          <div className="space-y-1">
            {menu.map((item) => {
              const Icon = item.icon;

              const isActive =
                item.href === "/recruiter"
                  ? pathname === "/recruiter"
                  : pathname === item.href || pathname.startsWith(item.href + "/");

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
                  <span
                    className={cn(
                      "absolute left-0 top-1/2 w-[3px] -translate-y-1/2 rounded-r-full bg-primary transition-all duration-300 ease-out",
                      isActive ? "h-6" : "h-0 group-hover:h-4",
                    )}
                  />
                  <span
                    className={cn(
                      "flex h-8 w-8 items-center justify-center rounded-lg transition-all duration-200",
                      isActive
                        ? "bg-gradient-to-br from-primary/15 to-primary/5 text-primary shadow-sm"
                        : "text-muted-foreground group-hover:bg-accent group-hover:text-foreground",
                    )}
                  >
                    <Icon className="h-4.5 w-4.5 shrink-0" />
                  </span>
                  <span className="truncate tracking-wide">{item.label}</span>
                </Link>
              );
            })}
          </div>
        </nav>

        <div className="border-t border-border/40 px-6 py-4 text-xs text-muted-foreground/80">
          <span>© 2026 NextStep</span>
        </div>
      </div>
    </aside>
  );
}
