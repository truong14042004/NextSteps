import { db } from "@/drizzle/db"
import {
  ExploreCommentTable,
  ExplorePostTable,
  RecruiterRequestTable,
} from "@/drizzle/schema"
import { and, desc, eq, ne } from "drizzle-orm"

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
