"use client"

import Link from "next/link"
import { useState, useMemo } from "react"
import {
  ArrowLeft,
  Briefcase,
  Building,
  Calendar,
  DollarSign,
  FileText,
  GraduationCap,
  MapPin,
  MessageCircle,
  Share2,
  Bookmark,
  Sparkles,
  ThumbsUp,
  Flag,
  CalendarDays
} from "lucide-react"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { getExplorePostTypeLabel, getRoleLabel } from "@/features/explore/exploreRules.mjs"
import { JobApplyDialog } from "@/components/explore/JobApplyDialog"
import { ExplorePostDetailComments } from "./_ExplorePostDetailComments"
import type { getExplorePostById } from "@/features/explore/db"

type PostDetail = NonNullable<Awaited<ReturnType<typeof getExplorePostById>>>

type ExplorePostDetailClientProps = {
  post: PostDetail
  currentUserId: string
  isAdmin: boolean
  isRecruiter: boolean
  adminActions: React.ReactNode
  canApply?: boolean
  alreadyApplied?: boolean
  applicantName?: string
}

export function ExplorePostDetailClient({
  post,
  currentUserId,
  isAdmin,
  isRecruiter,
  adminActions,
  canApply = false,
  alreadyApplied = false,
  applicantName = "",
}: ExplorePostDetailClientProps) {
  const isJob = post.type === "job_post"
  const [likes, setLikes] = useState(0)
  const [liked, setLiked] = useState(false)
  const [isBookmarked, setIsBookmarked] = useState(false)

  // Copy shareable link
  function handleShare() {
    const url = window.location.href
    navigator.clipboard.writeText(url)
    toast.success("Đã sao chép liên kết bài đăng vào bộ nhớ tạm!")
  }

  // Report post
  function handleReport() {
    toast.success("Cảm ơn bạn. Bài viết này đã được gửi tới Ban quản trị để kiểm duyệt.")
  }

  // Fallback avatar gradients
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

  // Parse raw text content into separate sections
  const parsedSections = useMemo(() => {
    const sections: { title: string; items: string[] }[] = []
    const lines = post.content.split("\n")
    let currentSection = { title: isJob ? "Mô tả công việc" : "Giới thiệu bản thân", items: [] as string[] }

    for (const line of lines) {
      const trimmed = line.trim()
      if (!trimmed) continue

      // Detect headers (e.g. bold line or ending with colon)
      const isHeader =
        /^(mô tả công việc|trách nhiệm|nhiệm vụ|yêu cầu|quyền lợi|lợi ích|kỹ năng|giới thiệu|kinh nghiệm|học vấn|skill|requirements|benefits|responsibilities|description|summary|yêu cầu công việc|quyền lợi được hưởng):?$/i.test(trimmed) ||
        (trimmed.length < 50 && (trimmed.endsWith(":") || trimmed.startsWith("###") || trimmed.startsWith("**")));

      if (isHeader) {
        if (currentSection.items.length > 0) {
          sections.push(currentSection)
        }
        currentSection = {
          title: trimmed.replace(/^[#*\s:]+/, "").replace(/:$/, ""),
          items: []
        }
      } else {
        currentSection.items.push(trimmed.replace(/^[-*\s]+/, ""))
      }
    }

    if (currentSection.items.length > 0) {
      sections.push(currentSection)
    }

    return sections.length > 0 ? sections : [{ title: isJob ? "Mô tả công việc" : "Chi tiết hồ sơ", items: lines.filter(l => l.trim()) }]
  }, [post.content, isJob])

  return (
    <div className="w-full max-w-[800px] mx-auto px-4 md:px-6 py-6 md:py-8 space-y-6">

      {/* Back button */}
      <div>
        <Button asChild variant="ghost" className="px-0 hover:bg-transparent text-muted-foreground hover:text-foreground">
          <Link href="/explore">
            <ArrowLeft className="mr-2 size-4" />
            Quay lại Khám phá
          </Link>
        </Button>
      </div>

      {/* Main Content Area - Center Single Column */}
      <div className="space-y-6">
        <Card className="rounded-2xl border border-slate-100 dark:border-border/60 bg-white/95 dark:bg-card/90 shadow-md p-5 md:p-8 space-y-6 overflow-hidden">

          {/* Header: Author info */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-6 border-b border-slate-100 dark:border-border/60">
            <div className="flex items-center gap-3.5">
              {post.author?.imageUrl ? (
                <img
                  src={post.author.imageUrl}
                  alt={post.author.name}
                  className="w-12 h-12 rounded-full object-cover ring-2 ring-primary/5"
                />
              ) : (
                <div className={`w-12 h-12 rounded-full bg-gradient-to-tr ${avatarGradient} text-white font-bold flex items-center justify-center ring-2 ring-primary/5`}>
                  {initials}
                </div>
              )}
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-foreground text-base">
                    {post.author?.name ?? "Thành viên NextStep"}
                  </span>
                  <Badge variant="secondary" className="rounded-full text-[10px] px-2 py-0 border-none font-medium bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                    {getRoleLabel(post.author?.role ?? "user")}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1.5">
                  <CalendarDays className="size-3" />
                  Đăng ngày {new Date(post.createdAt).toLocaleDateString("vi-VN", { day: 'numeric', month: 'long', year: 'numeric' })}
                  {post.companyName && (
                    <>
                      <span>•</span>
                      <span className="font-semibold text-primary">{post.companyName}</span>
                    </>
                  )}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              <Badge className={`rounded-full border-none px-3 py-1 font-semibold text-xs ${isJob ? "bg-rose-50 text-rose-700 dark:bg-rose-950/30" : "bg-indigo-50 text-indigo-700 dark:bg-indigo-950/30"
                }`}>
                {isJob ? "Tin tuyển dụng" : "CV ứng viên"}
              </Badge>
            </div>
          </div>

          {/* Title and Attributes */}
          <div className="space-y-4">
            <h1 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-slate-50 tracking-tight leading-tight">
              {post.title}
            </h1>

            {/* Sub-header Badges / Job attributes */}
            <div className="flex flex-wrap gap-2 text-xs">
              {post.salaryRange && (
                <div className="flex items-center gap-1 bg-emerald-50 text-emerald-800 dark:bg-emerald-950/20 dark:text-emerald-400 px-2.5 py-1 rounded-lg font-semibold">
                  <DollarSign className="size-3.5" />
                  <span>Lương: {post.salaryRange}</span>
                </div>
              )}
              {post.location && (
                <div className="flex items-center gap-1 bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300 px-2.5 py-1 rounded-lg font-semibold">
                  <MapPin className="size-3.5 text-slate-500" />
                  <span>Địa điểm: {post.location}</span>
                </div>
              )}
              {post.positionTitle && (
                <div className="flex items-center gap-1 bg-indigo-50 text-indigo-800 dark:bg-indigo-950/20 dark:text-indigo-400 px-2.5 py-1 rounded-lg font-semibold">
                  {isJob ? <Briefcase className="size-3.5 text-indigo-500" /> : <GraduationCap className="size-3.5 text-indigo-500" />}
                  <span>{isJob ? "Vị trí tuyển" : "Vị trí ứng tuyển"}: {post.positionTitle}</span>
                </div>
              )}
            </div>

            {/* Skills required tags */}
            {post.skills && (
              <div className="flex flex-wrap gap-1.5 pt-1">
                {post.skills.split(",").map(skill => (
                  <Badge key={skill} variant="outline" className="text-xs font-normal bg-slate-50/50 dark:bg-slate-900 border-slate-200 text-slate-600 dark:text-slate-400 rounded-lg px-2.5 py-0.5">
                    {skill.trim()}
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* INTEGRATED ACTION BUTTONS & TOOLBAR */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-50/70 dark:bg-slate-900/40 p-4 rounded-xl border border-slate-100 dark:border-border/60">
            <div className="flex items-center gap-1.5">
              {/* Primary Action Button */}
              {isJob ? (
                <>
                  {canApply && (
                    <JobApplyDialog
                      postId={post.id}
                      positionTitle={post.positionTitle ?? post.title}
                      companyName={post.companyName}
                      defaultFullName={applicantName}
                      alreadyApplied={alreadyApplied}
                    />
                  )}
                  {!isRecruiter && post.status === "published" && (
                    <Button asChild className="rounded-xl font-bold bg-gradient-to-r from-red-500 via-rose-500 to-pink-500 hover:opacity-90 shadow-md shadow-red-500/10">
                      <Link href={`/app/analyze?source=explore&postId=${post.id}`}>
                        <Sparkles className="mr-1.5 size-4 animate-pulse" />
                        Phân tích CV với JD
                      </Link>
                    </Button>
                  )}
                </>
              ) : (
                post.cvUrl && (
                  <Button asChild className="rounded-xl font-bold bg-indigo-600 text-white hover:bg-indigo-700 dark:bg-indigo-600 dark:hover:bg-indigo-700 shadow-md shadow-indigo-500/10">
                    <Link href={post.cvUrl} target="_blank">
                      <FileText className="mr-1.5 size-4" />
                      Xem CV ứng viên
                    </Link>
                  </Button>
                )
              )}

              {/* Bookmark */}
              {/* <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => {
                  setIsBookmarked(!isBookmarked)
                  toast.success(isBookmarked ? "Đã hủy lưu bài viết!" : "Đã lưu bài viết thành công!")
                }}
                className={`rounded-xl size-10 ${isBookmarked
                  ? "border-primary/20 text-primary bg-primary/5"
                  : "border-slate-200 bg-white hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900"
                  }`}
                title="Lưu bài viết"
              >
                <Bookmark className={`size-4 ${isBookmarked ? "fill-primary text-primary" : ""}`} />
              </Button> */}

              {/* Share */}
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={handleShare}
                className="rounded-xl size-10 border-slate-200 bg-white hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900"
                title="Chia sẻ liên kết"
              >
                <Share2 className="size-4" />
              </Button>
            </div>

            {/* <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleReport}
              className="rounded-xl text-xs font-semibold text-rose-500 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/20"
            >
              <Flag className="mr-1.5 size-3.5" />
              Báo cáo vi phạm
            </Button> */}
          </div>

          {/* Structured Post Content */}
          <div className="space-y-6 pt-2">
            {parsedSections.map((sect, sidx) => (
              <div key={sidx} className="space-y-2.5">
                <h3 className="text-sm md:text-base font-bold text-slate-800 dark:text-slate-100 border-l-4 border-primary pl-2.5 uppercase tracking-wide">
                  {sect.title}
                </h3>
                <div className="text-sm md:text-base text-foreground/80 leading-relaxed space-y-2">
                  {sect.items.map((item, iidx) => (
                    <p key={iidx} className="whitespace-pre-line font-normal">
                      {item.startsWith("•") || item.startsWith("-") ? item : `• ${item}`}
                    </p>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Bottom Action Copy for better UX */}
          {/* {isJob && !isRecruiter && post.status === "published" && (
            <div className="pt-6 border-t border-slate-100 dark:border-border/60 text-center">
              <Button asChild className="rounded-xl px-8 py-6 font-bold bg-gradient-to-r from-red-500 via-rose-500 to-pink-500 hover:opacity-90 shadow-lg shadow-red-500/20 text-sm">
                <Link href={`/app/analyze?source=explore&postId=${post.id}`}>
                  <Sparkles className="mr-2 size-4.5 animate-pulse" />
                  Phân tích CV của bạn ngay với bài viết này
                </Link>
              </Button>
            </div>
          )} */}

          {/* Admin actions block */}
          {adminActions}

        </Card>

        {/* Upgraded Comments Area */}
        <Card className="rounded-2xl border border-slate-100 dark:border-border/60 bg-white/95 dark:bg-card/90 shadow-md p-5 md:p-8">
          <h3 className="text-base font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2 mb-6">
            <MessageCircle className="size-5 text-primary" />
            Thảo luận cộng đồng ({post.comments.length})
          </h3>

          <ExplorePostDetailComments
            currentUserId={currentUserId}
            postId={post.id}
            comments={post.comments}
            canComment={post.status === "published"}
            isAdmin={isAdmin}
          />
        </Card>
      </div>

    </div>
  )
}
