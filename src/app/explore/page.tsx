import { redirect } from "next/navigation"

import { ExploreHeader } from "@/components/explore/explore-header"
import { ExplorePage } from "@/app/app/explore/_ExplorePage"
import {
  getMyActiveApplicationPostIds,
  getMyExplorePosts,
  getMyRecruiterRequest,
  getPublishedExplorePosts,
} from "@/features/explore/db"
import { getPlanSummaryForUser } from "@/features/plans/entitlements"
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

  const [posts, myRequest, myPosts, plan, appliedPostIds] = await Promise.all([
    getPublishedExplorePosts(),
    getMyRecruiterRequest(userId),
    getMyExplorePosts(userId),
    getPlanSummaryForUser(userId),
    getMyActiveApplicationPostIds(userId),
  ])

  return (
    <div className="min-h-screen bg-background">
      <ExploreHeader
        user={{ name: user.name, imageUrl: user.imageUrl, role: user.role }}
        plan={plan}
      />

      <ExplorePage
        currentUser={{ id: userId, name: user.name, role: user.role, imageUrl: user.imageUrl }}
        posts={posts}
        myRequest={myRequest ?? null}
        myPosts={myPosts}
        appliedPostIds={appliedPostIds}
      />
    </div>
  )
}
