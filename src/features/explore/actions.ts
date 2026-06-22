"use server"

import { revalidatePath } from "next/cache"
import { and, desc, eq, ne } from "drizzle-orm"
import z from "zod"

import { db } from "@/drizzle/db"
import {
  ExploreCommentTable,
  ExplorePostTable,
  JobApplicationTable,
  RecruiterRequestTable,
} from "@/drizzle/schema"
import { getCurrentUser } from "@/services/clerk/lib/getCurrentUser"
import { sendEmail } from "@/services/email/mailer"
import { buildApplicationDecisionEmail } from "@/services/email/applicationEmails"
import {
  commentSchema,
  cvShowcasePostSchema,
  jobApplicationSchema,
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

  revalidatePath("/explore")
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

  revalidatePath("/explore")
  revalidatePath(`/explore/${postId}`)
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

  revalidatePath("/explore")
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

  revalidatePath("/explore")
  revalidatePath(`/explore/${postId}`)
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

  revalidatePath("/explore")
  revalidatePath(`/explore/${comment.postId}`)
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
      ne(RecruiterRequestTable.status, "cancelled")
    ),
    orderBy: [desc(RecruiterRequestTable.createdAt)],
    columns: { id: true, status: true },
  })

  if (existing?.status === "pending") {
    return { error: true as const, message: "Bạn đã có yêu cầu đang chờ duyệt" }
  }

  if (existing?.status === "approved") {
    return { error: true as const, message: "Tài khoản đã có quyền nhà tuyển dụng" }
  }

  // Nếu yêu cầu trước bị từ chối: cho sửa lại và gửi lại (rejected → pending),
  // xóa ghi chú/thông tin review cũ thay vì tạo bản ghi mới.
  if (existing?.status === "rejected") {
    await db
      .update(RecruiterRequestTable)
      .set({
        companyName: parsed.data.companyName,
        companyWebsite: parsed.data.companyWebsite ?? null,
        businessEmail: parsed.data.businessEmail ?? null,
        position: parsed.data.position,
        reason: parsed.data.reason,
        status: "pending",
        adminNote: null,
        reviewedById: null,
        reviewedAt: null,
      })
      .where(eq(RecruiterRequestTable.id, existing.id))

    revalidatePath("/explore")
    revalidatePath("/admin/recruiter-management")
    return { error: false as const, message: "Đã gửi lại yêu cầu tới admin" }
  }

  await db.insert(RecruiterRequestTable).values({
    userId: auth.userId,
    companyName: parsed.data.companyName,
    companyWebsite: parsed.data.companyWebsite ?? null,
    businessEmail: parsed.data.businessEmail ?? null,
    position: parsed.data.position,
    reason: parsed.data.reason,
  })

  revalidatePath("/explore")
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

  revalidatePath("/explore")
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

  revalidatePath("/explore")
  revalidatePath(`/explore/${postId}`)
  return { error: false as const, message: "Đã ẩn bài viết" }
}

// ── Ứng tuyển / nộp hồ sơ ──────────────────────────────────────────────

export async function applyToJobAction(
  postId: string,
  unsafeData: z.infer<typeof jobApplicationSchema>
) {
  const auth = await getRequiredUser()
  if (auth.error) return auth

  if (auth.user.role === "recruiter" || auth.user.role === "admin") {
    return {
      error: true as const,
      message: "Tài khoản nhà tuyển dụng không thể nộp hồ sơ",
    }
  }

  const parsed = jobApplicationSchema.safeParse(unsafeData)
  if (!parsed.success) {
    return { error: true as const, message: "Thông tin hồ sơ không hợp lệ" }
  }

  const post = await db.query.ExplorePostTable.findFirst({
    where: and(
      eq(ExplorePostTable.id, postId),
      eq(ExplorePostTable.type, "job_post"),
      eq(ExplorePostTable.status, "published")
    ),
    columns: { id: true, authorId: true },
  })

  if (post == null) {
    return { error: true as const, message: "Không tìm thấy bài tuyển dụng" }
  }

  if (post.authorId === auth.userId) {
    return { error: true as const, message: "Bạn không thể nộp hồ sơ cho bài của chính mình" }
  }

  const existing = await db.query.JobApplicationTable.findFirst({
    where: and(
      eq(JobApplicationTable.postId, postId),
      eq(JobApplicationTable.applicantId, auth.userId),
      ne(JobApplicationTable.status, "withdrawn")
    ),
    columns: { id: true },
  })

  if (existing != null) {
    return { error: true as const, message: "Bạn đã nộp hồ sơ cho vị trí này" }
  }

  await db.insert(JobApplicationTable).values({
    postId,
    applicantId: auth.userId,
    fullName: parsed.data.fullName,
    email: parsed.data.email ?? null,
    phone: normalizeOptional(parsed.data.phone),
    coverLetter: normalizeOptional(parsed.data.coverLetter),
    cvUrl: parsed.data.cvUrl,
    cvFileName: parsed.data.cvFileName,
  })

  revalidatePath("/explore")
  revalidatePath(`/explore/${postId}`)
  revalidatePath("/recruiter/applicants")
  return { error: false as const, message: "Đã nộp hồ sơ thành công" }
}

export async function withdrawApplicationAction(applicationId: string) {
  const auth = await getRequiredUser()
  if (auth.error) return auth

  const application = await db.query.JobApplicationTable.findFirst({
    where: and(
      eq(JobApplicationTable.id, applicationId),
      eq(JobApplicationTable.applicantId, auth.userId)
    ),
    columns: { id: true, status: true, postId: true },
  })

  if (application == null) {
    return { error: true as const, message: "Không tìm thấy hồ sơ" }
  }

  if (application.status === "accepted") {
    return { error: true as const, message: "Hồ sơ đã được nhận, không thể rút" }
  }

  await db
    .update(JobApplicationTable)
    .set({ status: "withdrawn" })
    .where(eq(JobApplicationTable.id, applicationId))

  revalidatePath("/explore")
  revalidatePath(`/explore/${application.postId}`)
  revalidatePath("/recruiter/applicants")
  return { error: false as const, message: "Đã rút hồ sơ" }
}

const applicationReviewStatuses = ["pending", "reviewing", "accepted", "rejected"] as const

export async function updateApplicationStatusAction(
  applicationId: string,
  status: (typeof applicationReviewStatuses)[number],
  recruiterNote?: string
) {
  const auth = await getRequiredUser()
  if (auth.error) return auth

  if (auth.user.role !== "recruiter" && auth.user.role !== "admin") {
    return { error: true as const, message: "Chỉ nhà tuyển dụng mới thao tác được" }
  }

  if (!applicationReviewStatuses.includes(status)) {
    return { error: true as const, message: "Trạng thái không hợp lệ" }
  }

  const application = await db.query.JobApplicationTable.findFirst({
    where: eq(JobApplicationTable.id, applicationId),
    columns: {
      id: true,
      postId: true,
      fullName: true,
      email: true,
    },
    with: {
      post: {
        columns: { authorId: true, title: true, positionTitle: true, companyName: true },
      },
    },
  })

  if (application == null) {
    return { error: true as const, message: "Không tìm thấy hồ sơ" }
  }

  // Recruiter chỉ duyệt hồ sơ của bài đăng do chính họ tạo (admin được toàn quyền).
  if (auth.user.role !== "admin" && application.post?.authorId !== auth.userId) {
    return { error: true as const, message: "Bạn không có quyền với hồ sơ này" }
  }

  const note = normalizeOptional(recruiterNote)

  await db
    .update(JobApplicationTable)
    .set({
      status,
      recruiterNote: note,
    })
    .where(eq(JobApplicationTable.id, applicationId))

  revalidatePath("/recruiter/applicants")
  revalidatePath(`/recruiter/applicants/${application.postId}`)

  // Gửi email thông báo cho ứng viên khi được nhận hoặc bị từ chối.
  let emailSent = false
  if ((status === "accepted" || status === "rejected") && application.email) {
    const { subject, text, html } = buildApplicationDecisionEmail({
      candidateName: application.fullName,
      jobTitle: application.post?.positionTitle || application.post?.title || "vị trí ứng tuyển",
      companyName: application.post?.companyName ?? null,
      status,
      recruiterNote: note,
    })

    try {
      const result = await sendEmail({ to: application.email, subject, text, html })
      emailSent = result.sent
    } catch (error) {
      console.error("Gửi email thông báo ứng viên thất bại:", error)
    }
  }

  const baseMessage = "Đã cập nhật trạng thái hồ sơ"
  const message =
    (status === "accepted" || status === "rejected") && application.email
      ? emailSent
        ? `${baseMessage} và đã gửi email thông báo cho ứng viên`
        : `${baseMessage}. Lưu ý: chưa gửi được email (SMTP chưa cấu hình)`
      : baseMessage

  return { error: false as const, message }
}

// ── Recruiter tự quản lý bài đăng của mình ─────────────────────────────

export async function unhideOwnExplorePostAction(postId: string) {
  const auth = await getRequiredUser()
  if (auth.error) return auth

  const post = await db.query.ExplorePostTable.findFirst({
    where: and(
      eq(ExplorePostTable.id, postId),
      eq(ExplorePostTable.authorId, auth.userId)
    ),
    columns: { id: true, status: true },
  })

  if (post == null) {
    return { error: true as const, message: "Bạn không có quyền với bài này" }
  }

  if (post.status !== "hidden") {
    return { error: true as const, message: "Chỉ có thể hiện lại bài đang ẩn" }
  }

  await db
    .update(ExplorePostTable)
    .set({ status: "published" })
    .where(eq(ExplorePostTable.id, postId))

  revalidatePath("/explore")
  revalidatePath(`/explore/${postId}`)
  revalidatePath("/recruiter")
  return { error: false as const, message: "Đã hiện lại bài viết" }
}

export async function deleteOwnExplorePostAction(postId: string) {
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
    return { error: true as const, message: "Bạn không có quyền xóa bài này" }
  }

  await db
    .update(ExplorePostTable)
    .set({ status: "deleted" })
    .where(eq(ExplorePostTable.id, postId))

  revalidatePath("/explore")
  revalidatePath(`/explore/${postId}`)
  revalidatePath("/recruiter")
  return { error: false as const, message: "Đã xóa bài viết" }
}

export async function updateOwnExplorePostAction(
  postId: string,
  unsafeData: z.infer<typeof recruiterPostSchema>
) {
  const auth = await getRequiredUser()
  if (auth.error) return auth

  if (auth.user.role !== "recruiter" && auth.user.role !== "admin") {
    return { error: true as const, message: "Bạn không có quyền sửa bài tuyển dụng" }
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

  if (post == null || post.status === "deleted") {
    return { error: true as const, message: "Không tìm thấy bài tuyển dụng" }
  }

  // Giữ nguyên trạng thái hiển thị hiện tại (published/hidden); bài chờ duyệt
  // hoặc bị từ chối thì quay lại pending để admin duyệt lại (admin thì publish luôn).
  const nextStatus =
    auth.user.role === "admin"
      ? "published"
      : post.status === "published" || post.status === "hidden"
        ? post.status
        : "pending"

  await db
    .update(ExplorePostTable)
    .set({
      status: nextStatus,
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

  revalidatePath("/explore")
  revalidatePath(`/explore/${postId}`)
  revalidatePath("/recruiter")
  return { error: false as const, message: "Đã cập nhật bài tuyển dụng" }
}
