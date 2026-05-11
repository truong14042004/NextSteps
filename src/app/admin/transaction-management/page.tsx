"use client"

import { useCallback, useEffect, useState } from "react"
import { ChevronLeft, ChevronRight, ReceiptText, Search } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"

type TransactionRow = {
  id: string
  userName: string
  userEmail: string
  planLabel: string
  orderCode: number
  amountLabel: string
  status: string
  statusLabel: string
  checkoutUrl: string | null
  paidAt: string | null
  createdAt: string
}

type Pagination = {
  page: number
  pageSize: number
  total: number
}

type TransactionStats = {
  totalPaidAmountLabel: string
  pendingTransactions: number
}

const pageSize = 20
const statusOptions = [
  { value: "all", label: "Tất cả" },
  { value: "pending", label: "Đang chờ" },
  { value: "paid", label: "Đã thanh toán" },
  { value: "cancelled", label: "Đã hủy" },
  { value: "expired", label: "Đã hết hạn" },
  { value: "failed", label: "Thất bại" },
]

function getVisiblePages(totalPages: number, currentPage: number) {
  const start = Math.max(1, currentPage - 2)
  const end = Math.min(totalPages, start + 4)
  return Array.from({ length: end - start + 1 }, (_, index) => start + index)
}

function StatusBadge({ status, label }: { status: string; label: string }) {
  const className =
    status === "paid"
      ? "bg-emerald-50 text-emerald-700 hover:bg-emerald-50"
      : status === "pending"
        ? "bg-amber-50 text-amber-700 hover:bg-amber-50"
        : status === "failed"
          ? "bg-red-50 text-red-700 hover:bg-red-50"
          : "bg-slate-100 text-slate-700 hover:bg-slate-100"

  return <Badge className={`rounded-full ${className}`}>{label}</Badge>
}

export default function AdminTransactionManagementPage() {
  const [transactions, setTransactions] = useState<TransactionRow[]>([])
  const [pagination, setPagination] = useState<Pagination | null>(null)
  const [stats, setStats] = useState<TransactionStats | null>(null)
  const [query, setQuery] = useState("")
  const [status, setStatus] = useState("all")
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const fetchTransactions = useCallback(async () => {
    setLoading(true)

    try {
      const params = new URLSearchParams({
        page: String(page),
        pageSize: String(pageSize),
        status,
      })

      if (query.trim()) {
        params.set("q", query.trim())
      }

      const response = await fetch(`/api/admin/transactions?${params}`, {
        cache: "no-store",
      })

      if (!response.ok) {
        throw new Error(await response.text())
      }

      const data = (await response.json()) as {
        transactions: TransactionRow[]
        pagination: Pagination
        stats: TransactionStats
      }

      setTransactions(data.transactions)
      setPagination(data.pagination)
      setStats(data.stats)
      setErrorMessage(null)
    } catch (error) {
      console.error("Failed to fetch admin transactions", error)
      setTransactions([])
      setPagination(null)
      setErrorMessage("Không tải được danh sách giao dịch.")
    } finally {
      setLoading(false)
    }
  }, [page, query, status])

  useEffect(() => {
    fetchTransactions()
  }, [fetchTransactions])

  const totalPages =
    pagination != null ? Math.max(1, Math.ceil(pagination.total / pageSize)) : 1
  const visiblePages = getVisiblePages(totalPages, page)

  return (
    <div className="space-y-6">
      <section className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Quản lý giao dịch
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Theo dõi các giao dịch payOS, trạng thái và số tiền thanh toán.
          </p>
          {errorMessage && (
            <p className="mt-2 text-sm font-medium text-destructive">
              {errorMessage}
            </p>
          )}
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={event => {
                setQuery(event.target.value)
                setPage(1)
              }}
              placeholder="Tìm email, tên hoặc mã đơn..."
              className="w-full pl-9 sm:w-80"
            />
          </div>
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
            <p className="text-sm text-muted-foreground">Tổng tiền đã thu</p>
            <p className="mt-2 text-2xl font-semibold">
              {stats?.totalPaidAmountLabel ?? "0₫"}
            </p>
          </CardContent>
        </Card>
        <Card className="rounded-2xl">
          <CardContent className="p-5">
            <p className="text-sm text-muted-foreground">Giao dịch đang chờ</p>
            <p className="mt-2 text-2xl font-semibold">
              {stats?.pendingTransactions ?? 0}
            </p>
          </CardContent>
        </Card>
        <Card className="rounded-2xl">
          <CardContent className="p-5">
            <p className="text-sm text-muted-foreground">Đang hiển thị</p>
            <p className="mt-2 text-2xl font-semibold">
              {transactions.length}/{pagination?.total ?? 0}
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
                    <th className="px-6 py-4">Mã đơn</th>
                    <th className="px-6 py-4">Gói</th>
                    <th className="px-6 py-4">Số tiền</th>
                    <th className="px-6 py-4">Trạng thái</th>
                    <th className="px-6 py-4">Thời gian</th>
                    <th className="px-6 py-4">Link</th>
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

                  {!loading && transactions.length === 0 && (
                    <tr>
                      <td
                        colSpan={7}
                        className="px-6 py-10 text-center text-sm text-muted-foreground"
                      >
                        Chưa có giao dịch
                      </td>
                    </tr>
                  )}

                  {!loading &&
                    transactions.map(transaction => (
                      <tr key={transaction.id} className="border-b last:border-0">
                        <td className="px-6 py-4">
                          <div className="font-medium">{transaction.userName}</div>
                          <div className="text-xs text-muted-foreground">
                            {transaction.userEmail || "Không có email"}
                          </div>
                        </td>
                        <td className="px-6 py-4 font-mono text-sm">
                          {transaction.orderCode}
                        </td>
                        <td className="px-6 py-4">{transaction.planLabel}</td>
                        <td className="px-6 py-4 font-semibold">
                          {transaction.amountLabel}
                        </td>
                        <td className="px-6 py-4">
                          <StatusBadge
                            status={transaction.status}
                            label={transaction.statusLabel}
                          />
                        </td>
                        <td className="px-6 py-4 text-sm text-muted-foreground">
                          {new Date(
                            transaction.paidAt ?? transaction.createdAt
                          ).toLocaleString("vi-VN")}
                        </td>
                        <td className="px-6 py-4">
                          {transaction.checkoutUrl ? (
                            <a
                              href={transaction.checkoutUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1 text-sm font-medium text-primary"
                            >
                              <ReceiptText className="size-4" />
                              Mở
                            </a>
                          ) : (
                            <span className="text-sm text-muted-foreground">—</span>
                          )}
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
