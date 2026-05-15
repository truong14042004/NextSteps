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
  const navLinkClass =
    "inline-flex h-9 items-center gap-1.5 rounded-full px-3 text-sm font-semibold text-foreground/85 transition-colors hover:bg-primary/10 hover:text-primary"
  const activeNavLinkClass =
    "inline-flex h-9 items-center gap-1.5 rounded-full bg-primary/10 px-3 text-sm font-semibold text-primary"

  return (
    <header className="sticky top-0 z-50 border-b bg-background/70 backdrop-blur-md">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          <Link href={isRecruiter ? "/explore" : "/"} className="flex items-center gap-2">
            <Image
              src="/logo.png"
              alt="NextStep logo"
              width={36}
              height={36}
              className="rounded-md object-contain"
              priority
            />
            <span className="text-lg font-semibold tracking-tight">NextStep</span>
          </Link>

          <nav className="hidden items-center gap-3 md:flex">
            <Link href="/explore" className={activeNavLinkClass}>
              <Compass className="size-4" />
              Khám phá
            </Link>
            {!isRecruiter && (
              <>
                <Link href="/#features" className={navLinkClass}>
                  Tính năng
                </Link>
                <Link href="/#reviews" className={navLinkClass}>
                  Đánh giá
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

          {isRecruiter ? (
            <ExploreAccountMenu user={{ name: user.name, imageUrl: user.imageUrl }} />
          ) : (
            <HomeAccountMenu user={user} plan={plan} />
          )}
        </div>
      </div>
    </header>
  )
}
