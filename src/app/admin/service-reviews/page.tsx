"use client"

import { useCallback, useEffect, useState } from "react"
import {
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  EyeOff,
  Search,
  Star,
} from "lucide-react"
import { toast } from "sonner"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
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
}

const pageSize = 20
const statusOptions = [
  { value: "all", label: "Tất cả" },
  { value: "pending", label: "Chờ duyệt" },
  { value: "published", label: "Đã hiển thị" },
  { value: "hidden", label: "Đã ẩn" },
]

function getVisiblePages(totalPages: number, currentPage: number) {
  const start = Math.max(1, currentPage - 2)
  const end = Math.min(totalPages, start + 4)
  return Array.from({ length: end - start + 1 }, (_, index) => start + index)
}

function StatusBadge({ status, label }: { status: string; label: string }) {
  const className =
    status === "published"
      ? "bg-emerald-50 text-emerald-700 hover:bg-emerald-50"
      : status === "hidden"
        ? "bg-slate-100 text-slate-700 hover:bg-slate-100"
        : "bg-amber-50 text-amber-700 hover:bg-amber-50"

  return <Badge className={`rounded-full ${className}`}>{label}</Badge>
}

function RatingStars({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5 text-amber-500">
      {Array.from({ length: 5 }, (_, index) => {
        const value = index + 1

        return (
          <Star
            key={value}
            className="size-4"
            fill={value <= rating ? "currentColor" : "none"}
          />
        )
      })}
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
        throw new Error(await response.text())
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
        throw new Error(await response.text())
      }

      toast.success("Đã cập nhật đánh giá")
      await fetchReviews()
    } catch (error) {
      console.error("Failed to update service review", error)
      toast.error("Không cập nhật được đánh giá.")
    } finally {
      setUpdatingId(null)
    }
  }

  const totalPages =
    pagination != null ? Math.max(1, Math.ceil(pagination.total / pageSize)) : 1
  const visiblePages = getVisiblePages(totalPages, page)

  return (
    <div className="space-y-6">
      <section className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Đánh giá dịch vụ
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Quản lý phản hồi của người dùng về các dịch vụ trong hệ thống.
          </p>
          {errorMessage && (
            <p className="mt-2 text-sm font-medium text-destructive">
              {errorMessage}
            </p>
          )}
        </div>

        <div className="grid gap-3 sm:grid-cols-[1fr_auto_auto]">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={event => {
                setQuery(event.target.value)
                setPage(1)
              }}
              placeholder="Tìm tên, email hoặc nội dung..."
              className="w-full pl-9 sm:w-80"
            />
          </div>
          <select
            value={serviceKey}
            onChange={event => {
              setServiceKey(event.target.value)
              setPage(1)
            }}
            className="h-9 rounded-md border border-input bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
          >
            <option value="all">Tất cả dịch vụ</option>
            {SERVICE_REVIEW_SERVICE_KEYS.map(key => (
              <option key={key} value={key}>
                {getServiceReviewServiceLabel(key)}
              </option>
            ))}
          </select>
          <select
            value={status}
            onChange={event => {
              setStatus(event.target.value)
              setPage(1)
            }}
            className="h-9 rounded-md border border-input bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
          >
            {statusOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Card className="rounded-2xl">
          <CardContent className="p-5">
            <p className="text-sm text-muted-foreground">Tổng đánh giá</p>
            <p className="mt-2 text-2xl font-semibold">
              {stats?.totalReviews ?? 0}
            </p>
          </CardContent>
        </Card>
        <Card className="rounded-2xl">
          <CardContent className="p-5">
            <p className="text-sm text-muted-foreground">Điểm trung bình</p>
            <p className="mt-2 text-2xl font-semibold">
              {stats?.averageRating ?? 0}/5
            </p>
          </CardContent>
        </Card>
        <Card className="rounded-2xl">
          <CardContent className="p-5">
            <p className="text-sm text-muted-foreground">Chờ duyệt</p>
            <p className="mt-2 text-2xl font-semibold">
              {stats?.pendingReviews ?? 0}
            </p>
          </CardContent>
        </Card>
      </section>

      <section>
        <Card className="rounded-2xl">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[980px] table-auto text-left">
                <thead>
                  <tr className="border-b text-sm text-muted-foreground">
                    <th className="px-6 py-4">Người dùng</th>
                    <th className="px-6 py-4">Dịch vụ</th>
                    <th className="px-6 py-4">Điểm</th>
                    <th className="px-6 py-4">Nội dung</th>
                    <th className="px-6 py-4">Trạng thái</th>
                    <th className="px-6 py-4">Thời gian</th>
                    <th className="px-6 py-4">Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {loading && (
                    <tr>
                      <td
                        colSpan={7}
                        className="px-6 py-10 text-center text-sm text-muted-foreground"
                      >
                        Đang tải...
                      </td>
                    </tr>
                  )}

                  {!loading && reviews.length === 0 && (
                    <tr>
                      <td
                        colSpan={7}
                        className="px-6 py-10 text-center text-sm text-muted-foreground"
                      >
                        Chưa có đánh giá dịch vụ
                      </td>
                    </tr>
                  )}

                  {!loading &&
                    reviews.map(review => (
                      <tr key={review.id} className="border-b last:border-0">
                        <td className="px-6 py-4">
                          <div className="font-medium">{review.userName}</div>
                          <div className="text-xs text-muted-foreground">
                            {review.userEmail || "Không có email"}
                          </div>
                        </td>
                        <td className="px-6 py-4">{review.serviceLabel}</td>
                        <td className="px-6 py-4">
                          <RatingStars rating={review.rating} />
                        </td>
                        <td className="max-w-md px-6 py-4 text-sm">
                          {review.comment || (
                            <span className="text-muted-foreground">
                              Không có nội dung
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <StatusBadge
                            status={review.status}
                            label={review.statusLabel}
                          />
                        </td>
                        <td className="px-6 py-4 text-sm text-muted-foreground">
                          {new Date(review.createdAt).toLocaleString("vi-VN")}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              disabled={
                                updatingId === review.id ||
                                review.status === "published"
                              }
                              onClick={() => updateStatus(review.id, "published")}
                            >
                              <CheckCircle2 className="mr-1 size-4" />
                              Duyệt
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              disabled={
                                updatingId === review.id ||
                                review.status === "hidden"
                              }
                              onClick={() => updateStatus(review.id, "hidden")}
                            >
                              <EyeOff className="mr-1 size-4" />
                              Ẩn
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {pagination != null && totalPages > 1 && (
          <div className="mt-4 flex flex-wrap items-center justify-end gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1 || loading}
              onClick={() => setPage(value => Math.max(1, value - 1))}
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
                className="min-w-9"
              >
                {pageNumber}
              </Button>
            ))}
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages || loading}
              onClick={() => setPage(value => Math.min(totalPages, value + 1))}
            >
              Sau
              <ChevronRight className="ml-1 size-4" />
            </Button>
          </div>
        )}
      </section>
    </div>
  )
}
