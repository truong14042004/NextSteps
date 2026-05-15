import Image from "next/image"
import Link from "next/link"
import { ArrowRight } from "lucide-react"

import { Button } from "@/components/ui/button"
import { ExploreAccountMenu } from "@/components/explore/explore-account-menu"

type ExploreHeaderProps = {
  user: {
    name: string
    imageUrl: string
    role: string
  }
}

export function ExploreHeader({ user }: ExploreHeaderProps) {
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
            {!isRecruiter && (
              <Link
                href="/"
                className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
              >
                Home
              </Link>
            )}
            <Link
              href="/explore"
              className="text-sm font-semibold text-foreground"
            >
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
                  href="/#pricing"
                  className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
                >
                  Bảng giá
                </Link>
              </>
            )}
          </nav>

          {isRecruiter ? (
            <ExploreAccountMenu user={{ name: user.name, imageUrl: user.imageUrl }} />
          ) : (
            <Button asChild className="rounded-xl">
              <Link href="/app">
                Dashboard <ArrowRight className="ml-2 size-4" />
              </Link>
            </Button>
          )}
        </div>
      </div>
    </header>
  )
}
