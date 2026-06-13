"use client"

import { useCallback, useEffect, useState } from "react"
import {
  ChevronLeft,
  ChevronRight,
  Search,
  Copy,
  ExternalLink,
  MoreHorizontal,
  DollarSign,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Download,
  Calendar,
  X,
  CreditCard,
  User as UserIcon,
  Layers,
  Clock
} from "lucide-react"

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
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"

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

function formatRelativeTime(dateStr: string | null) {
  if (!dateStr) return "—"
  const date = new Date(dateStr)
  const diffMs = Date.now() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMins / 60)
  const diffDays = Math.floor(diffHours / 24)

  if (diffMins < 1) return "Vừa xong"
  if (diffMins < 60) return `${diffMins} phút trước`
  if (diffHours < 24) return `${diffHours} giờ trước`
  if (diffDays === 1) return "Hôm qua"
  return `${diffDays} ngày trước`
}

function StatusBadge({ status, label }: { status: string; label: string }) {
  if (status === "paid" || status === "Success") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 dark:bg-emerald-950/35 border border-emerald-100 dark:border-emerald-900/50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 dark:text-emerald-400">
        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
        {label}
      </span>
    )
  }
  if (status === "pending" || status === "Pending") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 dark:bg-amber-950/35 border border-amber-100 dark:border-amber-900/50 px-2.5 py-0.5 text-xs font-semibold text-amber-700 dark:text-amber-400">
        <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse" />
        {label}
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-50 dark:bg-rose-950/35 border border-rose-100 dark:border-rose-900/50 px-2.5 py-0.5 text-xs font-semibold text-rose-700 dark:text-rose-400">
      <span className="h-1.5 w-1.5 rounded-full bg-rose-500" />
      {label}
    </span>
  )
}

function PlanBadge({ plan }: { plan: string }) {
  const p = plan ?? "Free"

  if (p === "Premium") {
    return (
      <Badge className="bg-purple-50 hover:bg-purple-50 text-purple-700 border border-purple-100 dark:bg-purple-950/30 dark:border-purple-900/50 dark:text-purple-400 font-semibold px-2 py-0.5 text-xs rounded-md shadow-2xs">
        Premium
      </Badge>
    )
  }

  if (p === "Start") {
    return (
      <Badge className="bg-blue-50 hover:bg-blue-50 text-blue-700 border border-blue-100 dark:bg-blue-950/30 dark:border-blue-900/50 dark:text-blue-400 font-semibold px-2 py-0.5 text-xs rounded-md shadow-2xs">
        Start
      </Badge>
    )
  }

  return (
    <Badge className="bg-zinc-50 hover:bg-zinc-50 text-zinc-500 border border-zinc-150 dark:bg-zinc-850 dark:border-zinc-800 dark:text-zinc-400 font-semibold px-2 py-0.5 text-xs rounded-md shadow-2xs">
      Free
    </Badge>
  )
}

function PaymentMethodBadge({ method = "PayOS" }: { method?: string }) {
  return (
    <Badge variant="outline" className="rounded-md font-semibold px-2 py-0.5 text-xs bg-blue-50 text-blue-700 border-blue-100 dark:bg-blue-950/30 dark:border-blue-900/50 dark:text-blue-400">
      PayOS
    </Badge>
  )
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

  // Dialog state
  const [selectedTx, setSelectedTx] = useState<TransactionRow | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

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

  // Copy helper
  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text)
    alert(`Đã sao chép ${label}`)
  }

  // Calculate stats from list
  const successCount = transactions.filter(t => t.status === "paid").length
  const failedCount = transactions.filter(t => ["failed", "cancelled", "expired"].includes(t.status)).length

  return (
    <div className="space-y-6 pb-12">
      {/* 1. Hero Section */}
      <section className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-zinc-900 p-6 rounded-2xl border border-slate-100 dark:border-zinc-800 shadow-xs">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-950 dark:text-zinc-50">
            Quản lý giao dịch
          </h1>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            Theo dõi và quản lý toàn bộ giao dịch thanh toán trên hệ thống.
          </p>
          {errorMessage && (
            <p className="mt-2 text-sm font-medium text-red-650 dark:text-red-400">
              {errorMessage}
            </p>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3.5 top-3 h-4 w-4 text-zinc-400" />
            <Input
              value={query}
              onChange={event => {
                setQuery(event.target.value)
                setPage(1)
              }}
              placeholder="Tìm kiếm giao dịch..."
              className="w-full sm:w-64 pl-9.5 bg-zinc-50/50 dark:bg-zinc-800/50 border-zinc-200 dark:border-zinc-700 rounded-full h-10 focus-visible:ring-1 focus-visible:ring-red-500/20 text-sm"
            />
          </div>

          <select
            value={status}
            onChange={event => {
              setStatus(event.target.value)
              setPage(1)
            }}
            className="h-10 rounded-full border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 px-4 text-sm font-medium outline-none text-zinc-650 dark:text-zinc-300 focus-visible:ring-2 focus-visible:ring-red-500/20"
          >
            {statusOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>

          <Button className="flex items-center gap-2 bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-50 dark:hover:bg-zinc-200 dark:text-zinc-950 text-white font-medium rounded-full px-5 h-10 shadow-xs transition-colors duration-200 text-sm border border-zinc-200 dark:border-zinc-800">
            <Download className="h-4 w-4" />
            Xuất dữ liệu
          </Button>
        </div>
      </section>

      {/* 2. Summary Cards */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Total Collected */}
        <Card className="rounded-xl border border-slate-100 dark:border-zinc-800 bg-white/70 dark:bg-zinc-900/70 shadow-xs backdrop-blur-xs transition-all duration-200 hover:shadow-sm">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">Tổng tiền đã thu</p>
              <h3 className="text-xl font-bold text-zinc-900 dark:text-zinc-50 mt-1">
                {stats?.totalPaidAmountLabel ?? "0₫"}
              </h3>
            </div>
            <div className="p-2 bg-emerald-50 dark:bg-emerald-950/35 rounded-lg text-emerald-600 dark:text-emerald-400">
              <DollarSign className="h-4 w-4" />
            </div>
          </CardContent>
        </Card>

        {/* Success Transactions */}
        <Card className="rounded-xl border border-slate-100 dark:border-zinc-800 bg-white/70 dark:bg-zinc-900/70 shadow-xs backdrop-blur-xs transition-all duration-200 hover:shadow-sm">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">Thành công</p>
              <h3 className="text-xl font-bold text-zinc-900 dark:text-zinc-50 mt-1">
                {loading ? "—" : successCount}
              </h3>
            </div>
            <div className="p-2 bg-emerald-50 dark:bg-emerald-950/35 rounded-lg text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="h-4 w-4" />
            </div>
          </CardContent>
        </Card>

        {/* Failed Transactions */}
        <Card className="rounded-xl border border-slate-100 dark:border-zinc-800 bg-white/70 dark:bg-zinc-900/70 shadow-xs backdrop-blur-xs transition-all duration-200 hover:shadow-sm">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">Thất bại</p>
              <h3 className="text-xl font-bold text-zinc-900 dark:text-zinc-50 mt-1">
                {loading ? "—" : failedCount}
              </h3>
            </div>
            <div className="p-2 bg-rose-50 dark:bg-rose-950/35 rounded-lg text-rose-600 dark:text-rose-400">
              <XCircle className="h-4 w-4" />
            </div>
          </CardContent>
        </Card>

        {/* Pending Transactions */}
        <Card className="rounded-xl border border-slate-100 dark:border-zinc-800 bg-white/70 dark:bg-zinc-900/70 shadow-xs backdrop-blur-xs transition-all duration-200 hover:shadow-sm">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">Chờ xử lý</p>
              <h3 className="text-xl font-bold text-zinc-900 dark:text-zinc-50 mt-1">
                {stats?.pendingTransactions ?? 0}
              </h3>
            </div>
            <div className="p-2 bg-amber-50 dark:bg-amber-950/35 rounded-lg text-amber-600 dark:text-amber-400">
              <AlertCircle className="h-4 w-4" />
            </div>
          </CardContent>
        </Card>
      </section>

      {/* 3. Transaction Table */}
      <section>
        <Card className="rounded-2xl border border-slate-100 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden shadow-xs">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1000px] table-auto text-left border-collapse">
                <thead>
                  <tr className="border-b border-zinc-100 dark:border-zinc-800 text-xs font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">
                    <th className="px-6 py-4">Người dùng</th>
                    <th className="px-6 py-4">Mã đơn (Order ID)</th>
                    <th className="px-6 py-4">Gói dịch vụ</th>
                    <th className="px-6 py-4">Số tiền</th>
                    <th className="px-6 py-4">Cổng thanh toán</th>
                    <th className="px-6 py-4">Trạng thái</th>
                    <th className="px-6 py-4">Thời gian</th>
                    <th className="px-6 py-4 text-right"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-50 dark:divide-zinc-800/50">
                  {loading && (
                    <tr>
                      <td
                        colSpan={8}
                        className="px-6 py-12 text-center text-sm text-zinc-400 dark:text-zinc-500"
                      >
                        <div className="flex flex-col items-center gap-2">
                          <div className="h-6 w-6 animate-spin rounded-full border-2 border-red-650 border-t-transparent"></div>
                          <span>Đang tải danh sách giao dịch...</span>
                        </div>
                      </td>
                    </tr>
                  )}

                  {!loading && transactions.length === 0 && (
                    <tr>
                      <td
                        colSpan={8}
                        className="px-6 py-16 text-center text-sm text-zinc-400 dark:text-zinc-500"
                      >
                        Chưa có giao dịch nào phù hợp
                      </td>
                    </tr>
                  )}

                  {!loading &&
                    transactions.map(transaction => {
                      const displayId = transaction.id.length > 8
                        ? `${transaction.id.substring(0, 4)}...${transaction.id.substring(transaction.id.length - 4)}`
                        : transaction.id;

                      return (
                        <tr
                          key={transaction.id}
                          onClick={() => {
                            setSelectedTx(transaction)
                            setIsModalOpen(true)
                          }}
                          className="group cursor-pointer transition-all duration-150 hover:bg-zinc-50/50 dark:hover:bg-zinc-800/30"
                        >
                          {/* User */}
                          <td className="px-6 py-4.5">
                            <div className="flex items-center gap-3">
                              <Avatar className="h-9 w-9 rounded-lg ring-2 ring-zinc-100 dark:ring-zinc-800">
                                <AvatarFallback className="bg-red-50 dark:bg-red-950/20 text-xs font-semibold text-red-600 dark:text-red-400 rounded-lg">
                                  {transaction.userName
                                    .split(" ")
                                    .map(s => s[0])
                                    .slice(0, 2)
                                    .join("")
                                    .toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <div className="font-semibold text-sm text-zinc-900 dark:text-zinc-100">
                                  {transaction.userName}
                                </div>
                                <div className="text-xs text-zinc-400 dark:text-zinc-500">
                                  {transaction.userEmail || "Không có email"}
                                </div>
                              </div>
                            </div>
                          </td>

                          {/* Order ID shortened */}
                          <td className="px-6 py-4.5">
                            <span
                              className="font-mono text-xs text-zinc-500 dark:text-zinc-400 bg-zinc-50 dark:bg-zinc-800/50 px-2 py-1 rounded-md border border-zinc-100 dark:border-zinc-800 select-all"
                              title={`Mã đơn: ${transaction.orderCode}\nID: ${transaction.id}`}
                            >
                              {displayId}
                            </span>
                          </td>

                          {/* Plan Badge */}
                          <td className="px-6 py-4.5">
                            <PlanBadge plan={transaction.planLabel} />
                          </td>

                          {/* Amount */}
                          <td className="px-6 py-4.5 font-bold text-sm text-zinc-900 dark:text-zinc-50">
                            {transaction.amountLabel}
                          </td>

                          {/* Payment Method */}
                          <td className="px-6 py-4.5">
                            <PaymentMethodBadge />
                          </td>

                          {/* Status */}
                          <td className="px-6 py-4.5">
                            <StatusBadge
                              status={transaction.status}
                              label={transaction.statusLabel}
                            />
                          </td>

                          {/* Time relative */}
                          <td
                            className="px-6 py-4.5 text-xs font-medium text-zinc-500 dark:text-zinc-400"
                            title={new Date(transaction.paidAt ?? transaction.createdAt).toLocaleString("vi-VN")}
                          >
                            {formatRelativeTime(transaction.paidAt ?? transaction.createdAt)}
                          </td>

                          {/* Action Menu */}
                          <td
                            className="px-6 py-4.5 text-right"
                            onClick={e => e.stopPropagation()}
                          >
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  variant="ghost"
                                  className="h-8 w-8 p-0 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500 dark:text-zinc-400"
                                >
                                  <MoreHorizontal className="h-4.5 w-4.5" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent
                                align="end"
                                className="w-48 rounded-xl shadow-lg border border-zinc-100 dark:border-zinc-800 p-1 bg-white dark:bg-zinc-900"
                              >
                                <DropdownMenuItem
                                  onClick={() => {
                                    setSelectedTx(transaction)
                                    setIsModalOpen(true)
                                  }}
                                  className="rounded-lg text-zinc-750 dark:text-zinc-300 gap-2 font-medium cursor-pointer"
                                >
                                  <Layers className="h-4 w-4" />
                                  Xem chi tiết
                                </DropdownMenuItem>

                                {transaction.checkoutUrl && (
                                  <DropdownMenuItem
                                    onClick={() => window.open(transaction.checkoutUrl!, "_blank")}
                                    className="rounded-lg text-zinc-750 dark:text-zinc-300 gap-2 font-medium cursor-pointer"
                                  >
                                    <ExternalLink className="h-4 w-4" />
                                    Xem PayOS Link
                                  </DropdownMenuItem>
                                )}

                                <DropdownMenuItem
                                  onClick={() => handleCopy(String(transaction.id), "ID Giao dịch")}
                                  className="rounded-lg text-zinc-750 dark:text-zinc-300 gap-2 font-medium cursor-pointer"
                                >
                                  <Copy className="h-4 w-4" />
                                  Copy ID
                                </DropdownMenuItem>

                                <DropdownMenuItem
                                  onClick={() => handleCopy(String(transaction.orderCode), "Mã đơn hàng")}
                                  className="rounded-lg text-zinc-750 dark:text-zinc-300 gap-2 font-medium cursor-pointer"
                                >
                                  <Copy className="h-4 w-4" />
                                  Copy Order Code
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

        {/* Pagination */}
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
                className={`min-w-9 h-9 rounded-lg font-medium transition-all ${pageNumber === page
                  ? "bg-red-600 hover:bg-red-700 text-white"
                  : "border-zinc-200 dark:border-zinc-700"
                  }`}
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

      {/* 4. Transaction Detail Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-lg rounded-2xl border-none shadow-xl bg-white dark:bg-zinc-900 p-6">
          <DialogHeader className="flex flex-row items-center justify-between border-b border-zinc-50 dark:border-zinc-800 pb-4">
            <DialogTitle className="text-lg font-bold text-zinc-900 dark:text-zinc-50 flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-red-600" />
              Chi tiết giao dịch
            </DialogTitle>
          </DialogHeader>

          {selectedTx && (
            <div className="space-y-5 py-4">
              {/* Profile Card Summary */}
              <div className="flex flex-col items-center text-center p-4 bg-zinc-50/50 dark:bg-zinc-800/35 rounded-xl border border-zinc-100/50 dark:border-zinc-800/50">
                <Avatar className="h-12 w-12 rounded-lg ring-4 ring-white dark:ring-zinc-800 shadow-xs mb-2">
                  <AvatarFallback className="bg-red-50 dark:bg-red-950/20 text-sm font-bold text-red-600 dark:text-red-400 rounded-lg">
                    {selectedTx.userName
                      .split(" ")
                      .map(s => s[0])
                      .slice(0, 2)
                      .join("")
                      .toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <h4 className="text-base font-bold text-zinc-900 dark:text-zinc-100">{selectedTx.userName}</h4>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">{selectedTx.userEmail || "Không có email"}</p>
                <div className="mt-3 flex items-center gap-2">
                  <PlanBadge plan={selectedTx.planLabel} />
                  <StatusBadge status={selectedTx.status} label={selectedTx.statusLabel} />
                </div>
              </div>

              {/* Transaction Fields */}
              <div className="space-y-3.5 bg-zinc-50/30 dark:bg-zinc-800/10 p-4 rounded-xl border border-zinc-100/50 dark:border-zinc-800/50 text-sm">
                <div className="flex justify-between items-start gap-4">
                  <span className="text-zinc-400 dark:text-zinc-500 flex items-center gap-1.5"><Calendar className="h-4 w-4" /> Mã đơn hàng (Order ID)</span>
                  <span className="font-mono text-xs text-zinc-700 dark:text-zinc-300 bg-zinc-50 dark:bg-zinc-800 px-1.5 py-0.5 rounded border border-zinc-200/50 dark:border-zinc-700/50 select-all max-w-[200px] truncate">
                    {selectedTx.orderCode}
                  </span>
                </div>

                <div className="flex justify-between items-center border-t border-zinc-50 dark:border-zinc-800/50 pt-2.5">
                  <span className="text-zinc-400 dark:text-zinc-500 flex items-center gap-1.5"><DollarSign className="h-4 w-4" /> Số tiền giao dịch</span>
                  <span className="font-bold text-zinc-900 dark:text-zinc-550 text-base">
                    {selectedTx.amountLabel}
                  </span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-zinc-400 dark:text-zinc-500 flex items-center gap-1.5"><CreditCard className="h-4 w-4" /> Phương thức</span>
                  <PaymentMethodBadge />
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-zinc-400 dark:text-zinc-500 flex items-center gap-1.5"><Clock className="h-4 w-4" /> Thời gian tạo</span>
                  <span className="font-semibold text-zinc-700 dark:text-zinc-300">
                    {new Date(selectedTx.createdAt).toLocaleString("vi-VN")}
                  </span>
                </div>

                {selectedTx.paidAt && (
                  <div className="flex justify-between items-center">
                    <span className="text-zinc-400 dark:text-zinc-500 flex items-center gap-1.5"><CheckCircle2 className="h-4 w-4" /> Thời gian thanh toán</span>
                    <span className="font-semibold text-zinc-750 dark:text-zinc-300">
                      {new Date(selectedTx.paidAt).toLocaleString("vi-VN")}
                    </span>
                  </div>
                )}

                <div className="flex justify-between items-start gap-4 border-t border-dashed border-zinc-150 dark:border-zinc-800 pt-2.5">
                  <span className="text-zinc-400 dark:text-zinc-500 flex items-center gap-1.5"><Layers className="h-4 w-4" /> ID Giao dịch</span>
                  <span className="font-mono text-[10px] text-zinc-700 dark:text-zinc-400 truncate max-w-[220px] select-all bg-zinc-50 dark:bg-zinc-800 px-1 py-0.5 rounded border border-zinc-200/50 dark:border-zinc-700/50">
                    {selectedTx.id}
                  </span>
                </div>
              </div>
            </div>
          )}

          <DialogFooter className="flex flex-row gap-2.5 pt-4 border-t border-zinc-50 dark:border-zinc-800">
            {selectedTx?.id && (
              <Button
                variant="outline"
                onClick={() => handleCopy(selectedTx.id, "ID Giao dịch")}
                className="flex-1 rounded-xl border border-zinc-200 dark:border-zinc-700 h-10 font-semibold text-sm gap-1.5"
              >
                <Copy className="h-4 w-4" />
                Copy ID
              </Button>
            )}

            {selectedTx?.checkoutUrl && (
              <Button
                onClick={() => window.open(selectedTx.checkoutUrl!, "_blank")}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white rounded-xl h-10 font-semibold text-sm gap-1.5"
              >
                <ExternalLink className="h-4 w-4" />
                Xem PayOS Link
              </Button>
            )}

            <Button
              variant="secondary"
              onClick={() => setIsModalOpen(false)}
              className="rounded-xl h-10 font-semibold text-sm bg-zinc-100 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-900 dark:text-zinc-50"
            >
              Đóng
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
