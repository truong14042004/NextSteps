import { db } from "@/drizzle/db"
import {
  ExploreCommentTable,
  ExplorePostTable,
  JobApplicationTable,
  RecruiterRequestTable,
} from "@/drizzle/schema"
import { and, count, desc, eq, ne } from "drizzle-orm"

export async function getPublishedExplorePosts(type?: "job_post" | "cv_showcase") {
  return db.query.ExplorePostTable.findMany({
    where: type
      ? and(eq(ExplorePostTable.status, "published"), eq(ExplorePostTable.type, type))
      : eq(ExplorePostTable.status, "published"),
    orderBy: [desc(ExplorePostTable.createdAt)],
    with: {
      author: {
        columns: {
          id: true,
          name: true,
          email: true,
          imageUrl: true,
          role: true,
        },
      },
      comments: {
        where: eq(ExploreCommentTable.status, "published"),
        orderBy: [desc(ExploreCommentTable.createdAt)],
        limit: 5,
        with: {
          author: {
            columns: {
              id: true,
              name: true,
              imageUrl: true,
              role: true,
            },
          },
        },
      },
    },
  })
}

export async function getExplorePostById(postId: string) {
  return db.query.ExplorePostTable.findFirst({
    where: eq(ExplorePostTable.id, postId),
    with: {
      author: {
        columns: {
          id: true,
          name: true,
          email: true,
          imageUrl: true,
          role: true,
        },
      },
      comments: {
        where: eq(ExploreCommentTable.status, "published"),
        orderBy: [desc(ExploreCommentTable.createdAt)],
        with: {
          author: {
            columns: {
              id: true,
              name: true,
              imageUrl: true,
              role: true,
            },
          },
        },
      },
    },
  })
}

export async function getPublishedJobPostForAnalysis(postId: string) {
  return db.query.ExplorePostTable.findFirst({
    where: and(
      eq(ExplorePostTable.id, postId),
      eq(ExplorePostTable.type, "job_post"),
      eq(ExplorePostTable.status, "published")
    ),
    columns: {
      id: true,
      title: true,
      content: true,
      companyName: true,
      positionTitle: true,
      location: true,
      salaryRange: true,
      skills: true,
    },
  })
}

export async function getMyRecruiterRequest(userId: string) {
  return db.query.RecruiterRequestTable.findFirst({
    where: and(
      eq(RecruiterRequestTable.userId, userId),
      ne(RecruiterRequestTable.status, "cancelled")
    ),
    orderBy: [desc(RecruiterRequestTable.createdAt)],
  })
}

export async function getMyExplorePosts(userId: string) {
  return db.query.ExplorePostTable.findMany({
    where: eq(ExplorePostTable.authorId, userId),
    orderBy: [desc(ExplorePostTable.createdAt)],
  })
}

export async function getRecruiterRequestsForAdmin(status?: "pending" | "approved" | "rejected" | "cancelled") {
  return db.query.RecruiterRequestTable.findMany({
    where: status ? eq(RecruiterRequestTable.status, status) : undefined,
    orderBy: [desc(RecruiterRequestTable.createdAt)],
    with: {
      user: {
        columns: {
          id: true,
          name: true,
          email: true,
          imageUrl: true,
          role: true,
        },
      },
      reviewer: {
        columns: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  })
}

export async function getExplorePostsForAdmin(status?: "pending" | "published" | "rejected" | "hidden" | "deleted") {
  return db.query.ExplorePostTable.findMany({
    where: status ? eq(ExplorePostTable.status, status) : undefined,
    orderBy: [desc(ExplorePostTable.createdAt)],
    with: {
      author: {
        columns: {
          id: true,
          name: true,
          email: true,
          imageUrl: true,
          role: true,
        },
      },
      reviewer: {
        columns: {
          id: true,
          name: true,
          email: true,
        },
      },
      comments: {
        orderBy: [desc(ExploreCommentTable.createdAt)],
        limit: 5,
        with: {
          author: {
            columns: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      },
    },
  })
}

// Bài tuyển dụng của một recruiter (chỉ job_post của họ, mọi trạng thái trừ deleted),
// kèm số lượng hồ sơ ứng tuyển để hiển thị trên màn quản lý.
export async function getRecruiterJobPosts(recruiterId: string) {
  const posts = await db.query.ExplorePostTable.findMany({
    where: and(
      eq(ExplorePostTable.authorId, recruiterId),
      eq(ExplorePostTable.type, "job_post"),
      ne(ExplorePostTable.status, "deleted")
    ),
    orderBy: [desc(ExplorePostTable.createdAt)],
  })

  const counts = await db
    .select({
      postId: JobApplicationTable.postId,
      total: count(),
    })
    .from(JobApplicationTable)
    .where(ne(JobApplicationTable.status, "withdrawn"))
    .groupBy(JobApplicationTable.postId)

  const countMap = new Map(counts.map(row => [row.postId, Number(row.total)]))

  return posts.map(post => ({
    ...post,
    applicationCount: countMap.get(post.id) ?? 0,
  }))
}

// Một bài tuyển dụng cụ thể, đảm bảo thuộc về recruiter này (dùng cho trang ứng viên).
export async function getRecruiterJobPostById(postId: string, recruiterId: string) {
  return db.query.ExplorePostTable.findFirst({
    where: and(
      eq(ExplorePostTable.id, postId),
      eq(ExplorePostTable.authorId, recruiterId),
      eq(ExplorePostTable.type, "job_post")
    ),
  })
}

// Danh sách hồ sơ ứng tuyển vào một bài đăng (kèm thông tin ứng viên).
export async function getApplicationsForPost(
  postId: string,
  status?: "pending" | "reviewing" | "accepted" | "rejected" | "withdrawn"
) {
  return db.query.JobApplicationTable.findMany({
    where: status
      ? and(
          eq(JobApplicationTable.postId, postId),
          eq(JobApplicationTable.status, status)
        )
      : eq(JobApplicationTable.postId, postId),
    orderBy: [desc(JobApplicationTable.createdAt)],
    with: {
      applicant: {
        columns: {
          id: true,
          name: true,
          email: true,
          imageUrl: true,
        },
      },
    },
  })
}

// Hồ sơ mà user hiện tại đã nộp (để hiển thị trạng thái "đã ứng tuyển").
export async function getMyApplications(applicantId: string) {
  return db.query.JobApplicationTable.findMany({
    where: eq(JobApplicationTable.applicantId, applicantId),
    orderBy: [desc(JobApplicationTable.createdAt)],
    with: {
      post: {
        columns: {
          id: true,
          title: true,
          companyName: true,
          positionTitle: true,
          status: true,
        },
      },
    },
  })
}

// Tập postId mà user đã có hồ sơ đang hiệu lực (không tính withdrawn).
export async function getMyActiveApplicationPostIds(applicantId: string) {
  const rows = await db
    .select({ postId: JobApplicationTable.postId })
    .from(JobApplicationTable)
    .where(
      and(
        eq(JobApplicationTable.applicantId, applicantId),
        ne(JobApplicationTable.status, "withdrawn")
      )
    )

  return rows.map(row => row.postId)
}
