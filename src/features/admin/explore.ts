"use server"

import { revalidatePath, revalidateTag } from "next/cache"
import { eq } from "drizzle-orm"

import { db } from "@/drizzle/db"
import {
  ExploreCommentTable,
  ExplorePostTable,
  RecruiterRequestTable,
  UserTable,
} from "@/drizzle/schema"
import { getAdminContext } from "@/features/admin/auth"
import { getUserIdTag } from "@/features/users/dbCache"

async function requireAdminAction() {
  const context = await getAdminContext()
  if (!context.ok) {
    return { error: true as const, message: context.message }
  }
  return { error: false as const, userId: context.userId, user: context.user }
}

export async function approveRecruiterRequestAction(requestId: string) {
  const admin = await requireAdminAction()
  if (admin.error) return admin

  const request = await db.query.RecruiterRequestTable.findFirst({
    where: eq(RecruiterRequestTable.id, requestId),
  })

  if (request == null || request.status !== "pending") {
    return { error: true as const, message: "Yêu cầu không tồn tại hoặc đã xử lý" }
  }

  await db.transaction(async tx => {
    await tx
      .update(UserTable)
      .set({ role: "recruiter" })
      .where(eq(UserTable.id, request.userId))

    await tx
      .update(RecruiterRequestTable)
      .set({
        status: "approved",
        reviewedById: admin.userId,
        reviewedAt: new Date(),
      })
      .where(eq(RecruiterRequestTable.id, requestId))
  })

  revalidatePath("/admin/recruiter-management")
  revalidatePath("/admin/user-management")
  revalidateTag(getUserIdTag(request.userId), "default")
  return { error: false as const, message: "Đã duyệt nhà tuyển dụng" }
}

export async function rejectRecruiterRequestAction(requestId: string, note?: string) {
  const admin = await requireAdminAction()
  if (admin.error) return admin

  await db
    .update(RecruiterRequestTable)
    .set({
      status: "rejected",
      adminNote: note?.trim() || null,
      reviewedById: admin.userId,
      reviewedAt: new Date(),
    })
    .where(eq(RecruiterRequestTable.id, requestId))

  revalidatePath("/admin/recruiter-management")
  return { error: false as const, message: "Đã từ chối yêu cầu" }
}

export async function approveExplorePostAction(postId: string) {
  const admin = await requireAdminAction()
  if (admin.error) return admin

  await db
    .update(ExplorePostTable)
    .set({
      status: "published",
      rejectionReason: null,
      reviewedById: admin.userId,
      reviewedAt: new Date(),
    })
    .where(eq(ExplorePostTable.id, postId))

  revalidatePath("/admin/post-management")
  revalidatePath("/explore")
  return { error: false as const, message: "Đã duyệt bài viết" }
}

export async function rejectExplorePostAction(postId: string, reason?: string) {
  const admin = await requireAdminAction()
  if (admin.error) return admin

  await db
    .update(ExplorePostTable)
    .set({
      status: "rejected",
      rejectionReason: reason?.trim() || null,
      reviewedById: admin.userId,
      reviewedAt: new Date(),
    })
    .where(eq(ExplorePostTable.id, postId))

  revalidatePath("/admin/post-management")
  return { error: false as const, message: "Đã từ chối bài viết" }
}

export async function hideExplorePostAsAdminAction(postId: string) {
  const admin = await requireAdminAction()
  if (admin.error) return admin

  await db
    .update(ExplorePostTable)
    .set({ status: "hidden", reviewedById: admin.userId, reviewedAt: new Date() })
    .where(eq(ExplorePostTable.id, postId))

  revalidatePath("/admin/post-management")
  revalidatePath("/explore")
  return { error: false as const, message: "Đã ẩn bài viết" }
}

export async function hideExploreCommentAsAdminAction(commentId: string) {
  const admin = await requireAdminAction()
  if (admin.error) return admin

  await db
    .update(ExploreCommentTable)
    .set({ status: "hidden" })
    .where(eq(ExploreCommentTable.id, commentId))

  revalidatePath("/admin/post-management")
  revalidatePath("/explore")
  return { error: false as const, message: "Đã ẩn bình luận" }
}
