import Image from "next/image"
import Link from "next/link"
import { redirect } from "next/navigation"
import { ArrowRight } from "lucide-react"

import { Button } from "@/components/ui/button"
import { ExplorePage } from "@/app/app/explore/_ExplorePage"
import {
  getMyExplorePosts,
  getMyRecruiterRequest,
  getPublishedExplorePosts,
} from "@/features/explore/db"
import { getCurrentUser } from "@/services/clerk/lib/getCurrentUser"

export const metadata = {
  title: "Khám phá cơ hội & hồ sơ ứng viên | NextStep",
  description:
    "Khám phá bài tuyển dụng, hồ sơ ứng viên và kết nối cộng đồng nghề nghiệp trên NextStep.",
}

export default async function ExploreHomePage() {
  const { userId, user } = await getCurrentUser({ allData: true })

  if (userId == null || user == null) {
    redirect("/sign-in")
  }

  const [posts, myRequest, myPosts] = await Promise.all([
    getPublishedExplorePosts(),
    getMyRecruiterRequest(userId),
    getMyExplorePosts(userId),
  ])

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 border-b bg-background/70 backdrop-blur-md">
        <div className="container mx-auto px-4">
          <div className="flex h-16 items-center justify-between">
            <Link href="/" className="flex items-center gap-2">
              <Image
                src="/logo.png"
                alt="NextStep logo"
                width={36}
                height={36}
                className="rounded-md object-contain"
                priority
              />
              <span className="text-lg font-semibold tracking-tight">
                NextStep
              </span>
            </Link>

            <nav className="hidden items-center gap-6 md:flex">
              <Link
                href="/"
                className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
              >
                Home
              </Link>
              <Link
                href="/explore"
                className="text-sm font-semibold text-foreground"
              >
                Khám phá
              </Link>
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
            </nav>

            <Button asChild className="rounded-xl">
              <Link href="/app">
                Dashboard <ArrowRight className="ml-2 size-4" />
              </Link>
            </Button>
          </div>
        </div>
      </header>

      <ExplorePage
        currentUser={{ id: userId, name: user.name, role: user.role }}
        posts={posts}
        myRequest={myRequest ?? null}
        myPosts={myPosts}
      />
    </div>
  )
}
