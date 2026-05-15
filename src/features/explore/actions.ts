"use server"

import { revalidatePath } from "next/cache"
import { and, eq } from "drizzle-orm"
import z from "zod"

import { db } from "@/drizzle/db"
import {
  ExploreCommentTable,
  ExplorePostTable,
  RecruiterRequestTable,
} from "@/drizzle/schema"
import { getCurrentUser } from "@/services/clerk/lib/getCurrentUser"
import {
  commentSchema,
  cvShowcasePostSchema,
  recruiterPostSchema,
  recruiterRequestSchema,
} from "./schemas"

function normalizeOptional(value: string | undefined) {
  const trimmed = value?.trim()
  return trimmed ? trimmed : null
}

async function getRequiredUser() {
  const { userId, user } = await getCurrentUser({ allData: true })

  if (userId == null || user == null) {
    return { error: true as const, message: "Bạn cần đăng nhập" }
  }

  return { error: false as const, userId, user }
}

export async function createRecruiterPostAction(
  unsafeData: z.infer<typeof recruiterPostSchema>
) {
  const auth = await getRequiredUser()
  if (auth.error) return auth

  if (auth.user.role !== "recruiter" && auth.user.role !== "admin") {
    return {
      error: true as const,
      message: "Chỉ nhà tuyển dụng mới được đăng tin",
    }
  }

  const parsed = recruiterPostSchema.safeParse(unsafeData)
  if (!parsed.success) {
    return { error: true as const, message: "Dữ liệu bài viết không hợp lệ" }
  }

  const status = auth.user.role === "admin" ? "published" : "pending"

  await db.insert(ExplorePostTable).values({
    authorId: auth.userId,
    type: "job_post",
    status,
    title: parsed.data.title,
    content: parsed.data.content,
    companyName: parsed.data.companyName,
    positionTitle: parsed.data.positionTitle,
    location: normalizeOptional(parsed.data.location),
    salaryRange: normalizeOptional(parsed.data.salaryRange),
    skills: normalizeOptional(parsed.data.skills),
  })

  revalidatePath("/app/explore")
  revalidatePath("/admin/post-management")

  return {
    error: false as const,
    message:
      status === "pending"
        ? "Bài tuyển dụng đã được gửi và đang chờ admin duyệt"
        : "Bài tuyển dụng đã được đăng",
  }
}

export async function updateOwnPendingRecruiterPostAction(
  postId: string,
  unsafeData: z.infer<typeof recruiterPostSchema>
) {
  const auth = await getRequiredUser()
  if (auth.error) return auth

  if (auth.user.role !== "recruiter" && auth.user.role !== "admin") {
    return {
      error: true as const,
      message: "Bạn không có quyền sửa bài tuyển dụng",
    }
  }

  const parsed = recruiterPostSchema.safeParse(unsafeData)
  if (!parsed.success) {
    return { error: true as const, message: "Dữ liệu bài viết không hợp lệ" }
  }

  const post = await db.query.ExplorePostTable.findFirst({
    where: and(
      eq(ExplorePostTable.id, postId),
      eq(ExplorePostTable.authorId, auth.userId),
      eq(ExplorePostTable.type, "job_post")
    ),
    columns: { id: true, status: true },
  })

  if (post == null || (post.status !== "pending" && post.status !== "rejected")) {
    return {
      error: true as const,
      message: "Chỉ có thể sửa bài đang chờ duyệt hoặc bị từ chối",
    }
  }

  await db
    .update(ExplorePostTable)
    .set({
      status: auth.user.role === "admin" ? "published" : "pending",
      title: parsed.data.title,
      content: parsed.data.content,
      companyName: parsed.data.companyName,
      positionTitle: parsed.data.positionTitle,
      location: normalizeOptional(parsed.data.location),
      salaryRange: normalizeOptional(parsed.data.salaryRange),
      skills: normalizeOptional(parsed.data.skills),
      rejectionReason: null,
    })
    .where(eq(ExplorePostTable.id, postId))

  revalidatePath("/app/explore")
  revalidatePath(`/app/explore/${postId}`)
  revalidatePath("/admin/post-management")
  return { error: false as const, message: "Đã cập nhật bài tuyển dụng" }
}

export async function createCvShowcasePostAction(
  unsafeData: z.infer<typeof cvShowcasePostSchema>
) {
  const auth = await getRequiredUser()
  if (auth.error) return auth

  const parsed = cvShowcasePostSchema.safeParse(unsafeData)
  if (!parsed.success) {
    return { error: true as const, message: "Dữ liệu CV không hợp lệ" }
  }

  await db.insert(ExplorePostTable).values({
    authorId: auth.userId,
    type: "cv_showcase",
    status: "published",
    title: parsed.data.title,
    content: parsed.data.content,
    skills: normalizeOptional(parsed.data.skills),
    cvUrl: parsed.data.cvUrl,
    cvFileName: parsed.data.cvFileName,
  })

  revalidatePath("/app/explore")
  return { error: false as const, message: "CV đã được đăng lên Khám phá" }
}

export async function createExploreCommentAction(
  postId: string,
  unsafeContent: string
) {
  const auth = await getRequiredUser()
  if (auth.error) return auth

  const parsed = commentSchema.safeParse({ content: unsafeContent })
  if (!parsed.success) {
    return { error: true as const, message: "Bình luận không hợp lệ" }
  }

  const post = await db.query.ExplorePostTable.findFirst({
    where: and(
      eq(ExplorePostTable.id, postId),
      eq(ExplorePostTable.status, "published")
    ),
    columns: { id: true },
  })

  if (post == null) {
    return {
      error: true as const,
      message: "Bài viết không tồn tại hoặc chưa public",
    }
  }

  await db.insert(ExploreCommentTable).values({
    postId,
    authorId: auth.userId,
    content: parsed.data.content,
  })

  revalidatePath("/app/explore")
  revalidatePath(`/app/explore/${postId}`)
  return { error: false as const, message: "Đã gửi bình luận" }
}

export async function deleteOwnCommentAction(commentId: string) {
  const auth = await getRequiredUser()
  if (auth.error) return auth

  const comment = await db.query.ExploreCommentTable.findFirst({
    where: and(
      eq(ExploreCommentTable.id, commentId),
      eq(ExploreCommentTable.authorId, auth.userId)
    ),
    columns: { id: true, postId: true },
  })

  if (comment == null) {
    return {
      error: true as const,
      message: "Bạn không có quyền xóa bình luận này",
    }
  }

  await db
    .update(ExploreCommentTable)
    .set({ status: "deleted" })
    .where(eq(ExploreCommentTable.id, commentId))

  revalidatePath("/app/explore")
  revalidatePath(`/app/explore/${comment.postId}`)
  return { error: false as const, message: "Đã xóa bình luận" }
}

export async function submitRecruiterRequestAction(
  unsafeData: z.infer<typeof recruiterRequestSchema>
) {
  const auth = await getRequiredUser()
  if (auth.error) return auth

  if (auth.user.role === "recruiter" || auth.user.role === "admin") {
    return {
      error: true as const,
      message: "Tài khoản đã có quyền nhà tuyển dụng",
    }
  }

  const parsed = recruiterRequestSchema.safeParse(unsafeData)
  if (!parsed.success) {
    return { error: true as const, message: "Thông tin yêu cầu không hợp lệ" }
  }

  const existing = await db.query.RecruiterRequestTable.findFirst({
    where: and(
      eq(RecruiterRequestTable.userId, auth.userId),
      eq(RecruiterRequestTable.status, "pending")
    ),
    columns: { id: true },
  })

  if (existing != null) {
    return { error: true as const, message: "Bạn đã có yêu cầu đang chờ duyệt" }
  }

  await db.insert(RecruiterRequestTable).values({
    userId: auth.userId,
    companyName: parsed.data.companyName,
    companyWebsite: parsed.data.companyWebsite ?? null,
    businessEmail: parsed.data.businessEmail ?? null,
    position: parsed.data.position,
    reason: parsed.data.reason,
  })

  revalidatePath("/app/explore")
  revalidatePath("/admin/recruiter-management")
  return { error: false as const, message: "Yêu cầu đã được gửi tới admin" }
}

export async function cancelRecruiterRequestAction(requestId: string) {
  const auth = await getRequiredUser()
  if (auth.error) return auth

  const request = await db.query.RecruiterRequestTable.findFirst({
    where: and(
      eq(RecruiterRequestTable.id, requestId),
      eq(RecruiterRequestTable.userId, auth.userId),
      eq(RecruiterRequestTable.status, "pending")
    ),
    columns: { id: true },
  })

  if (request == null) {
    return { error: true as const, message: "Không thể hủy yêu cầu này" }
  }

  await db
    .update(RecruiterRequestTable)
    .set({ status: "cancelled" })
    .where(eq(RecruiterRequestTable.id, requestId))

  revalidatePath("/app/explore")
  revalidatePath("/admin/recruiter-management")
  return { error: false as const, message: "Đã hủy yêu cầu" }
}

export async function hideOwnExplorePostAction(postId: string) {
  const auth = await getRequiredUser()
  if (auth.error) return auth

  const post = await db.query.ExplorePostTable.findFirst({
    where: and(
      eq(ExplorePostTable.id, postId),
      eq(ExplorePostTable.authorId, auth.userId)
    ),
    columns: { id: true },
  })

  if (post == null) {
    return { error: true as const, message: "Bạn không có quyền ẩn bài này" }
  }

  await db
    .update(ExplorePostTable)
    .set({ status: "hidden" })
    .where(eq(ExplorePostTable.id, postId))

  revalidatePath("/app/explore")
  revalidatePath(`/app/explore/${postId}`)
  return { error: false as const, message: "Đã ẩn bài viết" }
}
