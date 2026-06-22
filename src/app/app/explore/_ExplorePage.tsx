"use client"

import Link from "next/link"
import type { ReactNode } from "react"
import { useMemo, useState, useTransition } from "react"
import {
  Briefcase,
  CheckCircle2,
  Compass,
  EyeOff,
  FileText,
  MessageCircle,
  MessageSquareOff,
  Send,
  ShieldCheck,
  Trash2,
  UploadCloud,
  UserRound,
  Sparkles,
  TrendingUp,
  Hash,
  Users,
  Share2,
  Bookmark,
  MapPin,
  DollarSign,
  BriefcaseBusiness,
  Activity,
  Plus,
  Building,
  CalendarClock,
  GraduationCap,
  Wand2,
  ThumbsUp,
  Check,
  ChevronRight,
  User,
  ExternalLink
} from "lucide-react"
import { toast } from "sonner"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import type {
  getMyExplorePosts,
  getMyRecruiterRequest,
  getPublishedExplorePosts,
} from "@/features/explore/db"
import { JobApplyDialog } from "@/components/explore/JobApplyDialog"
import {
  cancelRecruiterRequestAction,
  createCvShowcasePostAction,
  createExploreCommentAction,
  createRecruiterPostAction,
  hideOwnExplorePostAction,
  submitRecruiterRequestAction,
} from "@/features/explore/actions"
import {
  deleteExploreCommentAsAdminAction,
  deleteExplorePostAsAdminAction,
  hideExploreCommentAsAdminAction,
  hideExplorePostAsAdminAction,
} from "@/features/admin/explore"
import {
  canApplyToJob,
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
  imageUrl?: string | null
}

type ExplorePageProps = {
  currentUser: CurrentUser
  posts: PublishedPost[]
  myRequest: MyRequest | null
  myPosts: MyPost[]
  appliedPostIds?: string[]
}

const softPanelClass =
  "rounded-2xl border border-slate-100 dark:border-border/60 bg-white/95 shadow-sm dark:bg-card/90 backdrop-blur-md transition-all duration-300 hover:shadow-md"
const fieldClass =
  "rounded-xl border-primary/10 bg-background/80 shadow-none focus-visible:ring-primary/20"
const ctaClass =
  "rounded-xl bg-gradient-to-r from-red-500 via-rose-500 to-pink-500 text-white shadow-md shadow-red-500/10 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-red-500/20"

function statusBadgeClass(status: string) {
  if (status === "published") return "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400"
  if (status === "pending") return "bg-amber-50 text-amber-700 dark:bg-amber-950/20 dark:text-amber-400"
  if (status === "rejected") return "bg-rose-50 text-rose-700 dark:bg-rose-950/20 dark:text-rose-400"
  return "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400"
}

function PostStatusBadge({ status }: { status: string }) {
  return (
    <Badge className={`rounded-full border-none font-medium px-2.5 py-0.5 text-xs ${statusBadgeClass(status)}`}>
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
    <div className="space-y-1.5">
      <Label className="text-sm font-semibold text-foreground/80">{label}</Label>
      {children}
    </div>
  )
}

function RecruiterPostForm({
  enabled,
  onSuccess,
}: {
  enabled: boolean
  onSuccess: () => void
}) {
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
        deadline: String(formData.get("deadline") ?? ""),
      })

      if (result.error) toast.error(result.message)
      else {
        toast.success(result.message)
        onSuccess()
      }
    })
  }

  if (!enabled) return null

  return (
    <form action={handleSubmit} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Tiêu đề tin tuyển dụng">
          <Input name="title" minLength={5} maxLength={180} required placeholder="Ví dụ: Senior React Engineer tìm đồng đội" className={fieldClass} />
        </Field>
        <Field label="Vị trí ứng tuyển">
          <Input name="positionTitle" maxLength={160} required placeholder="Ví dụ: Frontend Developer" className={fieldClass} />
        </Field>
        <Field label="Tên công ty">
          <Input name="companyName" maxLength={160} required placeholder="Ví dụ: NextStep Corp" className={fieldClass} />
        </Field>
        <Field label="Địa điểm làm việc">
          <Input name="location" maxLength={160} placeholder="Ví dụ: Quận 1, TP. HCM / Hybrid" className={fieldClass} />
        </Field>
        <Field label="Mức lương mong muốn">
          <Input name="salaryRange" maxLength={120} placeholder="Ví dụ: 15M - 25M VNĐ / Thỏa thuận" className={fieldClass} />
        </Field>
        <Field label="Kỹ năng yêu cầu">
          <Input name="skills" maxLength={1000} placeholder="React, SQL, English..." className={fieldClass} />
        </Field>
        <Field label="Hạn nộp CV (tùy chọn)">
          <Input name="deadline" type="date" className={fieldClass} />
        </Field>
      </div>
      <Field label="Mô tả công việc chi tiết">
        <Textarea name="content" minLength={30} maxLength={6000} required placeholder="Mô tả các yêu cầu, quyền lợi và thông tin công việc..." className={`min-h-36 ${fieldClass}`} />
      </Field>
      <div className="flex justify-end gap-2 pt-2 border-t">
        <Button type="submit" disabled={isPending} className={ctaClass}>
          <Send className="mr-2 size-4" />
          {isPending ? "Đang gửi..." : "Gửi bài chờ duyệt"}
        </Button>
      </div>
    </form>
  )
}

function CvShowcaseForm({ onSuccess }: { onSuccess: () => void }) {
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
      toast.success("Đã tải CV thành công")
    } finally {
      setUploading(false)
    }
  }

  function handleSubmit(formData: FormData) {
    if (!cvFile) {
      toast.error("Vui lòng tải CV lên trước")
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
      else {
        toast.success(result.message)
        onSuccess()
      }
    })
  }

  return (
    <form action={handleSubmit} className="space-y-4">
      <Field label="Tiêu đề hồ sơ">
        <Input name="title" minLength={5} maxLength={180} required placeholder="Ví dụ: Frontend fresher đang tìm cơ hội thực tập" className={fieldClass} />
      </Field>
      <Field label="Giới thiệu bản thân & mục tiêu nghề nghiệp">
        <Textarea name="content" minLength={20} maxLength={4000} required placeholder="Chia sẻ đôi nét về bản thân, thế mạnh và mong muốn của bạn..." className={`min-h-28 ${fieldClass}`} />
      </Field>
      <Field label="Kỹ năng nổi bật">
        <Input name="skills" maxLength={1000} placeholder="JavaScript, React, teamwork..." className={fieldClass} />
      </Field>
      <div className="rounded-xl border border-dashed border-primary/20 bg-gradient-to-br from-primary/5 via-background to-rose-50/60 p-4 dark:to-rose-950/10">
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
      <label className="flex items-start gap-3 rounded-xl border border-primary/10 bg-primary/5 p-3 text-sm">
        <input
          type="checkbox"
          checked={confirmed}
          onChange={event => setConfirmed(event.target.checked)}
          className="mt-1 accent-primary"
        />
        <span>
          CV của bạn sẽ xuất hiện trong mục Khám phá cho mọi người trong cộng đồng tham khảo.
        </span>
      </label>
      <div className="flex justify-end gap-2 pt-2 border-t">
        <Button type="submit" disabled={isPending || uploading} className={ctaClass}>
          <Send className="mr-2 size-4" />
          Đăng CV lên cộng đồng
        </Button>
      </div>
    </form>
  )
}

function RecruiterRequestForm({
  request,
  enabled,
  onSuccess,
}: {
  request: MyRequest | null
  enabled: boolean
  onSuccess: () => void
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
      else {
        toast.success(result.message)
        onSuccess()
      }
    })
  }

  function cancelRequest() {
    if (!request) return

    startTransition(async () => {
      const result = await cancelRecruiterRequestAction(request.id)
      if (result.error) toast.error(result.message)
      else {
        toast.success(result.message)
        onSuccess()
      }
    })
  }

  if (!enabled && !request) return null

  const isRejected = request?.status === "rejected"

  // Pending / approved: hiển thị thẻ trạng thái read-only.
  // Rejected: rơi xuống form bên dưới để user sửa và gửi lại.
  if (request && !isRejected) {
    return (
      <div className="space-y-3 text-sm">
        <div className="flex items-center justify-between gap-3 p-3 bg-primary/5 rounded-xl border border-primary/10">
          <div>
            <div className="font-semibold text-foreground">{request.companyName}</div>
            <div className="text-xs text-muted-foreground mt-0.5">{request.position}</div>
          </div>
          <Badge className="rounded-full">{getRecruiterRequestStatusLabel(request.status)}</Badge>
        </div>
        {request.adminNote && <p className="text-xs text-rose-600 bg-rose-50 dark:bg-rose-950/20 p-2.5 rounded-lg">{request.adminNote}</p>}
        {request.status === "pending" && (
          <Button type="button" variant="outline" size="sm" className="w-full rounded-xl" disabled={isPending} onClick={cancelRequest}>
            Hủy yêu cầu
          </Button>
        )}
      </div>
    )
  }

  return (
    <form action={handleSubmit} className="space-y-4">
      {isRejected && (
        <div className="space-y-2 rounded-xl border border-rose-200 dark:border-rose-900/40 bg-rose-50 dark:bg-rose-950/20 p-3">
          <div className="flex items-center gap-2 text-sm font-semibold text-rose-600">
            <Badge variant="destructive" className="rounded-full">Đã bị từ chối</Badge>
          </div>
          {request?.adminNote && (
            <p className="text-xs text-rose-600">
              <span className="font-semibold">Lý do: </span>{request.adminNote}
            </p>
          )}
          <p className="text-xs text-muted-foreground">
            Hãy chỉnh sửa thông tin bên dưới và gửi lại để admin xét duyệt.
          </p>
        </div>
      )}
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Tên công ty">
          <Input name="companyName" maxLength={160} required defaultValue={request?.companyName ?? ""} placeholder="Ví dụ: NextStep LLC" className={fieldClass} />
        </Field>
        <Field label="Website công ty">
          <Input name="companyWebsite" type="url" maxLength={255} defaultValue={request?.companyWebsite ?? ""} placeholder="https://example.com" className={fieldClass} />
        </Field>
        <Field label="Email công việc">
          <Input name="businessEmail" type="email" maxLength={255} defaultValue={request?.businessEmail ?? ""} placeholder="hr@example.com" className={fieldClass} />
        </Field>
        <Field label="Chức vụ của bạn">
          <Input name="position" maxLength={120} required defaultValue={request?.position ?? ""} placeholder="Ví dụ: HR Manager / Tech Lead" className={fieldClass} />
        </Field>
      </div>
      <Field label="Lý do đăng ký">
        <Textarea name="reason" minLength={20} maxLength={2500} required defaultValue={request?.reason ?? ""} placeholder="Chia sẻ nhu cầu tuyển dụng và quy mô của doanh nghiệp..." className={`min-h-24 ${fieldClass}`} />
      </Field>
      <div className="flex justify-end gap-2 pt-2 border-t">
        <Button type="submit" disabled={isPending} className={ctaClass}>
          <Send className="mr-2 size-4" />
          {isRejected ? "Gửi lại yêu cầu" : "Gửi yêu cầu tuyển dụng"}
        </Button>
      </div>
    </form>
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
    <div className="flex gap-2 items-center">
      <Input
        value={content}
        onChange={event => setContent(event.target.value)}
        placeholder="Viết bình luận của bạn..."
        maxLength={1200}
        className={`${fieldClass} py-5`}
      />
      <Button type="button" size="icon" disabled={isPending || content.trim().length === 0} onClick={submit} className="rounded-xl bg-primary hover:bg-primary/95 text-white shrink-0 size-10">
        <Send className="size-4" />
      </Button>
    </div>
  )
}

function AdminCommentActions({ commentId }: { commentId: string }) {
  const [isPending, startTransition] = useTransition()

  function hideComment() {
    startTransition(async () => {
      const result = await hideExploreCommentAsAdminAction(commentId)
      if (result.error) toast.error(result.message)
      else toast.success(result.message)
    })
  }

  function deleteComment() {
    startTransition(async () => {
      const result = await deleteExploreCommentAsAdminAction(commentId)
      if (result.error) toast.error(result.message)
      else toast.success(result.message)
    })
  }

  return (
    <div className="flex shrink-0 gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
      <Button
        type="button"
        size="icon"
        variant="ghost"
        disabled={isPending}
        title="Ẩn bình luận"
        onClick={hideComment}
        className="size-7 rounded-lg text-slate-400 hover:text-foreground"
      >
        <MessageSquareOff className="size-3.5" />
      </Button>
      <Button
        type="button"
        size="icon"
        variant="ghost"
        disabled={isPending}
        title="Xóa bình luận"
        onClick={deleteComment}
        className="size-7 rounded-lg text-destructive/70 hover:text-destructive hover:bg-destructive/10"
      >
        <Trash2 className="size-3.5" />
      </Button>
    </div>
  )
}

function AdminPostActions({ postId }: { postId: string }) {
  const [isPending, startTransition] = useTransition()

  function hidePost() {
    startTransition(async () => {
      const result = await hideExplorePostAsAdminAction(postId)
      if (result.error) toast.error(result.message)
      else toast.success(result.message)
    })
  }

  function deletePost() {
    startTransition(async () => {
      const result = await deleteExplorePostAsAdminAction(postId)
      if (result.error) toast.error(result.message)
      else toast.success(result.message)
    })
  }

  return (
    <div className="flex flex-wrap gap-2 border-t border-slate-100 dark:border-border/60 pt-3">
      <Button
        type="button"
        size="sm"
        variant="outline"
        disabled={isPending}
        onClick={hidePost}
        className="rounded-xl text-xs"
      >
        <EyeOff className="mr-1.5 size-3.5" />
        Ẩn bài viết
      </Button>
      <Button
        type="button"
        size="sm"
        variant="destructive"
        disabled={isPending}
        onClick={deletePost}
        className="rounded-xl text-xs"
      >
        <Trash2 className="mr-1.5 size-3.5" />
        Xóa bài viết (Admin)
      </Button>
    </div>
  )
}

function ExplorePostCard({
  post,
  canAnalyzeWithJob,
  isAdmin,
  currentUser,
  canApply,
  alreadyApplied,
}: {
  post: PublishedPost
  canAnalyzeWithJob: boolean
  isAdmin: boolean
  currentUser: CurrentUser
  canApply: boolean
  alreadyApplied: boolean
}) {
  const isJob = post.type === "job_post"
  const [likes, setLikes] = useState(0)
  const [liked, setLiked] = useState(false)
  const [showComments, setShowComments] = useState(false)
  const [isExpanded, setIsExpanded] = useState(false)

  // Generate fallback initials & gradient color for user avatar
  const initials = useMemo(() => {
    if (!post.author?.name) return "?"
    const words = post.author.name.trim().split(" ")
    if (words.length === 1) return words[0].substring(0, 2).toUpperCase()
    return (words[0][0] + words[words.length - 1][0]).toUpperCase()
  }, [post.author?.name])

  const avatarGradient = useMemo(() => {
    const gradients = [
      "from-rose-500 to-indigo-500",
      "from-violet-600 to-amber-500",
      "from-emerald-500 to-teal-700",
      "from-blue-600 to-cyan-500",
      "from-pink-500 to-orange-400",
    ]
    const code = (post.author?.name ?? "").charCodeAt(0) || 0
    return gradients[code % gradients.length]
  }, [post.author?.name])

  function handleShare() {
    const url = `${window.location.origin}/explore/${post.id}`
    navigator.clipboard.writeText(url)
    toast.success("Đã sao chép liên kết bài đăng vào bộ nhớ tạm!")
  }

  const maxLength = 280
  const isLong = post.content.length > maxLength
  const displayContent = isExpanded || !isLong
    ? post.content
    : post.content.slice(0, maxLength) + "..."

  return (
    <Card className={`rounded-2xl border ${isJob
      ? "border-rose-100 dark:border-rose-950/40 bg-white/95 dark:bg-card/90 shadow-sm shadow-rose-500/2"
      : "border-indigo-100 dark:border-indigo-950/40 bg-white/95 dark:bg-card/90 shadow-sm shadow-indigo-500/2"
      } overflow-hidden hover:shadow-md transition-all duration-300`}>
      <CardContent className="p-5 md:p-6 space-y-4">
        {/* Post Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            {post.author?.imageUrl ? (
              <img
                src={post.author.imageUrl}
                alt={post.author.name}
                className="w-11 h-11 rounded-full object-cover ring-2 ring-primary/5"
              />
            ) : (
              <div className={`w-11 h-11 rounded-full bg-gradient-to-tr ${avatarGradient} text-white font-bold text-sm flex items-center justify-center ring-2 ring-primary/5`}>
                {initials}
              </div>
            )}
            <div>
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="font-semibold text-foreground text-sm hover:underline hover:cursor-pointer">
                  {post.author?.name ?? "Thành viên NextStep"}
                </span>
                <Badge variant="secondary" className="rounded-full text-[10px] px-1.5 py-0 bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-none font-normal">
                  {getRoleLabel(post.author?.role ?? "user")}
                </Badge>
              </div>
              <div className="text-[11px] text-muted-foreground flex items-center gap-1.5 mt-0.5">
                <span>{new Date(post.createdAt).toLocaleDateString("vi-VN", { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                <span>•</span>
                <span className="flex items-center gap-0.5">
                  {isJob ? <Briefcase className="size-3 text-red-500" /> : <FileText className="size-3 text-indigo-500" />}
                  {getExplorePostTypeLabel(post.type)}
                </span>
              </div>
            </div>
          </div>

          <Badge
            className={`rounded-full px-2.5 py-0.5 border-none text-xs font-semibold ${isJob
              ? "bg-rose-50 text-rose-700 dark:bg-rose-950/30 dark:text-rose-400"
              : "bg-indigo-50 text-indigo-700 dark:bg-indigo-950/30 dark:text-indigo-400"
              }`}
          >
            {isJob ? "Tuyển dụng" : "Ứng viên"}
          </Badge>
        </div>

        {/* Post Content */}
        <div className="space-y-2">
          <h3 className="text-base md:text-lg font-bold text-slate-800 dark:text-slate-100 tracking-tight leading-snug">
            <Link href={`/explore/${post.id}`} className="hover:text-primary transition-colors">
              {post.title}
            </Link>
          </h3>
          <p className="whitespace-pre-line text-sm text-foreground/80 leading-relaxed font-normal">
            {displayContent}
          </p>
          {isLong && (
            <button
              type="button"
              onClick={() => setIsExpanded(!isExpanded)}
              className="text-xs text-primary font-semibold hover:underline mt-1 block"
            >
              {isExpanded ? "Thu gọn" : "Xem thêm"}
            </button>
          )}
        </div>

        {/* Job Post Specific Box / Candidate CV Specific Box */}
        {isJob ? (
          <div className="rounded-xl border border-rose-100 bg-rose-50/20 dark:border-rose-950/20 dark:bg-rose-950/5 p-4 space-y-3">
            <div className="flex flex-wrap items-center gap-y-2 gap-x-4 text-xs font-medium text-slate-700 dark:text-slate-300">
              {post.companyName && (
                <div className="flex items-center gap-1.5">
                  <Building className="size-3.5 text-rose-500" />
                  <span>{post.companyName}</span>
                </div>
              )}
              {post.location && (
                <div className="flex items-center gap-1.5">
                  <MapPin className="size-3.5 text-rose-500" />
                  <span>{post.location}</span>
                </div>
              )}
              {post.salaryRange && (
                <div className="flex items-center gap-1.5">
                  <DollarSign className="size-3.5 text-rose-500" />
                  <span>{post.salaryRange}</span>
                </div>
              )}
              {post.deadline && (
                <div className="flex items-center gap-1.5">
                  <CalendarClock className="size-3.5 text-rose-500" />
                  <span>
                    Hạn nộp:{" "}
                    {new Date(post.deadline).toLocaleDateString("vi-VN", {
                      day: "numeric",
                      month: "numeric",
                      year: "numeric",
                    })}
                  </span>
                </div>
              )}
            </div>

            {post.skills && (
              <div className="flex flex-wrap gap-1.5">
                {post.skills.split(",").map(skill => (
                  <Badge key={skill} variant="outline" className="bg-white/80 dark:bg-slate-900 border-rose-200/50 dark:border-rose-950 text-xs font-normal text-slate-600 dark:text-slate-400 rounded-lg">
                    {skill.trim()}
                  </Badge>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="rounded-xl border border-indigo-100 bg-indigo-50/20 dark:border-indigo-950/20 dark:bg-indigo-950/5 p-4 space-y-3">
            <div className="flex flex-wrap items-center gap-y-2 gap-x-4 text-xs font-medium text-slate-700 dark:text-slate-300">
              {post.positionTitle && (
                <div className="flex items-center gap-1.5">
                  <GraduationCap className="size-3.5 text-indigo-500" />
                  <span>Vị trí mong muốn: {post.positionTitle}</span>
                </div>
              )}
              {post.salaryRange && (
                <div className="flex items-center gap-1.5">
                  <DollarSign className="size-3.5 text-indigo-500" />
                  <span>Mong muốn: {post.salaryRange}</span>
                </div>
              )}
            </div>

            {post.skills && (
              <div className="flex flex-wrap gap-1.5">
                {post.skills.split(",").map(skill => (
                  <Badge key={skill} variant="outline" className="bg-white/80 dark:bg-slate-900 border-indigo-200/50 dark:border-indigo-950 text-xs font-normal text-slate-600 dark:text-slate-400 rounded-lg">
                    {skill.trim()}
                  </Badge>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Action CTAs */}
        <div className="flex flex-wrap gap-2 pt-2 items-center justify-between border-t border-slate-100 dark:border-border/60">
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setLikes(prev => prev + (liked ? -1 : 1))
                setLiked(!liked)
              }}
              className={`rounded-xl text-xs gap-1.5 px-3 ${liked ? "text-primary bg-primary/5 hover:bg-primary/10" : "text-muted-foreground"}`}
            >
              <ThumbsUp className={`size-4 ${liked ? "fill-primary text-primary" : ""}`} />
              <span>{likes > 0 ? likes : "Thích"}</span>
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowComments(!showComments)}
              className={`rounded-xl text-xs gap-1.5 px-3 ${showComments ? "text-primary bg-primary/5" : "text-muted-foreground"}`}
            >
              <MessageCircle className="size-4" />
              <span>{post.comments.length > 0 ? `${post.comments.length} bình luận` : "Bình luận"}</span>
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={handleShare}
              className="rounded-xl text-xs gap-1.5 px-3 text-muted-foreground"
            >
              <Share2 className="size-4" />
              <span>Chia sẻ</span>
            </Button>
          </div>

          <div className="flex gap-2">
            {canApply && isJob && (
              <JobApplyDialog
                postId={post.id}
                positionTitle={post.positionTitle ?? post.title}
                companyName={post.companyName}
                defaultFullName={currentUser.name}
                alreadyApplied={alreadyApplied}
                size="compact"
              />
            )}
            {canAnalyzeWithJob && isJob && (
              <Button asChild className="rounded-xl text-xs font-bold bg-gradient-to-r from-red-500 via-rose-500 to-pink-500 hover:opacity-90 shadow-md shadow-red-500/10 py-1.5 px-3">
                <Link href={`/app/analyze?source=explore&postId=${post.id}`}>
                  <Sparkles className="mr-1.5 size-3.5 animate-pulse" />
                  Phân tích CV với JD
                </Link>
              </Button>
            )}
            {!isJob && post.cvUrl && (
              <Button asChild variant="default" className="rounded-xl text-xs font-bold bg-indigo-600 text-white hover:bg-indigo-700 dark:bg-indigo-600 dark:hover:bg-indigo-700 shadow-md shadow-indigo-500/10 py-1.5 px-3">
                <Link href={post.cvUrl} target="_blank">
                  <FileText className="mr-1.5 size-3.5" />
                  Xem CV ứng viên
                </Link>
              </Button>
            )}
            <Button asChild variant="ghost" size="sm" className="rounded-xl text-xs text-muted-foreground">
              <Link href={`/explore/${post.id}`}>Chi tiết</Link>
            </Button>
          </div>
        </div>

        {isAdmin && isJob && <AdminPostActions postId={post.id} />}

        {/* Comments Section */}
        {showComments && (
          <div className="border-t border-slate-100 dark:border-border/60 pt-4 space-y-4">
            <div className="space-y-3">
              {post.comments.length === 0 ? (
                <div className="text-center py-4 text-xs text-muted-foreground">Chưa có bình luận nào. Hãy bắt đầu cuộc trò chuyện!</div>
              ) : (
                post.comments.map(comment => (
                  <div key={comment.id} className="group flex items-start gap-2.5 text-sm">
                    {comment.author?.imageUrl ? (
                      <img
                        src={comment.author.imageUrl}
                        alt={comment.author.name}
                        className="w-8 h-8 rounded-full object-cover mt-0.5 shrink-0"
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                        {comment.author?.name ? comment.author.name.charAt(0).toUpperCase() : "?"}
                      </div>
                    )}
                    <div className="flex-1 bg-slate-50 dark:bg-slate-900/60 rounded-2xl px-3 py-2 border border-slate-100/40">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5">
                          <span className="font-semibold text-xs text-slate-800 dark:text-slate-200">
                            {comment.author?.name ?? "Người dùng"}
                          </span>
                          <span className="text-[10px] text-muted-foreground">
                            {getRoleLabel(comment.author?.role ?? "user")}
                          </span>
                        </div>
                        {isAdmin && <AdminCommentActions commentId={comment.id} />}
                      </div>
                      <p className="text-slate-700 dark:text-slate-300 text-xs mt-1 leading-relaxed">{comment.content}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
            <CommentForm postId={post.id} />
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function MyPostsPanel({
  posts,
  currentUserId,
  onUpdate,
}: {
  posts: MyPost[]
  currentUserId: string
  onUpdate: () => void
}) {
  const [isPending, startTransition] = useTransition()

  function hidePost(postId: string) {
    startTransition(async () => {
      const result = await hideOwnExplorePostAction(postId)
      if (result.error) toast.error(result.message)
      else {
        toast.success(result.message)
        onUpdate()
      }
    })
  }

  if (posts.length === 0) return null

  return (
    <Card className={softPanelClass}>
      <CardHeader className="pb-3">
        <CardTitle className="text-xs font-bold flex items-center gap-2 uppercase tracking-wider text-muted-foreground">
          <Activity className="size-4 text-primary" />
          Bài đăng của tôi ({posts.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 max-h-[200px] overflow-y-auto pr-1">
        {posts.map(post => (
          <div key={post.id} className="flex items-center justify-between gap-2 p-2 rounded-xl border border-slate-100 dark:border-border/40 text-xs">
            <div className="min-w-0 flex-1">
              <div className="truncate font-semibold text-foreground">{post.title}</div>
              <div className="mt-1 flex flex-wrap items-center gap-1.5">
                <Badge variant="outline" className="rounded-full text-[9px] px-1.5 py-0 border-slate-200">{getExplorePostTypeLabel(post.type)}</Badge>
                <PostStatusBadge status={post.status} />
              </div>
              {post.rejectionReason && (
                <p className="mt-1 text-[9px] text-rose-600 bg-rose-50 dark:bg-rose-950/20 p-1 rounded">{post.rejectionReason}</p>
              )}
            </div>
            {post.authorId === currentUserId && post.status !== "hidden" && post.status !== "deleted" && (
              <Button type="button" variant="outline" size="sm" className="h-6 text-[9px] px-2 rounded-lg shrink-0" disabled={isPending} onClick={() => hidePost(post.id)}>
                Ẩn bài
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
  appliedPostIds = [],
}: ExplorePageProps) {
  const [filter, setFilter] = useState<"all" | "job_post" | "cv_showcase">("all")
  const [activeTab, setActiveTab] = useState<"all" | "job_post" | "cv_showcase">("all")

  const appliedSet = useMemo(() => new Set(appliedPostIds), [appliedPostIds])
  const canApply = canApplyToJob(currentUser.role)

  // Modal Dialog states
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [createModalTab, setCreateModalTab] = useState<"cv" | "job" | "request">("cv")

  const visiblePosts = useMemo(
    () => posts.filter(post => filter === "all" || post.type === filter),
    [filter, posts]
  )

  const isRecruiterOrAdmin =
    currentUser.role === "recruiter" || currentUser.role === "admin"

  // Quick stats
  const totalJobPosts = useMemo(() => posts.filter(p => p.type === "job_post").length, [posts])
  const totalCvPosts = useMemo(() => posts.filter(p => p.type === "cv_showcase").length, [posts])

  function handleFilterChange(val: "all" | "job_post" | "cv_showcase") {
    setFilter(val)
    setActiveTab(val)
  }

  // Find 2 featured job postings and 2 featured candidate postings
  const featuredJobs = useMemo(() => posts.filter(p => p.type === "job_post").slice(0, 2), [posts])
  const featuredCvs = useMemo(() => posts.filter(p => p.type === "cv_showcase").slice(0, 2), [posts])

  const canCreateRecruiter = canCreateRecruiterPost(currentUser.role)
  const canRequestRecruiter = canSubmitRecruiterRequest(currentUser.role)

  return (
    <div className="min-h-full bg-[radial-gradient(circle_at_top,rgba(179,0,0,0.06),transparent_35%),radial-gradient(circle_at_top_right,rgba(99,102,241,0.05),transparent_25%),linear-gradient(to_bottom,var(--background),var(--background))]">
      <main className="w-full max-w-[1400px] mx-auto px-4 md:px-6 py-6 md:py-8 space-y-6">

        {/* 1. COMPRESSED Hero Section */}
        <section className="relative overflow-hidden rounded-[24px] border border-primary/10 bg-gradient-to-br from-white via-red-50/20 to-indigo-50/30 p-6 shadow-sm dark:from-card dark:via-primary/5 dark:to-secondary/5">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(179,0,0,0.03),transparent_35%)]" />

          <div className="relative flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 rounded-full border border-primary/15 bg-primary/5 px-2.5 py-0.5 text-xs font-semibold text-primary">
                <Compass className="size-3.5" />
                Explore Community
              </div>

              <h1 className="text-xl md:text-2xl font-bold tracking-tight text-foreground bg-gradient-to-r from-slate-900 via-primary to-indigo-600 bg-clip-text text-transparent dark:from-white dark:to-slate-300">
                Khám phá cơ hội nghề nghiệp & kết nối cộng đồng
              </h1>

              <p className="text-xs md:text-sm text-muted-foreground max-w-2xl font-medium">
                Đăng tuyển dụng, chia sẻ CV, nhận phản hồi và tối ưu hồ sơ trực tiếp với AI. Kết nối trực tiếp giữa doanh nghiệp và các ứng viên chất lượng cao.
              </p>
            </div>

            <Button
              onClick={() => {
                setCreateModalTab(isRecruiterOrAdmin ? "job" : "cv")
                setIsCreateModalOpen(true)
              }}
              className={`${ctaClass} shrink-0`}
            >
              <Plus className="mr-1.5 size-4" />
              Tạo bài đăng
            </Button>
          </div>
        </section>

        {/* 2. Three Column Layout */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">

          {/* Left Sidebar (Filters, Trending Skills, Tags) */}
          <div className="lg:col-span-3 space-y-5">
            {/* Content Filters */}
            <Card className="rounded-2xl border border-slate-100 dark:border-border/60 bg-white/95 shadow-sm dark:bg-card/90 overflow-hidden">
              <div className="p-3 bg-slate-50/50 dark:bg-slate-900/20 border-b border-slate-100 dark:border-border/60">
                <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <Compass className="size-3.5 text-primary" />
                  Bộ lọc nội dung
                </span>
              </div>
              <div className="p-2 space-y-1">
                {[
                  { id: "all", label: "Tất cả bài viết", count: posts.length, icon: Activity },
                  { id: "job_post", label: "Tin tuyển dụng", count: totalJobPosts, icon: Briefcase },
                  { id: "cv_showcase", label: "CV ứng viên", count: totalCvPosts, icon: FileText },
                ].map(item => {
                  const Icon = item.icon
                  const isActive = activeTab === item.id
                  return (
                    <button
                      key={item.id}
                      onClick={() => handleFilterChange(item.id as any)}
                      className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${isActive
                        ? "bg-primary/5 text-primary"
                        : "text-slate-600 hover:text-foreground hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-slate-800/40"
                        }`}
                    >
                      <span className="flex items-center gap-2">
                        <Icon className={`size-4 ${isActive ? "text-primary" : "text-slate-400"}`} />
                        {item.label}
                      </span>
                      <Badge className={`rounded-md px-1.5 py-0 border-none text-[10px] font-normal ${isActive ? "bg-primary text-white" : "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400"}`}>
                        {item.count}
                      </Badge>
                    </button>
                  )
                })}
              </div>
            </Card>

            {/* Trending Skills */}
            <Card className="rounded-2xl border border-slate-100 dark:border-border/60 bg-white/95 shadow-sm dark:bg-card/90 p-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5 mb-3">
                <TrendingUp className="size-3.5 text-rose-500" />
                Kỹ năng xu hướng
              </h3>
              <div className="flex flex-wrap gap-1.5">
                {[
                  "React / Next.js",
                  "TypeScript",
                  "AI Prompting",
                  "Node.js",
                  "Python",
                  "Golang",
                  "Figma UI/UX",
                  "AWS / DevOps"
                ].map(skill => (
                  <Badge
                    key={skill}
                    variant="secondary"
                    className="hover:bg-primary/10 hover:text-primary transition-all rounded-lg text-xs font-normal border-none bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 py-1 px-2"
                  >
                    {skill}
                  </Badge>
                ))}
              </div>
            </Card>

            {/* Popular Tags */}
            <Card className="rounded-2xl border border-slate-100 dark:border-border/60 bg-white/95 shadow-sm dark:bg-card/90 p-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5 mb-3">
                <Hash className="size-3.5 text-indigo-500" />
                Tags phổ biến
              </h3>
              <div className="flex flex-wrap gap-2">
                {[
                  "#tuyendung",
                  "#timviec",
                  "#cvshowcase",
                  "#resumepolish",
                  "#aicareer",
                  "#fresherdev",
                  "#remote"
                ].map(tag => (
                  <span
                    key={tag}
                    className="text-xs text-muted-foreground hover:text-primary cursor-pointer font-semibold transition-colors"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </Card>
          </div>

          {/* Center Column: Community Feed (Main Feed) */}
          <div className="lg:col-span-6 space-y-5">
            {/* Community Feed Header */}
            {/* <div className="flex items-center justify-between">
              <span className="font-bold uppercase tracking-wider text-muted-foreground">
                Bảng tin cộng đồng
              </span>
            </div> */}

            {/* Posts */}
            <div className="space-y-4">
              {visiblePosts.length === 0 ? (
                <div className="rounded-2xl border border-primary/10 bg-white/80 dark:bg-card/70 p-12 text-center text-muted-foreground shadow-sm">
                  <Compass className="size-10 text-slate-300 mx-auto mb-3.5 animate-pulse" />
                  Chưa có bài viết nào trong danh mục này.
                </div>
              ) : (
                visiblePosts.map(post => (
                  <ExplorePostCard
                    key={post.id}
                    post={post}
                    canAnalyzeWithJob={currentUser.role !== "recruiter"}
                    isAdmin={currentUser.role === "admin"}
                    currentUser={currentUser}
                    canApply={canApply}
                    alreadyApplied={appliedSet.has(post.id)}
                  />
                ))
              )}
            </div>
          </div>

          {/* Right Sidebar (AI Coach, Featured items, Create Post CTA) */}
          <div className="lg:col-span-3 space-y-5">
            {/* Create Post CTA box */}
            <Card className="rounded-2xl border border-slate-100 dark:border-border/60 bg-gradient-to-br from-indigo-950 to-indigo-900 text-white p-4 shadow-sm">
              <div className="flex items-center gap-2">
                <Sparkles className="size-4 text-amber-400 animate-pulse" />
                <h3 className="text-xs font-bold tracking-tight uppercase">Kết nối sự nghiệp AI</h3>
              </div>
              <p className="mt-2 text-xs text-indigo-200 leading-relaxed font-normal">
                Tạo bài đăng để nhà tuyển dụng có thể trực tiếp tìm thấy bạn, hoặc đăng bài tuyển dụng của công ty bạn ngay lập tức.
              </p>
              <div className="mt-4">
                <Button
                  onClick={() => {
                    setCreateModalTab(isRecruiterOrAdmin ? "job" : "cv")
                    setIsCreateModalOpen(true)
                  }}
                  className="w-full text-xs font-bold rounded-xl bg-white text-indigo-950 hover:bg-slate-100"
                >
                  <Plus className="mr-1.5 size-3.5" />
                  Tạo bài viết mới
                </Button>
              </div>
            </Card>

            {/* AI Career Coach */}
            <Card className="rounded-2xl border border-amber-100/70 bg-gradient-to-br from-amber-50/70 to-orange-50/60 p-4 shadow-sm dark:border-amber-950/20 dark:from-amber-950/10 dark:to-orange-950/10">
              <div className="flex items-start gap-2.5">
                <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-amber-500 text-white shadow-xs">
                  <Wand2 className="size-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-amber-950 dark:text-amber-400 uppercase tracking-wider">AI Career Coach</h4>
                  <p className="mt-1.5 text-xs text-amber-850 dark:text-amber-300 leading-relaxed font-medium">
                    "Hãy chắc chắn rằng CV của bạn cập nhật đúng kỹ năng chính. AI sẽ giúp so sánh chính xác mức độ trùng khớp giữa CV và JD tuyển dụng."
                  </p>
                </div>
              </div>
            </Card>

            {/* Featured CVs mini widgets */}
            {featuredCvs.length > 0 && (
              <Card className="rounded-2xl border border-slate-100 dark:border-border/60 bg-white/95 p-4 dark:bg-card/90">
                <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5 mb-3">
                  <FileText className="size-3.5 text-indigo-500" />
                  Hồ sơ ứng viên tiêu biểu
                </h3>
                <div className="space-y-3">
                  {featuredCvs.map(cv => (
                    <div key={cv.id} className="text-xs border-b last:border-0 pb-2 last:pb-0 space-y-1">
                      <Link href={`/explore/${cv.id}`} className="font-bold text-slate-800 dark:text-slate-200 hover:text-primary transition-colors block truncate">
                        {cv.title}
                      </Link>
                      <div className="text-[10px] text-muted-foreground flex items-center justify-between">
                        <span>{cv.author?.name}</span>
                        <span className="text-indigo-600 font-semibold">{cv.salaryRange || "Tìm việc"}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {/* Recruiter Request Form */}
            {!isRecruiterOrAdmin && (
              <Card className="rounded-2xl border border-slate-100 dark:border-border/60 bg-white/95 p-4 dark:bg-card/90">
                <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5 mb-3">
                  <ShieldCheck className="size-3.5 text-primary" />
                  Yêu cầu tuyển dụng
                </h3>
                <RecruiterRequestForm
                  request={myRequest}
                  enabled={canRequestRecruiter}
                  onSuccess={() => { }}
                />
              </Card>
            )}

            {/* My Posts panel */}
            <MyPostsPanel
              posts={myPosts}
              currentUserId={currentUser.id}
              onUpdate={() => { }}
            />
          </div>

        </section>

      </main>

      {/* UNIFIED CREATE POST MODAL */}
      <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
        <DialogContent className="max-w-2xl rounded-2xl p-6">
          <DialogHeader className="mb-4">
            <DialogTitle className="flex items-center gap-2 text-base md:text-lg">
              <Compass className="size-5 text-primary" />
              Tạo bài đăng mới
            </DialogTitle>
            <DialogDescription className="text-xs">
              Chia sẻ thông tin tuyển dụng, CV của bạn hoặc đăng ký quyền nhà tuyển dụng.
            </DialogDescription>
          </DialogHeader>

          {/* Custom Tabs Navigation */}
          <div className="flex border-b border-slate-100 dark:border-border/60 mb-4 text-xs font-bold gap-2">
            <button
              type="button"
              onClick={() => setCreateModalTab("cv")}
              className={`pb-2 px-1 border-b-2 transition-all ${createModalTab === "cv"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
            >
              Đăng CV ứng viên
            </button>
            <button
              type="button"
              disabled={!canCreateRecruiter}
              onClick={() => setCreateModalTab("job")}
              className={`pb-2 px-1 border-b-2 transition-all disabled:opacity-40 disabled:cursor-not-allowed ${createModalTab === "job"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
            >
              Đăng tin tuyển dụng {!canCreateRecruiter && "🔒"}
            </button>
            <button
              type="button"
              disabled={!canRequestRecruiter}
              onClick={() => setCreateModalTab("request")}
              className={`pb-2 px-1 border-b-2 transition-all disabled:opacity-40 disabled:cursor-not-allowed ${createModalTab === "request"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
            >
              Đăng ký nhà tuyển dụng {!canRequestRecruiter && "🔒"}
            </button>
          </div>

          <div className="mt-2">
            {createModalTab === "cv" && (
              <CvShowcaseForm onSuccess={() => setIsCreateModalOpen(false)} />
            )}
            {createModalTab === "job" && (
              <RecruiterPostForm enabled={canCreateRecruiter} onSuccess={() => setIsCreateModalOpen(false)} />
            )}
            {createModalTab === "request" && (
              <RecruiterRequestForm
                request={myRequest}
                enabled={canRequestRecruiter}
                onSuccess={() => setIsCreateModalOpen(false)}
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
