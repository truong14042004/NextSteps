import { getExplorePostsForAdmin } from "@/features/explore/db"
import PostManagementClient from "./PostManagementClient"

const statuses = ["all", "pending", "published", "rejected", "hidden", "deleted"] as const

function getStatus(searchStatus?: string) {
  return statuses.includes(searchStatus as (typeof statuses)[number])
    ? (searchStatus as (typeof statuses)[number])
    : "pending"
}

export default async function AdminPostManagementPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>
}) {
  const { status: searchStatus } = await searchParams
  const status = getStatus(searchStatus)

  // Fetch filtered posts for the table list
  const posts = await getExplorePostsForAdmin(
    status === "all" ? undefined : status
  )

  // Fetch all posts to compute summary card metrics
  const allPosts = await getExplorePostsForAdmin(undefined)

  const stats = {
    total: allPosts.length,
    pending: allPosts.filter((p) => p.status === "pending").length,
    published: allPosts.filter((p) => p.status === "published").length,
    hidden: allPosts.filter((p) => p.status === "hidden").length,
  }

  // Typecast comments and date formats if needed, then pass to Client Component
  const mappedPosts = posts.map((p) => ({
    ...p,
    author: p.author ? {
      ...p.author,
      imageUrl: p.author.imageUrl || null,
    } : null,
    comments: p.comments.map((c) => ({
      ...c,
      author: c.author ? {
        ...c.author,
        email: c.author.email || null,
      } : null,
    })),
  }))

  return (
    <PostManagementClient
      posts={mappedPosts}
      stats={stats}
      currentStatus={status}
    />
  )
}

