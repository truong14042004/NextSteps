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

          <nav className="hidden items-center gap-6 md:flex">
            <Link
              href="/explore"
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-foreground transition-colors hover:text-foreground"
            >
              <Compass className="size-4" />
              Khám phá
            </Link>
            {!isRecruiter && (
              <>
                <Link
                  href="/#features"
                  className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
                >
                  Tính năng
                </Link>
                <Link
                  href="/#reviews"
                  className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
                >
                  Đánh giá
                </Link>
                <Link
                  href="/#pricing"
                  className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
                >
                  Bảng giá
                </Link>
                <Link
                  href="/#faq"
                  className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
                >
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
