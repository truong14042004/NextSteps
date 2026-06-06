import type { MetadataRoute } from "next"
import { db } from "@/drizzle/db"
import { ExplorePostTable } from "@/drizzle/schema"
import { eq } from "drizzle-orm"

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://nextsteps1.vercel.app"

// Render động lúc có request để truy vấn DB chạy ở runtime (lúc build DB chưa sẵn sàng)
export const dynamic = "force-dynamic"

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Các trang tĩnh công khai (không cần đăng nhập)
  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: siteUrl,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: `${siteUrl}/explore`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.9,
    },
  ]

  // Các bài đăng công khai (đã được duyệt - published)
  let postRoutes: MetadataRoute.Sitemap = []
  try {
    const posts = await db.query.ExplorePostTable.findMany({
      where: eq(ExplorePostTable.status, "published"),
      columns: {
        id: true,
        updatedAt: true,
        createdAt: true,
      },
    })

    postRoutes = posts.map((post) => ({
      url: `${siteUrl}/explore/${post.id}`,
      lastModified: post.updatedAt ?? post.createdAt ?? new Date(),
      changeFrequency: "weekly",
      priority: 0.7,
    }))
  } catch (error) {
    // Nếu không kết nối được DB lúc build, vẫn trả về các trang tĩnh
    console.error("Failed to build dynamic sitemap entries:", error)
  }

  return [...staticRoutes, ...postRoutes]
}
