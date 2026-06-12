"use client"

import { useCallback, useEffect, useState } from "react"
import {
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  EyeOff,
  Search,
  Star,
  MessageSquare,
  Clock,
  TrendingUp,
  MoreHorizontal,
  X,
  User,
  Mail,
  Calendar,
  Trash2,
  Filter,
  Eye,
  Award,
} from "lucide-react"
import { toast } from "sonner"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  SERVICE_REVIEW_SERVICE_KEYS,
  getServiceReviewServiceLabel,
} from "@/features/serviceReviews/serviceReviewRules.mjs"

type ServiceReviewRow = {
  id: string
  userName: string
  userEmail: string
  serviceKey: string
  serviceLabel: string
  rating: number
  comment: string | null
  status: string
  statusLabel: string
  createdAt: string
}

type Pagination = {
  page: number
  pageSize: number
  total: number
}

type ReviewStats = {
  totalReviews: number
  pendingReviews: number
  averageRating: number
  satisfactionRate?: number // Optional key from backend
  ratingDistribution?: {     // Optional rating distribution from backend
    1: number
    2: number
    3: number
    4: number
    5: number
  }
}

const pageSize = 20
const statusOptions = [
  { value: "all", label: "Tất cả trạng thái" },
  { value: "pending", label: "Chờ duyệt" },
  { value: "published", label: "Đã hiển thị" },
  { value: "hidden", label: "Đã ẩn" },
]

function getVisiblePages(totalPages: number, currentPage: number) {
  const start = Math.max(1, currentPage - 2)
  const end = Math.min(totalPages, start + 4)
  return Array.from({ length: end - start + 1 }, (_, index) => start + index)
}

// Service badge coloring helper
function ServiceBadge({ serviceKey, label }: { serviceKey: string; label: string }) {
  let className = "bg-slate-50 hover:bg-slate-50 text-slate-700 border-slate-200"

  switch (serviceKey) {
    case "resume_analysis":
      className = "bg-emerald-50 hover:bg-emerald-50 text-emerald-700 border-emerald-100 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900/50"
      break
    case "ai_question":
      className = "bg-violet-50 hover:bg-violet-50 text-violet-700 border-violet-100 dark:bg-violet-950/20 dark:text-violet-400 dark:border-violet-900/50"
      break
    case "mock_interview":
      className = "bg-amber-50 hover:bg-amber-50 text-amber-700 border-amber-100 dark:bg-amber-950/20 dark:text-amber-400 dark:border-amber-900/50"
      break
    case "system":
      className = "bg-blue-50 hover:bg-blue-50 text-blue-700 border-blue-100 dark:bg-blue-950/20 dark:text-blue-400 dark:border-blue-900/50"
      break
  }

  return (
    <Badge variant="outline" className={`font-medium px-2 py-0.5 text-xs rounded-md shadow-2xs ${className}`}>
      {label}
    </Badge>
  )
}

// Status badge coloring helper
function StatusBadge({ status, label }: { status: string; label: string }) {
  let className = "bg-amber-50 text-amber-700 border-amber-100 dark:bg-amber-950/30 dark:text-amber-450 dark:border-amber-900/50"
  let indicatorColor = "bg-amber-500"

  if (status === "published") {
    className = "bg-emerald-50 text-emerald-700 border-emerald-100 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-900/50"
    indicatorColor = "bg-emerald-500"
  } else if (status === "hidden") {
    className = "bg-zinc-50 text-zinc-650 border-zinc-200 dark:bg-zinc-800/40 dark:text-zinc-400 dark:border-zinc-700/60"
    indicatorColor = "bg-zinc-400"
  }

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold ${className}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${indicatorColor} ${status === "pending" ? "animate-pulse" : ""}`} />
      {label}
    </span>
  )
}

// Relative date formatter
function formatRelativeTime(dateStr: string) {
  const date = new Date(dateStr)
  const diffMs = Date.now() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMins / 60)
  const diffDays = Math.floor(diffHours / 24)

  if (diffMins < 1) return "Vừa xong"
  if (diffMins < 60) return `${diffMins} phút trước`
  if (diffHours < 24) return `${diffHours} giờ trước`
  if (diffDays === 1) return "Hôm qua"
  if (diffDays < 30) return `${diffDays} ngày trước`
  return date.toLocaleDateString("vi-VN", { dateStyle: "medium" })
}

function RatingStars({ rating, showValue = true }: { rating: number; showValue?: boolean }) {
  return (
    <div className="flex items-center gap-1.5">
      <div className="flex items-center gap-0.5 text-amber-500 dark:text-amber-400">
        {Array.from({ length: 5 }, (_, index) => {
          const value = index + 1
          return (
            <Star
              key={value}
              className="size-4"
              fill={value <= rating ? "currentColor" : "none"}
              strokeWidth={2}
            />
          )
        })}
      </div>
      {showValue && (
        <span className="text-sm font-bold text-zinc-700 dark:text-zinc-300">
          {rating.toFixed(1)}
        </span>
      )}
    </div>
  )
}

export default function AdminServiceReviewsPage() {
  const [reviews, setReviews] = useState<ServiceReviewRow[]>([])
  const [pagination, setPagination] = useState<Pagination | null>(null)
  const [stats, setStats] = useState<ReviewStats | null>(null)
  const [query, setQuery] = useState("")
  const [status, setStatus] = useState("all")
  const [serviceKey, setServiceKey] = useState("all")
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(false)
  const [updatingId, setUpdatingId] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  // Drawer / Modal states
  const [drawerReview, setDrawerReview] = useState<ServiceReviewRow | null>(null)
  const [drawerOpen, setDrawerOpen] = useState(false)

  // Calculate analytics from the reviews list
  const totalReviewsCount = reviews.length
  const ratingCounts = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
  
  reviews.forEach(r => {
    const rVal = Math.min(5, Math.max(1, Math.round(r.rating))) as 1 | 2 | 3 | 4 | 5
    ratingCounts[rVal]++
  })

  const highRatingCount = ratingCounts[4] + ratingCounts[5]
  const lowRatingCount = ratingCounts[1] + ratingCounts[2]

  const highRatingPct = totalReviewsCount > 0 ? Math.round((highRatingCount / totalReviewsCount) * 100) : 0
  const lowRatingPct = totalReviewsCount > 0 ? Math.round((lowRatingCount / totalReviewsCount) * 100) : 0

  // Calculate published average rating
  const publishedReviews = reviews.filter(r => r.status === "published")
  const publishedCount = publishedReviews.length
  const publishedSum = publishedReviews.reduce((sum, r) => sum + r.rating, 0)
  const publishedAverage = publishedCount > 0 ? Math.round((publishedSum / publishedCount) * 10) / 10 : 0

  // Mini Insight Logic
  let miniInsight = "Chưa có đủ dữ liệu để tạo insight."
  let insightColorClass = "text-zinc-650 bg-zinc-50 border-zinc-150 dark:text-zinc-400 dark:bg-zinc-800/50 dark:border-zinc-700/50"
  
  if (totalReviewsCount > 0) {
    if (lowRatingCount > 0 && (lowRatingCount / totalReviewsCount) >= 0.15) {
      miniInsight = `Cần chú ý các đánh giá thấp 1-2 sao (chiếm ${lowRatingPct}% phản hồi của trang này).`
      insightColorClass = "text-rose-700 bg-rose-50 border-rose-100 dark:text-rose-450 dark:bg-rose-950/20 dark:border-rose-900/50"
    } else if (ratingCounts[5] / totalReviewsCount >= 0.5) {
      miniInsight = `Phần lớn người dùng đánh giá tuyệt đối 5 sao (chiếm ${Math.round((ratingCounts[5] / totalReviewsCount) * 100)}% phản hồi).`
      insightColorClass = "text-emerald-700 bg-emerald-50 border-emerald-100 dark:text-emerald-400 dark:bg-emerald-950/20 dark:border-emerald-900/50"
    } else if (highRatingCount / totalReviewsCount >= 0.7) {
      miniInsight = `Điểm hài lòng đang ở mức tốt (tỷ lệ đánh giá tốt 4-5 sao đạt ${highRatingPct}%).`
      insightColorClass = "text-emerald-700 bg-emerald-50 border-emerald-100 dark:text-emerald-450 dark:bg-emerald-950/20 dark:border-emerald-900/50"
    } else {
      miniInsight = `Mức độ hài lòng của người dùng ổn định (tỷ lệ đánh giá tốt đạt ${highRatingPct}%).`
      insightColorClass = "text-amber-700 bg-amber-50 border-amber-100 dark:text-amber-450 dark:bg-amber-950/20 dark:border-amber-900/50"
    }
  }

  const fetchReviews = useCallback(async () => {
    setLoading(true)

    try {
      const params = new URLSearchParams({
        page: String(page),
        pageSize: String(pageSize),
        status,
        serviceKey,
      })

      if (query.trim()) {
        params.set("q", query.trim())
      }

      const response = await fetch(`/api/admin/service-reviews?${params}`, {
        cache: "no-store",
      })

      if (!response.ok) {
        const errorBody = await response.text()
        let errorMsg = `HTTP ${response.status}`
        try {
          const parsed = JSON.parse(errorBody) as { message?: string }
          errorMsg = parsed.message ?? errorMsg
        } catch {
          errorMsg = errorBody || errorMsg
        }
        throw new Error(errorMsg)
      }

      const data = (await response.json()) as {
        reviews: ServiceReviewRow[]
        pagination: Pagination
        stats: ReviewStats
      }

      setReviews(data.reviews)
      setPagination(data.pagination)
      setStats(data.stats)
      setErrorMessage(null)
    } catch (error) {
      console.error("Failed to fetch service reviews", error)
      setReviews([])
      setPagination(null)
      setErrorMessage("Không tải được đánh giá dịch vụ.")
    } finally {
      setLoading(false)
    }
  }, [page, query, serviceKey, status])

  // Sync drawer details when reviews change
  useEffect(() => {
    if (drawerReview) {
      const updated = reviews.find(r => r.id === drawerReview.id)
      if (updated && (updated.status !== drawerReview.status || updated.comment !== drawerReview.comment)) {
        setDrawerReview(updated)
      }
    }
  }, [reviews, drawerReview])

  useEffect(() => {
    fetchReviews()
  }, [fetchReviews])

  async function updateStatus(reviewId: string, nextStatus: string) {
    setUpdatingId(reviewId)

    try {
      const response = await fetch(`/api/admin/service-reviews/${reviewId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus }),
      })

      if (!response.ok) {
        const errorBody = await response.text()
        let errorMsg = `HTTP ${response.status}`
        try {
          const parsed = JSON.parse(errorBody) as { message?: string }
          errorMsg = parsed.message ?? errorMsg
        } catch {
          errorMsg = errorBody || errorMsg
        }
        throw new Error(errorMsg)
      }

      const statusMsg = nextStatus === "published" ? "đã được duyệt hiển thị" : "đã được ẩn"
      toast.success(`Đánh giá ${statusMsg}`)
      await fetchReviews()
    } catch (error) {
      console.error("Failed to update service review status", error)
      toast.error("Không cập nhật được trạng thái đánh giá.")
    } finally {
      setUpdatingId(null)
    }
  }

  async function handleDelete(reviewId: string) {
    if (!confirm("Bạn có chắc chắn muốn xóa đánh giá này? Hành động này sẽ chuyển trạng thái đánh giá sang ẩn.")) return

    setUpdatingId(reviewId)
    try {
      // Since API doesn't support DELETE endpoint, we archive/hide it
      const response = await fetch(`/api/admin/service-reviews/${reviewId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "hidden" }),
      })

      if (!response.ok) {
        const errorBody = await response.text()
        let errorMsg = `HTTP ${response.status}`
        try {
          const parsed = JSON.parse(errorBody) as { message?: string }
          errorMsg = parsed.message ?? errorMsg
        } catch {
          errorMsg = errorBody || errorMsg
        }
        throw new Error(errorMsg)
      }

      toast.success("Đã xóa đánh giá (chuyển sang trạng thái ẩn)")
      if (drawerReview?.id === reviewId) {
        setDrawerOpen(false)
        setDrawerReview(null)
      }
      await fetchReviews()
    } catch (error) {
      console.error("Failed to delete review", error)
      toast.error("Không xóa được đánh giá.")
    } finally {
      setUpdatingId(null)
    }
  }

  const totalPages =
    pagination != null ? Math.max(1, Math.ceil(pagination.total / pageSize)) : 1
  const visiblePages = getVisiblePages(totalPages, page)

  return (
    <div className="space-y-6 pb-12 relative min-h-screen">
      {/* 1. Hero Section */}
      <section className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-zinc-900 p-6 rounded-2xl border border-slate-100 dark:border-zinc-800 shadow-xs">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-950 dark:text-zinc-50">
            Đánh giá dịch vụ
          </h1>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            Theo dõi phản hồi, mức độ hài lòng và trải nghiệm của người dùng trên nền tảng NextStep.
          </p>
          {errorMessage && (
            <p className="mt-2 text-sm font-medium text-red-655 dark:text-red-400">
              {errorMessage}
            </p>
          )}
        </div>

        <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 w-full md:w-auto">
          <div className="relative w-full sm:w-auto">
            <Search className="absolute left-3 top-2.5 size-4 text-zinc-450 dark:text-zinc-500" />
            <Input
              value={query}
              onChange={event => {
                setQuery(event.target.value)
                setPage(1)
              }}
              placeholder="Tìm tên, email hoặc nội dung..."
              className="w-full pl-9 sm:w-60 lg:w-72 bg-zinc-50/50 dark:bg-zinc-850 border-zinc-200 dark:border-zinc-700/80 rounded-full h-9 focus-visible:ring-1 focus-visible:ring-red-500/20 text-sm"
            />
          </div>

          <Select
            value={serviceKey}
            onValueChange={value => {
              setServiceKey(value)
              setPage(1)
            }}
          >
            <SelectTrigger className="bg-zinc-50 dark:bg-zinc-850 border border-zinc-200 dark:border-zinc-700/80 rounded-full px-3.5 h-9 shadow-3xs text-xs sm:text-sm text-zinc-655 dark:text-zinc-300 focus-visible:ring-1 focus-visible:ring-red-500/20 gap-1 font-medium min-w-[125px] sm:min-w-[135px]">
              <Filter className="h-3.5 w-3.5 text-zinc-400 mr-0.5" />
              <SelectValue placeholder="Dịch vụ" />
            </SelectTrigger>
            <SelectContent className="rounded-xl border border-zinc-100 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-md p-1">
              <SelectItem value="all" className="rounded-lg cursor-pointer text-sm">Tất cả dịch vụ</SelectItem>
              {SERVICE_REVIEW_SERVICE_KEYS.map(key => (
                <SelectItem key={key} value={key} className="rounded-lg cursor-pointer text-sm">
                  {getServiceReviewServiceLabel(key)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={status}
            onValueChange={value => {
              setStatus(value)
              setPage(1)
            }}
          >
            <SelectTrigger className="bg-zinc-50 dark:bg-zinc-850 border border-zinc-200 dark:border-zinc-700/80 rounded-full px-3.5 h-9 shadow-3xs text-xs sm:text-sm text-zinc-655 dark:text-zinc-300 focus-visible:ring-1 focus-visible:ring-red-500/20 gap-1 font-medium min-w-[130px] sm:min-w-[145px]">
              <Filter className="h-3.5 w-3.5 text-zinc-400 mr-0.5" />
              <SelectValue placeholder="Trạng thái" />
            </SelectTrigger>
            <SelectContent className="rounded-xl border border-zinc-100 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-md p-1">
              {statusOptions.map(option => (
                <SelectItem key={option.value} value={option.value} className="rounded-lg cursor-pointer text-sm">
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </section>

      {/* 2. Summary Cards */}
      <section className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <Card className="rounded-xl border border-slate-100 dark:border-zinc-800 bg-white/70 dark:bg-zinc-900/70 shadow-xs backdrop-blur-xs transition-all duration-200 hover:shadow-sm">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">Tổng đánh giá</p>
              <h3 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50 mt-1">
                {stats?.totalReviews.toLocaleString() ?? "0"}
              </h3>
              <p className="text-[10px] text-zinc-450 dark:text-zinc-500 font-medium mt-0.5">Từ lúc khởi động NextStep</p>
            </div>
            <div className="p-2.5 bg-zinc-50 dark:bg-zinc-800 rounded-lg text-zinc-500 dark:text-zinc-400">
              <MessageSquare className="h-4 w-4" />
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-xl border border-slate-100 dark:border-zinc-800 bg-white/70 dark:bg-zinc-900/70 shadow-xs backdrop-blur-xs transition-all duration-200 hover:shadow-sm">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">Điểm trung bình</p>
              {stats && stats.totalReviews > 0 ? (
                <>
                  <div className="flex items-center gap-2 mt-1">
                    <h3 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
                      {stats.averageRating.toFixed(1)} / 5
                    </h3>
                    <div className="flex text-amber-500 dark:text-amber-400">
                      <Star className="h-4 w-4" fill="currentColor" stroke="none" />
                    </div>
                  </div>
                  <p className="text-[10px] text-zinc-450 dark:text-zinc-500 font-medium mt-0.5">Tất cả phản hồi</p>
                </>
              ) : (
                <>
                  <h3 className="text-sm font-semibold text-zinc-550 dark:text-zinc-400 mt-2">
                    Chưa có dữ liệu
                  </h3>
                  <p className="text-[10px] text-zinc-450 dark:text-zinc-500 font-medium mt-0.5">Chưa có đánh giá</p>
                </>
              )}
            </div>
            <div className="p-2.5 bg-zinc-50 dark:bg-zinc-800 rounded-lg text-zinc-500 dark:text-zinc-400">
              <Star className="h-4 w-4" />
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-xl border border-slate-100 dark:border-zinc-800 bg-white/70 dark:bg-zinc-900/70 shadow-xs backdrop-blur-xs transition-all duration-200 hover:shadow-sm">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">Điểm hiển thị</p>
              {publishedCount > 0 ? (
                <>
                  <div className="flex items-center gap-2 mt-1">
                    <h3 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
                      {publishedAverage.toFixed(1)} / 5
                    </h3>
                    <div className="flex text-amber-500 dark:text-amber-400">
                      <Star className="h-4 w-4" fill="currentColor" stroke="none" />
                    </div>
                  </div>
                  <p className="text-[10px] text-zinc-450 dark:text-zinc-500 font-medium mt-0.5">Đã duyệt hiển thị</p>
                </>
              ) : (
                <>
                  <h3 className="text-sm font-semibold text-zinc-550 dark:text-zinc-400 mt-2">
                    Chưa có dữ liệu
                  </h3>
                  <p className="text-[10px] text-zinc-450 dark:text-zinc-500 font-medium mt-0.5">Không có đánh giá đã hiển thị</p>
                </>
              )}
            </div>
            <div className="p-2.5 bg-amber-50 dark:bg-amber-950/20 rounded-lg text-amber-550 dark:text-amber-400">
              <Star className="h-4 w-4" fill="currentColor" />
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-xl border border-slate-100 dark:border-zinc-800 bg-white/70 dark:bg-zinc-900/70 shadow-xs backdrop-blur-xs transition-all duration-200 hover:shadow-sm">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">Chờ duyệt</p>
              <h3 className={`text-2xl font-bold mt-1 ${stats && stats.pendingReviews > 0 ? "text-amber-600 dark:text-amber-500" : "text-zinc-900 dark:text-zinc-50"}`}>
                {stats?.pendingReviews.toLocaleString() ?? "0"}
              </h3>
              <p className="text-[10px] text-zinc-455 dark:text-zinc-500 font-medium mt-0.5">
                {stats && stats.pendingReviews > 0 ? "Yêu cầu cần xử lý gấp" : "Tất cả đã được xử lý"}
              </p>
            </div>
            <div className={`p-2.5 rounded-lg ${stats && stats.pendingReviews > 0 ? "bg-amber-50 dark:bg-amber-950/20 text-amber-550 dark:text-amber-450" : "bg-zinc-50 dark:bg-zinc-800 text-zinc-450 dark:text-zinc-500"}`}>
              <Clock className="h-4 w-4" />
            </div>
          </CardContent>
        </Card>
      </section>

      {/* 5. Analytics Section */}
      {totalReviewsCount > 0 && (
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Left Side: Rating Distribution Chart */}
          <Card className="rounded-2xl border border-slate-100 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xs p-5 flex flex-col justify-between">
            <div>
              <h3 className="text-xs font-bold text-zinc-900 dark:text-zinc-150 uppercase tracking-wider mb-4 flex items-center gap-2">
                <Award className="h-4.5 w-4.5 text-red-650" />
                Phân bố đánh giá (Trang này)
              </h3>
              <div className="space-y-3">
                {([5, 4, 3, 2, 1] as const).map(stars => {
                  const count = ratingCounts[stars]
                  const percentage = totalReviewsCount > 0 ? Math.round((count / totalReviewsCount) * 100) : 0
                  
                  // Color mapping: 4-5 star: emerald, 3 star: amber, 1-2 star: rose/red
                  let progressColor = "bg-emerald-500 dark:bg-emerald-400"
                  if (stars === 3) {
                    progressColor = "bg-amber-500 dark:bg-amber-400"
                  } else if (stars <= 2) {
                    progressColor = "bg-rose-500 dark:bg-rose-450"
                  }

                  return (
                    <div key={stars} className="flex items-center gap-3 text-xs sm:text-sm">
                      <span className="w-12 font-semibold text-zinc-650 dark:text-zinc-400 flex items-center gap-0.5">
                        {stars} <Star className="h-3.5 w-3.5 fill-amber-500 text-amber-500 inline stroke-none" />
                      </span>
                      <div className="flex-1 h-2.5 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                        <div
                          className={`h-full ${progressColor} rounded-full transition-all duration-500`}
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                      <span className="w-20 text-right text-zinc-550 dark:text-zinc-400">
                        <span className="font-semibold text-zinc-900 dark:text-zinc-100">{count}</span> ({percentage}%)
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Mini Insight */}
            <div className={`mt-4 p-3 rounded-xl border ${insightColorClass} text-xs font-medium flex items-center gap-2`}>
              <TrendingUp className="h-3.5 w-3.5 shrink-0" />
              <span>{miniInsight}</span>
            </div>
          </Card>

          {/* Right Side: Average Rating Overview */}
          <Card className="rounded-2xl border border-slate-100 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xs p-5 flex flex-col justify-between">
            <div>
              <h3 className="text-xs font-bold text-zinc-900 dark:text-zinc-150 uppercase tracking-wider mb-4 flex items-center gap-2">
                <MessageSquare className="h-4.5 w-4.5 text-red-650" />
                Tổng quan phản hồi người dùng
              </h3>
              
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="p-3.5 bg-zinc-50/50 dark:bg-zinc-850 rounded-xl border border-zinc-100 dark:border-zinc-800">
                  <span className="text-[10px] text-zinc-400 dark:text-zinc-550 block font-semibold uppercase tracking-wider">Phản hồi trang này</span>
                  <span className="text-xl font-bold text-zinc-900 dark:text-zinc-100 mt-1 block">
                    {totalReviewsCount}
                  </span>
                  <span className="text-[9px] text-zinc-400 dark:text-zinc-500 mt-0.5 block">Đánh giá hiện thị</span>
                </div>

                <div className="p-3.5 bg-zinc-50/50 dark:bg-zinc-850 rounded-xl border border-zinc-100 dark:border-zinc-800">
                  <span className="text-[10px] text-zinc-400 dark:text-zinc-550 block font-semibold uppercase tracking-wider">Điểm trung bình</span>
                  <div className="flex items-center gap-1 mt-1">
                    <span className="text-xl font-bold text-zinc-900 dark:text-zinc-100">
                      {stats ? stats.averageRating.toFixed(1) : "0.0"}
                    </span>
                    <RatingStars rating={stats?.averageRating ?? 0} showValue={false} />
                  </div>
                  <span className="text-[9px] text-zinc-400 dark:text-zinc-500 mt-0.5 block">Toàn hệ thống</span>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs sm:text-sm border-b border-zinc-100 dark:border-zinc-800 pb-1.5">
                  <span className="text-zinc-500 dark:text-zinc-450 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    Đánh giá tốt (4-5 sao)
                  </span>
                  <span className="font-bold text-zinc-900 dark:text-zinc-50">{highRatingPct}%</span>
                </div>
                <div className="flex items-center justify-between text-xs sm:text-sm">
                  <span className="text-zinc-500 dark:text-zinc-450 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-rose-500" />
                    Đánh giá thấp (1-2 sao)
                  </span>
                  <span className="font-bold text-zinc-900 dark:text-zinc-50">{lowRatingPct}%</span>
                </div>
              </div>
            </div>

            <div className="text-[10px] text-zinc-400 dark:text-zinc-550 border-t border-dashed border-zinc-150 dark:border-zinc-800 pt-3 mt-3">
              * Phân tích và insight được tự động tính toán dựa trên phản hồi của trang hiện tại.
            </div>
          </Card>
        </section>
      )}

      {/* 3. Review Table or 6. Empty State */}
      <section>
        {reviews.length === 0 && !loading ? (
          <div className="flex flex-col items-center justify-center p-16 text-center bg-white dark:bg-zinc-900 rounded-2xl border border-slate-100 dark:border-zinc-800 shadow-xs">
            <span className="text-4xl mb-3">⭐</span>
            <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-200">Chưa có phản hồi từ người dùng</h3>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1 max-w-sm">
              Hãy khuyến khích người dùng đánh giá trải nghiệm dịch vụ.
            </p>
          </div>
        ) : (
          <Card className="rounded-2xl border border-slate-100 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden shadow-xs">
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[980px] table-auto text-left border-collapse">
                  <thead>
                    <tr className="border-b border-zinc-100 dark:border-zinc-800 text-xs font-semibold text-zinc-405 dark:text-zinc-550 uppercase tracking-wider">
                      <th className="px-6 py-4">Người dùng</th>
                      <th className="px-6 py-4">Dịch vụ</th>
                      <th className="px-6 py-4">Đánh giá</th>
                      <th className="px-6 py-4">Nội dung</th>
                      <th className="px-6 py-4">Trạng thái</th>
                      <th className="px-6 py-4">Thời gian</th>
                      <th className="px-6 py-4 text-right"></th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-zinc-50 dark:divide-zinc-800/50">
                    {loading && reviews.length === 0 && (
                      <tr>
                        <td colSpan={7} className="px-6 py-12 text-center text-sm text-zinc-400 dark:text-zinc-500">
                          <div className="flex flex-col items-center gap-2">
                            <div className="h-6 w-6 animate-spin rounded-full border-2 border-red-600 border-t-transparent" />
                            <span>Đang tải danh sách đánh giá...</span>
                          </div>
                        </td>
                      </tr>
                    )}

                    {reviews.map(review => {
                      const isFocused = drawerReview?.id === review.id
                      const displayComment = review.comment || ""
                      const previewComment = displayComment.length > 50 ? `${displayComment.slice(0, 50)}...` : displayComment

                      return (
                        <tr
                          key={review.id}
                          onClick={() => {
                            setDrawerReview(review)
                            setDrawerOpen(true)
                          }}
                          className={`group cursor-pointer transition-all duration-150 hover:bg-zinc-50/50 dark:hover:bg-zinc-800/30 ${isFocused ? "bg-zinc-50 dark:bg-zinc-800/40" : ""}`}
                        >
                          {/* User Column */}
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <Avatar className="h-9 w-9 rounded-lg ring-2 ring-zinc-100 dark:ring-zinc-800 transition-transform group-hover:scale-102">
                                <AvatarFallback className="bg-red-50 dark:bg-red-950/20 text-xs font-semibold text-red-650 dark:text-red-400 rounded-lg">
                                  {review.userName
                                    .split(" ")
                                    .map(s => s[0])
                                    .slice(0, 2)
                                    .join("")
                                    .toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                              <div className="max-w-[200px] truncate">
                                <div className="font-semibold text-sm text-zinc-900 dark:text-zinc-100 group-hover:text-zinc-950 dark:group-hover:text-zinc-50 transition-colors">
                                  {review.userName}
                                </div>
                                <div className="text-xs text-zinc-400 dark:text-zinc-500 truncate mt-0.5">
                                  {review.userEmail || "Không có email"}
                                </div>
                              </div>
                            </div>
                          </td>

                          {/* Service Column */}
                          <td className="px-6 py-4">
                            <ServiceBadge serviceKey={review.serviceKey} label={review.serviceLabel} />
                          </td>

                          {/* Rating Column */}
                          <td className="px-6 py-4">
                            <RatingStars rating={review.rating} />
                          </td>

                          {/* Content Column */}
                          <td className="px-6 py-4 max-w-xs text-sm" title={review.comment || undefined}>
                            {review.comment ? (
                              <div className="text-zinc-650 dark:text-zinc-300 font-normal truncate max-w-[240px]">
                                {previewComment}
                              </div>
                            ) : (
                              <span className="text-zinc-400 dark:text-zinc-550 italic">
                                Chỉ đánh giá số sao
                              </span>
                            )}
                          </td>

                          {/* Status Badge Column */}
                          <td className="px-6 py-4">
                            <StatusBadge status={review.status} label={review.statusLabel} />
                          </td>

                          {/* Relative Time Column */}
                          <td className="px-6 py-4 text-xs font-medium text-zinc-500 dark:text-zinc-400" title={new Date(review.createdAt).toLocaleString("vi-VN")}>
                            {formatRelativeTime(review.createdAt)}
                          </td>

                          {/* Actions Column */}
                          <td className="px-6 py-4 text-right" onClick={e => e.stopPropagation()}>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  variant="ghost"
                                  className="h-8 w-8 p-0 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500 dark:text-zinc-400"
                                >
                                  <MoreHorizontal className="h-4.5 w-4.5" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="w-44 rounded-xl shadow-lg border border-zinc-100 dark:border-zinc-800 p-1 bg-white dark:bg-zinc-900">
                                <DropdownMenuItem
                                  onClick={() => {
                                    setDrawerReview(review)
                                    setDrawerOpen(true)
                                  }}
                                  className="rounded-lg text-zinc-700 dark:text-zinc-300 gap-2 font-medium cursor-pointer"
                                >
                                  <Eye className="h-4 w-4" />
                                  Xem chi tiết
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  disabled={updatingId === review.id || review.status === "published"}
                                  onClick={() => updateStatus(review.id, "published")}
                                  className="rounded-lg text-emerald-650 dark:text-emerald-400 focus:bg-emerald-50 dark:focus:bg-emerald-950/20 gap-2 font-medium cursor-pointer"
                                >
                                  <CheckCircle2 className="h-4 w-4" />
                                  Hiển thị đánh giá
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  disabled={updatingId === review.id || review.status === "hidden"}
                                  onClick={() => updateStatus(review.id, "hidden")}
                                  className="rounded-lg text-zinc-600 dark:text-zinc-400 focus:bg-zinc-100 dark:focus:bg-zinc-800 gap-2 font-medium cursor-pointer"
                                >
                                  <EyeOff className="h-4 w-4" />
                                  Ẩn đánh giá
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  disabled={updatingId === review.id}
                                  onClick={() => handleDelete(review.id)}
                                  className="rounded-lg text-red-600 dark:text-red-400 focus:bg-red-50 dark:focus:bg-red-950/20 gap-2 font-medium cursor-pointer"
                                >
                                  <Trash2 className="h-4 w-4" />
                                  Xóa đánh giá
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Pagination Controls */}
        {pagination != null && totalPages > 1 && (
          <div className="mt-4 flex flex-wrap items-center justify-end gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1 || loading}
              onClick={() => setPage(value => Math.max(1, value - 1))}
              className="rounded-lg border-zinc-200 dark:border-zinc-700 h-9 font-medium"
            >
              <ChevronLeft className="mr-1 size-4" />
              Trước
            </Button>
            {visiblePages.map(pageNumber => (
              <Button
                key={pageNumber}
                variant={pageNumber === page ? "default" : "outline"}
                size="sm"
                disabled={loading}
                onClick={() => setPage(pageNumber)}
                className={`min-w-9 h-9 rounded-lg font-medium transition-all ${pageNumber === page ? "bg-red-600 hover:bg-red-700 text-white" : "border-zinc-200 dark:border-zinc-700"}`}
              >
                {pageNumber}
              </Button>
            ))}
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages || loading}
              onClick={() => setPage(value => Math.min(totalPages, value + 1))}
              className="rounded-lg border-zinc-200 dark:border-zinc-700 h-9 font-medium"
            >
              Sau
              <ChevronRight className="ml-1 size-4" />
            </Button>
          </div>
        )}
      </section>

      {/* 4. Sliding Review Detail Drawer */}
      {drawerOpen && drawerReview && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40 bg-zinc-950/20 backdrop-blur-xs transition-opacity duration-300"
            onClick={() => setDrawerOpen(false)}
          />
          {/* Drawer Panel */}
          <div className="fixed inset-y-0 right-0 z-50 w-full max-w-md bg-white dark:bg-zinc-900 border-l border-zinc-150 dark:border-zinc-800 shadow-2xl p-6 flex flex-col justify-between transform transition-transform duration-300 ease-out translate-x-0">
            <div className="space-y-6 overflow-y-auto pr-1 flex-1">
              {/* Header */}
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-50 flex items-center gap-2">
                  <MessageSquare className="h-5 w-5 text-red-600" />
                  Chi tiết đánh giá
                </h3>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setDrawerOpen(false)}
                  className="h-8 w-8 rounded-lg text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800"
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>

              {/* User Information Profile Card */}
              <div className="flex flex-col items-center text-center p-4 bg-zinc-50/50 dark:bg-zinc-805 rounded-2xl border border-zinc-100/50 dark:border-zinc-800/50">
                <Avatar className="h-16 w-16 rounded-2xl ring-4 ring-white dark:ring-zinc-800 shadow-xs mb-3">
                  <AvatarFallback className="bg-red-50 dark:bg-red-950/20 text-lg font-bold text-red-650 dark:text-red-400 rounded-2xl">
                    {drawerReview.userName
                      .split(" ")
                      .map(s => s[0])
                      .slice(0, 2)
                      .join("")
                      .toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <h4 className="text-base font-bold text-zinc-900 dark:text-zinc-100">{drawerReview.userName}</h4>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">{drawerReview.userEmail || "Không có email"}</p>
                <div className="mt-3">
                  <StatusBadge status={drawerReview.status} label={drawerReview.statusLabel} />
                </div>
              </div>

              {/* Service Information details */}
              <div className="space-y-4">
                <h5 className="text-xs font-bold text-zinc-405 dark:text-zinc-500 uppercase tracking-wider">Thông tin dịch vụ</h5>
                <div className="space-y-3.5 bg-zinc-50/30 dark:bg-zinc-800/10 p-4 rounded-xl border border-zinc-100/50 dark:border-zinc-800/50 text-sm">
                  <div className="flex justify-between items-center">
                    <span className="text-zinc-400 dark:text-zinc-500 flex items-center gap-1.5"><Award className="h-4 w-4" /> Dịch vụ đánh giá</span>
                    <ServiceBadge serviceKey={drawerReview.serviceKey} label={drawerReview.serviceLabel} />
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-zinc-400 dark:text-zinc-500 flex items-center gap-1.5"><Star className="h-4 w-4" /> Điểm đánh giá</span>
                    <RatingStars rating={drawerReview.rating} />
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-zinc-400 dark:text-zinc-500 flex items-center gap-1.5"><Calendar className="h-4 w-4" /> Thời gian gửi</span>
                    <span className="font-semibold text-zinc-700 dark:text-zinc-300" title={new Date(drawerReview.createdAt).toLocaleString("vi-VN")}>
                      {formatRelativeTime(drawerReview.createdAt)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Review Content */}
              <div className="space-y-3">
                <h5 className="text-xs font-bold text-zinc-405 dark:text-zinc-500 uppercase tracking-wider">Nội dung phản hồi</h5>
                <div className="p-4 bg-zinc-50/50 dark:bg-zinc-850 rounded-xl border border-zinc-100 dark:border-zinc-800 text-sm text-zinc-700 dark:text-zinc-300 min-h-[100px] leading-relaxed">
                  {drawerReview.comment ? (
                    drawerReview.comment
                  ) : (
                    <span className="text-zinc-400 dark:text-zinc-500 italic">
                      Người dùng chỉ đánh giá bằng số sao.
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Admin Action Buttons */}
            <div className="flex flex-col gap-2 pt-4 mt-4 border-t border-zinc-150 dark:border-zinc-800">
              <div className="grid grid-cols-2 gap-2">
                <Button
                  disabled={updatingId === drawerReview.id || drawerReview.status === "published"}
                  onClick={() => updateStatus(drawerReview.id, "published")}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl gap-2 font-semibold h-11"
                >
                  <CheckCircle2 className="h-4 w-4" />
                  Hiển thị
                </Button>
                <Button
                  variant="outline"
                  disabled={updatingId === drawerReview.id || drawerReview.status === "hidden"}
                  onClick={() => updateStatus(drawerReview.id, "hidden")}
                  className="border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100 text-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800 rounded-xl gap-2 font-semibold h-11"
                >
                  <EyeOff className="h-4 w-4" />
                  Ẩn đánh giá
                </Button>
              </div>

              <Button
                variant="outline"
                disabled={updatingId === drawerReview.id}
                onClick={() => handleDelete(drawerReview.id)}
                className="w-full border-zinc-200 dark:border-zinc-700 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-xl gap-2 font-semibold h-11"
              >
                <Trash2 className="h-4 w-4" />
                Xóa đánh giá
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
