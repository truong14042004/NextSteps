"use client"

import Link from "next/link"
import type { ReactNode } from "react"
import { useMemo, useState, useTransition } from "react"
import {
  BriefcaseBusiness,
  CheckCircle2,
  Compass,
  FileText,
  MessageCircle,
  Send,
  ShieldCheck,
  UploadCloud,
  UserRound,
} from "lucide-react"
import { toast } from "sonner"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import type {
  getMyExplorePosts,
  getMyRecruiterRequest,
  getPublishedExplorePosts,
} from "@/features/explore/db"
import {
  cancelRecruiterRequestAction,
  createCvShowcasePostAction,
  createExploreCommentAction,
  createRecruiterPostAction,
  hideOwnExplorePostAction,
  submitRecruiterRequestAction,
} from "@/features/explore/actions"
import {
  canCreateRecruiterPost,
  canSubmitRecruiterRequest,
  getExplorePostStatusLabel,
  getExplorePostTypeLabel,
  getRecruiterRequestStatusLabel,
  getRoleLabel,
} from "@/features/explore/exploreRules.mjs"

type PublishedPost = Awaited<ReturnType<typeof getPublishedExplorePosts>>[number]
type MyRequest = Awaited<ReturnType<typeof getMyRecruiterRequest>>
type MyPost = Awaited<ReturnType<typeof getMyExplorePosts>>[number]

type CurrentUser = {
  id: string
  name: string
  role: string
}

type ExplorePageProps = {
  currentUser: CurrentUser
  posts: PublishedPost[]
  myRequest: MyRequest | null
  myPosts: MyPost[]
}

const softPanelClass =
  "rounded-[28px] border border-primary/10 bg-white/90 shadow-sm backdrop-blur dark:bg-card/80"
const fieldClass =
  "rounded-2xl border-primary/10 bg-background/80 shadow-none focus-visible:ring-primary/25"
const ctaClass =
  "rounded-2xl bg-gradient-to-r from-red-500 via-rose-500 to-pink-500 text-white shadow-lg shadow-red-500/20 transition-all hover:-translate-y-0.5 hover:shadow-xl hover:shadow-red-500/30"

function statusBadgeClass(status: string) {
  if (status === "published") return "bg-emerald-50 text-emerald-700"
  if (status === "pending") return "bg-amber-50 text-amber-700"
  if (status === "rejected") return "bg-rose-50 text-rose-700"
  return "bg-slate-100 text-slate-700"
}

function PostStatusBadge({ status }: { status: string }) {
  return (
    <Badge className={`rounded-full ${statusBadgeClass(status)}`}>
      {getExplorePostStatusLabel(status)}
    </Badge>
  )
}

function Field({
  label,
  children,
}: {
  label: string
  children: ReactNode
}) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      {children}
    </div>
  )
}

function RecruiterPostForm({ enabled }: { enabled: boolean }) {
  const [isPending, startTransition] = useTransition()

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      const result = await createRecruiterPostAction({
        title: String(formData.get("title") ?? ""),
        content: String(formData.get("content") ?? ""),
        companyName: String(formData.get("companyName") ?? ""),
        positionTitle: String(formData.get("positionTitle") ?? ""),
        location: String(formData.get("location") ?? ""),
        salaryRange: String(formData.get("salaryRange") ?? ""),
        skills: String(formData.get("skills") ?? ""),
      })

      if (result.error) toast.error(result.message)
      else toast.success(result.message)
    })
  }

  if (!enabled) return null

  return (
    <Card className={softPanelClass}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <BriefcaseBusiness className="size-4 text-primary" />
          Đăng tin tuyển dụng
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form action={handleSubmit} className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Tiêu đề">
              <Input name="title" minLength={5} maxLength={180} required className={fieldClass} />
            </Field>
            <Field label="Vị trí">
              <Input name="positionTitle" maxLength={160} required className={fieldClass} />
            </Field>
            <Field label="Công ty">
              <Input name="companyName" maxLength={160} required className={fieldClass} />
            </Field>
            <Field label="Địa điểm">
              <Input name="location" maxLength={160} className={fieldClass} />
            </Field>
            <Field label="Mức lương">
              <Input name="salaryRange" maxLength={120} className={fieldClass} />
            </Field>
            <Field label="Kỹ năng">
              <Input name="skills" maxLength={1000} placeholder="React, SQL, English..." className={fieldClass} />
            </Field>
          </div>
          <Field label="Mô tả công việc">
            <Textarea name="content" minLength={30} maxLength={6000} required className={`min-h-36 ${fieldClass}`} />
          </Field>
          <Button type="submit" disabled={isPending} className={ctaClass}>
            <Send className="mr-2 size-4" />
            Gửi bài chờ duyệt
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}

function CvShowcaseForm() {
  const [isPending, startTransition] = useTransition()
  const [uploading, setUploading] = useState(false)
  const [cvFile, setCvFile] = useState<{ url: string; fileName: string } | null>(null)
  const [confirmed, setConfirmed] = useState(false)

  async function handleFileChange(file: File | null) {
    if (!file) return

    const formData = new FormData()
    formData.append("file", file)
    setUploading(true)

    try {
      const response = await fetch("/api/uploads/cv", {
        method: "POST",
        body: formData,
      })
      const data = await response.json()

      if (!response.ok) {
        toast.error(data.error ?? "Không thể tải CV")
        return
      }

      setCvFile({ url: data.url, fileName: data.fileName ?? file.name })
      toast.success("Đã tải CV")
    } finally {
      setUploading(false)
    }
  }

  function handleSubmit(formData: FormData) {
    if (!cvFile) {
      toast.error("Vui lòng tải CV trước")
      return
    }

    if (!confirmed) {
      toast.error("Vui lòng xác nhận quyền riêng tư trước khi đăng CV")
      return
    }

    startTransition(async () => {
      const result = await createCvShowcasePostAction({
        title: String(formData.get("title") ?? ""),
        content: String(formData.get("content") ?? ""),
        skills: String(formData.get("skills") ?? ""),
        cvUrl: cvFile.url,
        cvFileName: cvFile.fileName,
      })

      if (result.error) toast.error(result.message)
      else toast.success(result.message)
    })
  }

  return (
    <Card className={softPanelClass}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <FileText className="size-4 text-primary" />
          Đăng CV ứng viên
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form action={handleSubmit} className="space-y-4">
          <Field label="Tiêu đề">
            <Input name="title" minLength={5} maxLength={180} required placeholder="Frontend fresher đang tìm cơ hội thực tập" className={fieldClass} />
          </Field>
          <Field label="Giới thiệu hồ sơ">
            <Textarea name="content" minLength={20} maxLength={4000} required className={`min-h-28 ${fieldClass}`} />
          </Field>
          <Field label="Kỹ năng nổi bật">
            <Input name="skills" maxLength={1000} placeholder="JavaScript, React, teamwork..." className={fieldClass} />
          </Field>
          <div className="rounded-[24px] border border-dashed border-primary/20 bg-gradient-to-br from-primary/5 via-background to-rose-50/60 p-4 dark:to-rose-950/10">
            <Label htmlFor="cv-upload" className="flex cursor-pointer items-center gap-2 text-sm font-medium">
              <UploadCloud className="size-4 text-primary" />
              {uploading ? "Đang tải CV..." : cvFile?.fileName ?? "Tải CV PDF/DOC/DOCX/TXT"}
            </Label>
            <Input
              id="cv-upload"
              type="file"
              accept=".pdf,.doc,.docx,.txt"
              className={`mt-3 ${fieldClass}`}
              disabled={uploading}
              onChange={event => handleFileChange(event.target.files?.[0] ?? null)}
            />
          </div>
          <label className="flex items-start gap-3 rounded-[20px] border border-primary/10 bg-primary/5 p-3 text-sm">
            <input
              type="checkbox"
              checked={confirmed}
              onChange={event => setConfirmed(event.target.checked)}
              className="mt-1"
            />
            <span>
              CV của bạn sẽ xuất hiện trong mục Khám phá cho người dùng đã đăng nhập xem.
            </span>
          </label>
          <Button type="submit" disabled={isPending || uploading} className={ctaClass}>
            <Send className="mr-2 size-4" />
            Đăng CV
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}

function RecruiterRequestForm({
  request,
  enabled,
}: {
  request: MyRequest | null
  enabled: boolean
}) {
  const [isPending, startTransition] = useTransition()

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      const result = await submitRecruiterRequestAction({
        companyName: String(formData.get("companyName") ?? ""),
        companyWebsite: String(formData.get("companyWebsite") ?? ""),
        businessEmail: String(formData.get("businessEmail") ?? ""),
        position: String(formData.get("position") ?? ""),
        reason: String(formData.get("reason") ?? ""),
      })

      if (result.error) toast.error(result.message)
      else toast.success(result.message)
    })
  }

  function cancelRequest() {
    if (!request) return

    startTransition(async () => {
      const result = await cancelRecruiterRequestAction(request.id)
      if (result.error) toast.error(result.message)
      else toast.success(result.message)
    })
  }

  if (!enabled && !request) return null

  if (request) {
    return (
      <Card className={softPanelClass}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <ShieldCheck className="size-4 text-primary" />
            Yêu cầu nhà tuyển dụng
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div className="flex items-center justify-between gap-3">
            <span>{request.companyName}</span>
            <Badge className="rounded-full">{getRecruiterRequestStatusLabel(request.status)}</Badge>
          </div>
          {request.adminNote && <p className="text-muted-foreground">{request.adminNote}</p>}
          {request.status === "pending" && (
            <Button type="button" variant="outline" disabled={isPending} onClick={cancelRequest}>
              Hủy yêu cầu
            </Button>
          )}
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={softPanelClass}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <ShieldCheck className="size-4 text-primary" />
          Yêu cầu trở thành nhà tuyển dụng
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form action={handleSubmit} className="space-y-4">
          <Field label="Công ty">
            <Input name="companyName" maxLength={160} required className={fieldClass} />
          </Field>
          <Field label="Website công ty">
            <Input name="companyWebsite" type="url" maxLength={255} className={fieldClass} />
          </Field>
          <Field label="Email công việc">
            <Input name="businessEmail" type="email" maxLength={255} className={fieldClass} />
          </Field>
          <Field label="Chức vụ">
            <Input name="position" maxLength={120} required className={fieldClass} />
          </Field>
          <Field label="Lý do">
            <Textarea name="reason" minLength={20} maxLength={2500} required className={`min-h-24 ${fieldClass}`} />
          </Field>
          <Button type="submit" disabled={isPending} className={ctaClass}>
            <Send className="mr-2 size-4" />
            Gửi yêu cầu
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}

function CommentForm({ postId }: { postId: string }) {
  const [content, setContent] = useState("")
  const [isPending, startTransition] = useTransition()

  function submit() {
    startTransition(async () => {
      const result = await createExploreCommentAction(postId, content)
      if (result.error) toast.error(result.message)
      else {
        toast.success(result.message)
        setContent("")
      }
    })
  }

  return (
    <div className="flex gap-2">
      <Input
        value={content}
        onChange={event => setContent(event.target.value)}
        placeholder="Viết bình luận..."
        maxLength={1200}
        className={fieldClass}
      />
      <Button type="button" size="icon" disabled={isPending || content.trim().length === 0} onClick={submit} className="rounded-2xl">
        <Send className="size-4" />
      </Button>
    </div>
  )
}

function ExplorePostCard({ post }: { post: PublishedPost }) {
  const isJob = post.type === "job_post"

  return (
    <Card className={softPanelClass}>
      <CardHeader className="space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <Badge
            variant={isJob ? "default" : "secondary"}
            className={
              isJob
                ? "rounded-full bg-gradient-to-r from-red-500 via-rose-500 to-pink-500 text-white"
                : "rounded-full bg-gradient-to-r from-indigo-500 to-amber-400 text-white"
            }
          >
            {getExplorePostTypeLabel(post.type)}
          </Badge>
          {post.companyName && <Badge variant="outline">{post.companyName}</Badge>}
          {post.location && <Badge variant="outline">{post.location}</Badge>}
        </div>
        <div>
          <CardTitle className="text-xl tracking-tight">
            <Link href={`/explore/${post.id}`} className="hover:text-primary">
              {post.title}
            </Link>
          </CardTitle>
          <p className="mt-1 text-sm text-muted-foreground">
            {post.author?.name ?? "Người dùng"} · {getRoleLabel(post.author?.role ?? "user")}
          </p>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="line-clamp-4 whitespace-pre-line text-sm leading-6">{post.content}</p>
        <div className="flex flex-wrap gap-2 text-sm">
          {post.positionTitle && <Badge variant="outline">{post.positionTitle}</Badge>}
          {post.salaryRange && <Badge variant="outline">{post.salaryRange}</Badge>}
          {post.skills && <Badge variant="outline">{post.skills}</Badge>}
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild variant="outline" className="rounded-2xl border-primary/15 bg-white/80 hover:bg-primary/5 dark:bg-background/40">
            <Link href={`/explore/${post.id}`}>Xem chi tiết</Link>
          </Button>
          {isJob && (
            <Button asChild className={ctaClass}>
              <Link href={`/app?source=explore&postId=${post.id}`}>Phân tích CV với bài này</Link>
            </Button>
          )}
          {!isJob && post.cvUrl && (
            <Button asChild variant="outline" className="rounded-2xl border-primary/15 bg-white/80 hover:bg-primary/5 dark:bg-background/40">
              <Link href={post.cvUrl} target="_blank">Xem CV</Link>
            </Button>
          )}
        </div>
        <div className="border-t pt-4">
          <div className="mb-3 flex items-center gap-2 text-sm font-medium">
            <MessageCircle className="size-4 text-primary" />
            Bình luận
          </div>
          <div className="mb-3 space-y-2">
            {post.comments.map(comment => (
              <div key={comment.id} className="rounded-2xl border border-primary/5 bg-primary/5 px-3 py-2 text-sm">
                <span className="font-medium">{comment.author?.name ?? "Người dùng"}: </span>
                {comment.content}
              </div>
            ))}
          </div>
          <CommentForm postId={post.id} />
        </div>
      </CardContent>
    </Card>
  )
}

function MyPostsPanel({
  posts,
  currentUserId,
}: {
  posts: MyPost[]
  currentUserId: string
}) {
  const [isPending, startTransition] = useTransition()

  function hidePost(postId: string) {
    startTransition(async () => {
      const result = await hideOwnExplorePostAction(postId)
      if (result.error) toast.error(result.message)
      else toast.success(result.message)
    })
  }

  if (posts.length === 0) return null

  return (
    <Card className={softPanelClass}>
      <CardHeader>
        <CardTitle className="text-base">Bài của tôi</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {posts.map(post => (
          <div key={post.id} className="flex items-center justify-between gap-3 rounded-lg border p-3 text-sm">
            <div className="min-w-0">
              <div className="truncate font-medium">{post.title}</div>
              <div className="mt-1 flex flex-wrap gap-2">
                <Badge variant="outline">{getExplorePostTypeLabel(post.type)}</Badge>
                <PostStatusBadge status={post.status} />
              </div>
              {post.rejectionReason && (
                <p className="mt-2 text-xs text-rose-600">{post.rejectionReason}</p>
              )}
            </div>
            {post.authorId === currentUserId && post.status !== "hidden" && post.status !== "deleted" && (
              <Button type="button" variant="outline" size="sm" disabled={isPending} onClick={() => hidePost(post.id)}>
                Ẩn
              </Button>
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  )
}

export function ExplorePage({
  currentUser,
  posts,
  myRequest,
  myPosts,
}: ExplorePageProps) {
  const [filter, setFilter] = useState<"all" | "job_post" | "cv_showcase">("all")

  const visiblePosts = useMemo(
    () => posts.filter(post => filter === "all" || post.type === filter),
    [filter, posts]
  )
  const isRecruiterOrAdmin =
    currentUser.role === "recruiter" || currentUser.role === "admin"

  return (
    <div className="min-h-full bg-[radial-gradient(circle_at_top,rgba(179,0,0,0.10),transparent_28%),radial-gradient(circle_at_top_right,rgba(99,102,241,0.08),transparent_24%),linear-gradient(to_bottom,var(--background),var(--background))]">
      <main className="container space-y-8 py-8 md:py-10">
      <section className="overflow-hidden rounded-[32px] border border-primary/10 bg-white/85 p-6 shadow-sm backdrop-blur dark:bg-card/80 md:p-8">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/15 bg-primary/5 px-3 py-1 text-xs font-medium text-primary">
              <Compass className="size-3.5" />
              Cộng đồng nghề nghiệp
            </div>
            <h1 className="mt-4 max-w-3xl bg-gradient-to-r from-indigo-600 via-rose-500 to-amber-400 bg-clip-text text-3xl font-semibold tracking-tight text-transparent md:text-5xl">
              Khám phá cơ hội & hồ sơ ứng viên
            </h1>
            <p className="mt-3 text-sm leading-6 text-muted-foreground md:text-base">
              Nhà tuyển dụng đăng cơ hội, ứng viên chia sẻ CV, mọi người bình luận và dùng bài tuyển dụng để phân tích CV.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Badge variant="outline" className="rounded-full">
              <UserRound className="mr-1 size-3.5" />
              {getRoleLabel(currentUser.role)}
            </Badge>
            {currentUser.role === "admin" && (
              <Button asChild variant="outline" className="rounded-2xl border-primary/15 bg-white/80 hover:bg-primary/5 dark:bg-background/40">
                <Link href="/admin/post-management">Quản lý bài viết</Link>
              </Button>
            )}
          </div>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
        <div className="space-y-5">
          <div className="flex flex-wrap gap-2">
            {[
              ["all", "Tất cả"],
              ["job_post", "Tuyển dụng"],
              ["cv_showcase", "CV ứng viên"],
            ].map(([value, label]) => (
              <Button
                key={value}
                type="button"
                variant={filter === value ? "default" : "outline"}
                className={
                  filter === value
                    ? "rounded-2xl bg-gradient-to-r from-red-500 via-rose-500 to-pink-500 text-white shadow-sm"
                    : "rounded-2xl border-primary/15 bg-white/80 hover:bg-primary/5 dark:bg-background/40"
                }
                onClick={() => setFilter(value as typeof filter)}
              >
                {label}
              </Button>
            ))}
          </div>

          {visiblePosts.length === 0 ? (
            <div className="rounded-[28px] border border-primary/10 bg-white/80 p-10 text-center text-muted-foreground shadow-sm dark:bg-card/70">
              Chưa có bài viết phù hợp.
            </div>
          ) : (
            visiblePosts.map(post => <ExplorePostCard key={post.id} post={post} />)
          )}
        </div>

        <aside className="space-y-5">
          {!isRecruiterOrAdmin && (
            <>
              <CvShowcaseForm />
              <RecruiterRequestForm
                request={myRequest}
                enabled={canSubmitRecruiterRequest(currentUser.role)}
              />
            </>
          )}
          <RecruiterPostForm enabled={canCreateRecruiterPost(currentUser.role)} />
          <MyPostsPanel posts={myPosts} currentUserId={currentUser.id} />
          <Card className={softPanelClass}>
            <CardContent className="flex gap-3 p-4 text-sm text-muted-foreground">
              <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-primary" />
              Tin tuyển dụng của recruiter cần admin duyệt trước khi xuất hiện trong feed.
            </CardContent>
          </Card>
        </aside>
      </section>
    </main>
    </div>
  )
}
