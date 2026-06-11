import Image from "next/image"
import Link from "next/link"
import { Compass } from "lucide-react"

import { ExploreAccountMenu } from "@/components/explore/explore-account-menu"
import { HomeAccountMenu } from "@/components/home/home-account-menu"

type ExploreHeaderProps = {
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

export function ExploreHeader({ user, plan }: ExploreHeaderProps) {
  const isRecruiter = user.role === "recruiter"
  const isAdmin = user.role === "admin"
  
  const activeNavLinkClass =
    "inline-flex h-10 items-center gap-1.5 rounded-full bg-slate-100 dark:bg-white/10 px-4 text-sm font-semibold text-foreground dark:text-white transition-all duration-200"
  const navLinkClass =
    "inline-flex h-10 items-center gap-1.5 rounded-full px-4 text-sm font-semibold text-slate-600 dark:text-slate-300 transition-all duration-200 hover:bg-slate-100 dark:hover:bg-white/10 hover:text-foreground dark:hover:text-white"

  return (
    <>
      <header className="pointer-events-none fixed left-0 right-0 top-4 z-50">
        <div className="container mx-auto px-4">
          <div className="relative flex h-14 items-center justify-between">
            {/* Left: logo */}
            <Link
              href={isRecruiter ? "/explore" : "/"}
              className="pointer-events-auto inline-flex h-12 w-12 items-center justify-center rounded-2xl border border-slate-200 dark:border-white/10 bg-white/75 dark:bg-slate-950/35 shadow-lg shadow-black/5 dark:shadow-black/20 backdrop-blur-xl transition-all hover:bg-slate-100 dark:hover:bg-white/10"
            >
              <Image
                src="/logo.png"
                alt="NextStep logo"
                width={34}
                height={34}
                className="object-contain"
                priority
              />
            </Link>

            {/* Middle: floating nav */}
            <nav className="pointer-events-auto hidden items-center gap-1 rounded-full border border-slate-200 dark:border-white/10 bg-white/75 dark:bg-slate-950/55 px-2 py-1.5 shadow-2xl shadow-black/5 dark:shadow-black/25 backdrop-blur-2xl md:flex absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
              <Link href="/explore" className={activeNavLinkClass}>
                <Compass className="size-4" />
                Khám phá
              </Link>
              {!isRecruiter && (
                <>
                  <Link href="/" className={navLinkClass}>
                    Trang chủ
                  </Link>
                  <Link href="/#features" className={navLinkClass}>
                    Tính năng
                  </Link>
                  {!isAdmin && (
                    <Link href="/#pricing" className={navLinkClass}>
                      Bảng giá
                    </Link>
                  )}
                  <Link href="/#faq" className={navLinkClass}>
                    FAQ
                  </Link>
                </>
              )}
            </nav>

            {/* Right: account */}
            <div className="pointer-events-auto flex items-center gap-3 rounded-full border border-slate-200 dark:border-white/10 bg-white/75 dark:bg-slate-950/35 px-2 py-1.5 shadow-lg shadow-black/5 dark:shadow-black/20 backdrop-blur-xl">
              {isRecruiter ? (
                <ExploreAccountMenu user={{ name: user.name, imageUrl: user.imageUrl }} />
              ) : (
                <HomeAccountMenu user={user} plan={plan} />
              )}
            </div>
          </div>
        </div>
      </header>
      {/* Spacer to prevent content overlap */}
      <div className="h-20" />
    </>
  )
}
