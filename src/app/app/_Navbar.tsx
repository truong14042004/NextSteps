"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Crown, LogOut, User } from "lucide-react";
import Link from "next/link";
import { ThemeToggle } from "@/components/ThemeToggle";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { UserAvatar } from "@/features/users/components/UserAvatar";
import { cn } from "@/lib/utils";

type PlanSummary = {
  planKey: string;
  planName: string;
  resetText: string;
};

export function Navbar({
  user,
  plan,
}: {
  user: { name: string; imageUrl: string };
  plan: PlanSummary;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const isPaidPlan = plan.planKey !== "free";
  const title = useMemo(() => resolveTitle(pathname), [pathname]);

  useEffect(() => setMounted(true), []);

  async function handleSignOut() {
    if (isSigningOut) return;
    setIsSigningOut(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.push("/");
      router.refresh();
    } finally {
      setIsSigningOut(false);
    }
  }

  // Navbar is NOT sticky here; it sits inside right column so it won't overlap sidebar.
  return (
    <nav className="h-16 border-b bg-background/70">
      <div className="container flex h-full items-center justify-between">
        <Link href="/app" className="flex items-center gap-2">
          <span className="text-xl font-bold">{title}</span>
        </Link>

        <div className="flex items-center gap-4">
          <ThemeToggle />

          {mounted && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  className="flex min-w-0 items-center gap-2 rounded-full outline-none transition-opacity hover:opacity-90 focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                  aria-label="Mở menu tài khoản"
                >
                  <span
                    className={cn(
                      "hidden max-w-32 items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold sm:inline-flex",
                      isPaidPlan
                        ? "border-amber-300/70 bg-amber-50 text-amber-700 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-300"
                        : "border-border bg-muted text-muted-foreground",
                    )}
                  >
                    <Crown className="size-3.5 shrink-0" />
                    <span className="truncate">Gói {plan.planName}</span>
                  </span>
                  <UserAvatar user={user} />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <div className="px-2 py-2">
                  <div
                    className={cn(
                      "rounded-lg border px-3 py-2",
                      isPaidPlan
                        ? "border-amber-300/70 bg-amber-50/80 text-amber-900 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-100"
                        : "border-border bg-muted/60",
                    )}
                  >
                    <div className="flex items-center justify-between gap-2 text-sm font-semibold">
                      <span className="flex items-center gap-2">
                        <Crown className="size-4" />
                        Gói hiện tại
                      </span>
                      <span className="truncate">{plan.planName}</span>
                    </div>
                    <p className="mt-1 truncate text-xs text-muted-foreground">
                      {plan.resetText}
                    </p>
                  </div>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => router.push("/profile")}
                  disabled={isSigningOut}
                >
                  <User className="mr-2" />
                  {user.name}
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
          )}
        </div>
      </div>
    </nav>
  );
}

function resolveTitle(pathname: string | null): string {
  if (!pathname) return "NextStep";

  // Top-level sections
  if (pathname === "/app") return "Tổng quan";
  if (pathname.startsWith("/app/analyze")) return "Phân tích CV / JD";
  if (pathname.startsWith("/app/interview")) return "Phỏng vấn với AI";
  if (pathname.startsWith("/app/upgrade")) return "Nâng cấp gói";
  if (pathname.startsWith("/app/explore")) return "Khám phá";

  // Quiz hub (cross-job)
  if (pathname === "/app/quizzes") return "Trắc nghiệm";

  // Job-info nested
  if (pathname.startsWith("/app/job-infos/")) {
    if (/\/quizzes\/[^/]+\/attempts\//.test(pathname)) return "Làm bài quiz";
    if (pathname.endsWith("/quizzes") || /\/quizzes\/[^/]+$/.test(pathname))
      return "Trắc nghiệm";
    if (pathname.endsWith("/quizzes/new")) return "Tạo bộ đề";
    if (pathname.includes("/interviews")) return "Phỏng vấn thử";
    if (pathname.includes("/questions")) return "Câu hỏi luyện tập";
    if (pathname.includes("/resume")) return "Đánh giá CV";
    if (pathname.endsWith("/edit")) return "Sửa thông tin vị trí";
    return "Vị trí công việc";
  }

  return "NextStep";
}
