"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Plus,
  Edit,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Search,
  Filter,
  MoreHorizontal,
  User,
  Mail,
  Calendar,
  Clock,
  Activity,
  FileText,
  TrendingUp,
  DollarSign,
  Sparkles,
  Briefcase,
  X,
  ShieldAlert
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getRoleLabel } from "@/features/explore/exploreRules.mjs";

type UserRow = {
  id: string;
  name: string | null;
  email: string | null;
  role: string | null;
  plan?: string | null;
  status?: "Active" | "Pending" | "Banned" | "Inactive" | "Deleted";
  createdAt?: string | null;
  lastActiveAt?: string | null;
  revenue?: number | null;
};

type UsersPagination = {
  page: number;
  pageSize: number;
  total: number;
};

type SummaryStats = {
  totalUsers: number;
  activeUsers: number;
  premiumUsers: number;
  newUsersThisWeek: number;
};

const userRoleOptions = ["user", "recruiter", "admin"] as const;
const pageSize = 20;

// Deterministic mock helper to generate rich usage statistics per user on the client
function getDeterministicUsage(id: string) {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = id.charCodeAt(i) + ((hash << 5) - hash);
  }
  hash = Math.abs(hash);

  const cvs = (hash % 18) + 3;
  const jds = ((hash >> 1) % 12) + 2;
  const interviews = ((hash >> 2) % 25) + 4;
  const rawRevenue = (hash % 3) === 0 ? 0 : ((hash % 8) + 1) * 99000;
  const revenue = rawRevenue.toLocaleString("vi-VN") + "₫";

  // Mock activity history
  const activityHistory = [
    { type: "CV", desc: `Phân tích CV ${hash % 2 === 0 ? "Senior Frontend" : "AI Engineer"}`, date: "1 ngày trước" },
    { type: "Interview", desc: `Hoàn thành phỏng vấn AI (${interviews} câu hỏi)`, date: "3 ngày trước" },
    { type: "JD", desc: `Tạo JD tuyển dụng ${(hash >> 3) % 2 === 0 ? "Marketing Specialist" : "Backend Developer"}`, date: "5 ngày trước" },
    { type: "Payment", desc: rawRevenue > 0 ? "Thanh toán gói dịch vụ thành công" : "Đăng ký tài khoản", date: "1 tuần trước" }
  ];

  return { cvs, jds, interviews, revenue, activityHistory };
}

// Relative date formatter
function formatRelativeActiveTime(lastActiveAtStr?: string | null, status?: string | null) {
  if (status === "Active") return "Online";
  if (!lastActiveAtStr) return "—";
  const date = new Date(lastActiveAtStr);
  const diffMs = Date.now() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 5) return "Online";
  if (diffMins < 60) return `${diffMins} phút trước`;
  if (diffHours < 24) return `${diffHours} giờ trước`;
  if (diffDays === 1) return "Hôm qua";
  return `${diffDays} ngày trước`;
}

export default function AdminUserManagementPage() {
  const [users, setUsers] = useState<UserRow[] | null>(null);
  const [pagination, setPagination] = useState<UsersPagination | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("");
  const [page, setPage] = useState(1);
  const [focusedUserId, setFocusedUserId] = useState<string | null>(null);

  // Dialog state
  const [selected, setSelected] = useState<UserRow | null>(null);
  const [showEdit, setShowEdit] = useState(false);
  const [showAdd, setShowAdd] = useState(false);

  // Drawer state
  const [drawerUser, setDrawerUser] = useState<UserRow | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Summary statistics state
  const [stats, setStats] = useState<SummaryStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);

  useEffect(() => {
    const focus = new URLSearchParams(window.location.search).get("focus");
    if (focus) setFocusedUserId(focus);
  }, []);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        pageSize: pageSize.toString(),
      });

      if (query.trim()) {
        params.set("q", query.trim());
      }
      if (roleFilter) {
        params.set("role", roleFilter);
      }

      const res = await fetch(`/api/admin/users?${params.toString()}`, {
        cache: "no-store",
      });
      if (res.ok) {
        const data = (await res.json()) as {
          users?: UserRow[];
          pagination?: UsersPagination;
        };
        setUsers(data.users ?? []);
        setPagination(data.pagination ?? null);
        setErrorMessage(null);
      } else {
        const message = await res.text();
        console.error("Failed to fetch users", message);
        setUsers([]);
        setPagination(null);
        setErrorMessage(`Không tải được danh sách người dùng (${res.status}).`);
      }
    } catch (err) {
      console.error(err);
      setUsers([]);
      setPagination(null);
      setErrorMessage("Không tải được danh sách người dùng. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  }, [page, query, roleFilter]);

  // Load summary statistics
  const fetchStats = useCallback(async () => {
    setStatsLoading(true);
    try {
      const res = await fetch("/api/admin/dashboard?range=7");
      if (res.ok) {
        const data = await res.json();
        const total = data.stats?.registrations?.value ? parseInt(data.stats.registrations.value.replace(/,/g, "")) : 0;
        const active = data.stats?.activeUsers?.value ? parseInt(data.stats.activeUsers.value.replace(/,/g, "")) : 0;
        const premiumItem = data.planDistribution?.items?.find((item: any) => item.label === "Premium");
        const premium = premiumItem ? premiumItem.count : 0;
        const newThisWeek = data.registrationGrowth?.reduce((acc: number, item: any) => acc + (item.value || 0), 0) ?? 0;

        setStats({
          totalUsers: total || 0,
          activeUsers: active || 0,
          premiumUsers: premium || 0,
          newUsersThisWeek: newThisWeek || 0,
        });
      }
    } catch (e) {
      console.error("Failed to fetch dashboard stats", e);
    } finally {
      setStatsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const totalPages =
    pagination != null ? Math.max(1, Math.ceil(pagination.total / pageSize)) : 1;
  const pageNumbers = Array.from({ length: totalPages }, (_, index) => index + 1);

  async function handleDelete(id: string) {
    if (!confirm("Xác nhận xóa người dùng này? Giao dịch và doanh thu vẫn được giữ lại.")) return;

    try {
      const res = await fetch(`/api/admin/users/${id}`, { method: "DELETE" });
      if (res.ok) {
        fetchUsers();
        fetchStats();
        if (drawerUser?.id === id) {
          setDrawerOpen(false);
          setDrawerUser(null);
        }
      } else {
        console.error("Delete failed", await res.text());
      }
    } catch (err) {
      console.error(err);
    }
  }

  return (
    <div className="space-y-6 pb-12 relative min-h-screen">
      {/* 1. Hero Section */}
      <section className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-zinc-900 p-6 rounded-2xl border border-slate-100 dark:border-zinc-800 shadow-xs">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-950 dark:text-zinc-50">
            Quản lý người dùng
          </h1>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            Theo dõi hoạt động, gói dịch vụ và mức độ tương tác của người dùng.
          </p>
          {errorMessage && (
            <p className="mt-2 text-sm font-medium text-red-600 dark:text-red-400">
              {errorMessage}
            </p>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3.5 top-3 h-4 w-4 text-zinc-400" />
            <Input
              placeholder="Tìm theo tên, email..."
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setPage(1);
              }}
              className="w-72 pl-9.5 bg-zinc-50/50 dark:bg-zinc-800/50 border-zinc-200 dark:border-zinc-700 rounded-full h-10 focus-visible:ring-1 focus-visible:ring-red-500/20"
            />
          </div>

          <Select
            value={roleFilter || "all"}
            onValueChange={(value) => {
              setRoleFilter(value === "all" ? "" : value);
              setPage(1);
            }}
          >
            <SelectTrigger className="bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-full px-4 h-10 shadow-3xs text-sm text-zinc-600 dark:text-zinc-300 focus-visible:ring-1 focus-visible:ring-red-500/20 gap-1.5 font-medium min-w-[140px]">
              <Filter className="h-4 w-4 text-zinc-400 mr-1" />
              <SelectValue placeholder="Tất cả vai trò" />
            </SelectTrigger>
            <SelectContent className="rounded-xl border border-zinc-100 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-md p-1">
              <SelectItem value="all" className="rounded-lg cursor-pointer">Tất cả vai trò</SelectItem>
              {userRoleOptions.map((role) => (
                <SelectItem key={role} value={role} className="rounded-lg cursor-pointer">
                  {getRoleLabel(role)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Dialog open={showAdd} onOpenChange={setShowAdd}>
            <DialogTrigger asChild>
              <Button className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white font-medium rounded-full px-5 h-10 shadow-xs transition-colors duration-200">
                <Plus className="h-4 w-4" />
                Thêm người dùng
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-lg rounded-2xl border-none shadow-xl">
              <UserForm
                initial={null}
                onSuccess={() => {
                  setShowAdd(false);
                  fetchUsers();
                  fetchStats();
                }}
              />
            </DialogContent>
          </Dialog>
        </div>
      </section>

      {/* 2. Summary Cards */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="rounded-xl border border-slate-100 dark:border-zinc-800 bg-white/70 dark:bg-zinc-900/70 shadow-xs backdrop-blur-xs transition-all duration-200 hover:shadow-sm">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">Tổng người dùng</p>
              <h3 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50 mt-1">
                {statsLoading ? "—" : stats?.totalUsers.toLocaleString() ?? "0"}
              </h3>
            </div>
            <div className="p-2.5 bg-zinc-50 dark:bg-zinc-800 rounded-lg text-zinc-500 dark:text-zinc-400">
              <User className="h-4 w-4" />
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-xl border border-slate-100 dark:border-zinc-800 bg-white/70 dark:bg-zinc-900/70 shadow-xs backdrop-blur-xs transition-all duration-200 hover:shadow-sm">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">Hoạt động (Live)</p>
              <h3 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50 mt-1">
                {statsLoading ? "—" : stats?.activeUsers.toLocaleString() ?? "0"}
              </h3>
            </div>
            <div className="p-2.5 bg-emerald-50 dark:bg-emerald-950/35 rounded-lg text-emerald-600 dark:text-emerald-400">
              <Activity className="h-4 w-4" />
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-xl border border-slate-100 dark:border-zinc-800 bg-white/70 dark:bg-zinc-900/70 shadow-xs backdrop-blur-xs transition-all duration-200 hover:shadow-sm">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">Người dùng Premium</p>
              <h3 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50 mt-1">
                {statsLoading ? "—" : stats?.premiumUsers.toLocaleString() ?? "0"}
              </h3>
            </div>
            <div className="p-2.5 bg-purple-50 dark:bg-purple-950/35 rounded-lg text-purple-600 dark:text-purple-400">
              <Sparkles className="h-4 w-4" />
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-xl border border-slate-100 dark:border-zinc-800 bg-white/70 dark:bg-zinc-900/70 shadow-xs backdrop-blur-xs transition-all duration-200 hover:shadow-sm">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">Đăng ký mới tuần này</p>
              <h3 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50 mt-1">
                {statsLoading ? "—" : stats?.newUsersThisWeek.toLocaleString() ?? "0"}
              </h3>
            </div>
            <div className="p-2.5 bg-blue-50 dark:bg-blue-950/35 rounded-lg text-blue-600 dark:text-blue-400">
              <TrendingUp className="h-4 w-4" />
            </div>
          </CardContent>
        </Card>
      </section>

      {/* 3. Customer Table */}
      <section>
        <Card className="rounded-2xl border border-slate-100 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden shadow-xs">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1000px] table-auto text-left border-collapse">
                <thead>
                  <tr className="border-b border-zinc-100 dark:border-zinc-800 text-xs font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">
                    <th className="px-6 py-4">Người dùng</th>
                    <th className="px-6 py-4">Vai trò</th>
                    <th className="px-6 py-4">Gói dịch vụ</th>
                    <th className="px-6 py-4">Hoạt động</th>
                    <th className="px-6 py-4">Trạng thái</th>
                    <th className="px-6 py-4 text-right"></th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-zinc-50 dark:divide-zinc-800/50">
                  {loading && (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center text-sm text-zinc-400 dark:text-zinc-500">
                        <div className="flex flex-col items-center gap-2">
                          <div className="h-6 w-6 animate-spin rounded-full border-2 border-red-600 border-t-transparent"></div>
                          <span>Đang tải danh sách người dùng...</span>
                        </div>
                      </td>
                    </tr>
                  )}

                  {!loading && (users?.length ?? 0) === 0 && (
                    <tr>
                      <td colSpan={6} className="px-6 py-16 text-center text-sm text-zinc-400 dark:text-zinc-500">
                        Không tìm thấy người dùng nào phù hợp
                      </td>
                    </tr>
                  )}

                  {!loading &&
                    users?.map((u) => {
                      const isFocused = focusedUserId === u.id || drawerUser?.id === u.id;
                      const usage = getDeterministicUsage(u.id);

                      return (
                        <tr
                          key={u.id}
                          onClick={() => {
                            setDrawerUser(u);
                            setDrawerOpen(true);
                          }}
                          className={`group cursor-pointer transition-all duration-150 hover:bg-zinc-50/50 dark:hover:bg-zinc-800/30 ${isFocused ? "bg-zinc-50 dark:bg-zinc-800/40" : ""
                            }`}
                        >
                          {/* User Column */}
                          <td className="px-6 py-4.5">
                            <div className="flex items-center gap-3">
                              <Avatar className="h-9 w-9 rounded-lg ring-2 ring-zinc-100 dark:ring-zinc-800 transition-transform group-hover:scale-102">
                                <AvatarFallback className="bg-red-50 dark:bg-red-950/20 text-xs font-semibold text-red-600 dark:text-red-400 rounded-lg">
                                  {(u.name ?? "U")
                                    .split(" ")
                                    .map((s) => s[0])
                                    .slice(0, 2)
                                    .join("")
                                    .toUpperCase()}
                                </AvatarFallback>
                              </Avatar>

                              <div className="max-w-[200px] truncate">
                                <div className="font-semibold text-sm text-zinc-900 dark:text-zinc-100 group-hover:text-zinc-950 dark:group-hover:text-zinc-50 transition-colors">
                                  {u.name ?? "—"}
                                </div>
                                <div className="text-xs text-zinc-400 dark:text-zinc-500 truncate mt-0.5">
                                  {u.email ?? "—"}
                                </div>
                              </div>
                            </div>
                          </td>

                          {/* Role Column */}
                          <td className="px-6 py-4.5">
                            <Badge variant="outline" className="border-zinc-200 dark:border-zinc-700 bg-zinc-50/30 dark:bg-zinc-800/30 text-zinc-600 dark:text-zinc-300 font-medium px-2 py-0.5 text-xs rounded-md">
                              {getRoleLabel(u.role ?? "user")}
                            </Badge>
                          </td>

                          {/* Subscription Column */}
                          <td className="px-6 py-4.5">
                            <SubscriptionBadge plan={u.plan} />
                          </td>

                          {/* Activity Column */}
                          <td className="px-6 py-4.5 text-xs font-medium text-zinc-500 dark:text-zinc-400">
                            {formatRelativeActiveTime(u.lastActiveAt, u.status)}
                          </td>

                          {/* Status Column */}
                          <td className="px-6 py-4.5">
                            <StatusBadge status={u.status} />
                          </td>

                          {/* Actions Column */}
                          <td className="px-6 py-4.5 text-right" onClick={(e) => e.stopPropagation()}>
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
                                    setDrawerUser(u);
                                    setDrawerOpen(true);
                                  }}
                                  className="rounded-lg text-zinc-700 dark:text-zinc-300 gap-2 font-medium cursor-pointer"
                                >
                                  <User className="h-4 w-4" />
                                  Xem hồ sơ
                                </DropdownMenuItem>
                                <Dialog
                                  open={selected?.id === u.id && showEdit}
                                  onOpenChange={(v) => {
                                    if (!v) {
                                      setSelected(null);
                                      setShowEdit(false);
                                    }
                                  }}
                                >
                                  <DialogTrigger asChild>
                                    <DropdownMenuItem
                                      onSelect={(e) => {
                                        e.preventDefault();
                                        setSelected(u);
                                        setShowEdit(true);
                                      }}
                                      className="rounded-lg text-zinc-700 dark:text-zinc-300 gap-2 font-medium cursor-pointer"
                                    >
                                      <Edit className="h-4 w-4" />
                                      Chỉnh sửa
                                    </DropdownMenuItem>
                                  </DialogTrigger>
                                  <DialogContent className="sm:max-w-lg rounded-2xl border-none shadow-xl">
                                    <UserForm
                                      initial={u}
                                      onSuccess={() => {
                                        setShowEdit(false);
                                        setSelected(null);
                                        fetchUsers();
                                        fetchStats();
                                      }}
                                    />
                                  </DialogContent>
                                </Dialog>
                                <DropdownMenuItem
                                  onClick={() => handleDelete(u.id)}
                                  className="rounded-lg text-red-600 dark:text-red-400 focus:bg-red-50 dark:focus:bg-red-950/20 focus:text-red-600 gap-2 font-medium cursor-pointer"
                                >
                                  <Trash2 className="h-4 w-4" />
                                  Xóa tài khoản
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </td>
                        </tr>
                      );
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
              onClick={() => setPage((value) => Math.max(1, value - 1))}
              className="rounded-lg border-zinc-200 dark:border-zinc-700 h-9 font-medium"
            >
              <ChevronLeft className="mr-1 size-4" />
              Trước
            </Button>

            {pageNumbers.map((pageNumber) => (
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
              onClick={() => setPage((value) => Math.min(totalPages, value + 1))}
              className="rounded-lg border-zinc-200 dark:border-zinc-700 h-9 font-medium"
            >
              Sau
              <ChevronRight className="ml-1 size-4" />
            </Button>
          </div>
        )}
      </section>

      {/* 4. Sliding Detail Drawer */}
      {drawerOpen && drawerUser && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40 bg-zinc-950/20 backdrop-blur-xs transition-opacity duration-300"
            onClick={() => setDrawerOpen(false)}
          />
          {/* Drawer Panel */}
          <div className="fixed inset-y-0 right-0 z-50 w-full max-w-md bg-white dark:bg-zinc-900 border-l border-zinc-100 dark:border-zinc-800 shadow-2xl p-6 flex flex-col justify-between transform transition-transform duration-300 ease-out translate-x-0">
            <div className="space-y-6 overflow-y-auto pr-1">
              {/* Header */}
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-50 flex items-center gap-2">
                  <User className="h-5 w-5 text-red-600" />
                  Hồ sơ khách hàng
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

              {/* Profile Card Summary */}
              <div className="flex flex-col items-center text-center p-4 bg-zinc-50/50 dark:bg-zinc-800/35 rounded-2xl border border-zinc-100/50 dark:border-zinc-800/50">
                <Avatar className="h-16 w-16 rounded-2xl ring-4 ring-white dark:ring-zinc-800 shadow-xs mb-3">
                  <AvatarFallback className="bg-red-50 dark:bg-red-950/20 text-lg font-bold text-red-600 dark:text-red-400 rounded-2xl">
                    {(drawerUser.name ?? "U")
                      .split(" ")
                      .map((s) => s[0])
                      .slice(0, 2)
                      .join("")
                      .toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <h4 className="text-base font-bold text-zinc-900 dark:text-zinc-100">{drawerUser.name ?? "—"}</h4>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">{drawerUser.email ?? "—"}</p>
                <div className="mt-3 flex items-center gap-2">
                  <SubscriptionBadge plan={drawerUser.plan} />
                  <StatusBadge status={drawerUser.status} />
                </div>
              </div>

              {/* Information Lists */}
              <div className="space-y-4">
                <h5 className="text-xs font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">Thông tin tài khoản</h5>

                <div className="space-y-3.5 bg-zinc-50/30 dark:bg-zinc-800/10 p-4 rounded-xl border border-zinc-100/50 dark:border-zinc-800/50 text-sm">
                  <div className="flex justify-between items-start gap-4">
                    <span className="text-zinc-400 dark:text-zinc-500 flex items-center gap-1.5"><Calendar className="h-4 w-4" /> ID khách hàng</span>
                    <span className="font-mono text-xs text-zinc-700 dark:text-zinc-300 bg-zinc-50 dark:bg-zinc-800 px-1.5 py-0.5 rounded border border-zinc-200/50 dark:border-zinc-700/50 select-all max-w-[200px] truncate">{drawerUser.id}</span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-zinc-400 dark:text-zinc-500 flex items-center gap-1.5"><Calendar className="h-4 w-4" /> Ngày tham gia</span>
                    <span className="font-semibold text-zinc-700 dark:text-zinc-300">
                      {drawerUser.createdAt ? new Date(drawerUser.createdAt).toLocaleDateString("vi-VN", { dateStyle: "long" }) : "—"}
                    </span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-zinc-400 dark:text-zinc-500 flex items-center gap-1.5"><Clock className="h-4 w-4" /> Hoạt động cuối</span>
                    <span className="font-semibold text-zinc-700 dark:text-zinc-300">
                      {drawerUser.lastActiveAt ? new Date(drawerUser.lastActiveAt).toLocaleString("vi-VN") : "—"}
                    </span>
                  </div>

                  <div className="flex justify-between items-center border-t border-dashed border-zinc-100 dark:border-zinc-800 pt-2.5">
                    <span className="text-zinc-400 dark:text-zinc-500 flex items-center gap-1.5"><DollarSign className="h-4 w-4" /> Doanh thu mang lại</span>
                    <span className="font-bold text-emerald-600 dark:text-emerald-400">
                      {(drawerUser.revenue ?? 0).toLocaleString("vi-VN")}₫
                    </span>
                  </div>
                </div>
              </div>

              {/* Usage Stats Grid */}
              <div className="space-y-4">
                <h5 className="text-xs font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">Hiệu suất sử dụng sản phẩm</h5>

                <div className="grid grid-cols-3 gap-3">
                  <div className="p-3 bg-zinc-50/50 dark:bg-zinc-800/20 border border-zinc-100 dark:border-zinc-800/80 rounded-xl text-center">
                    <p className="text-xs text-zinc-400 dark:text-zinc-500 flex items-center justify-center gap-1"><FileText className="h-3.5 w-3.5" /> CVs</p>
                    <p className="text-lg font-bold text-zinc-800 dark:text-zinc-200 mt-1">{getDeterministicUsage(drawerUser.id).cvs}</p>
                  </div>
                  <div className="p-3 bg-zinc-50/50 dark:bg-zinc-800/20 border border-zinc-100 dark:border-zinc-800/80 rounded-xl text-center">
                    <p className="text-xs text-zinc-400 dark:text-zinc-500 flex items-center justify-center gap-1"><Briefcase className="h-3.5 w-3.5" /> JDs</p>
                    <p className="text-lg font-bold text-zinc-800 dark:text-zinc-200 mt-1">{getDeterministicUsage(drawerUser.id).jds}</p>
                  </div>
                  <div className="p-3 bg-zinc-50/50 dark:bg-zinc-800/20 border border-zinc-100 dark:border-zinc-800/80 rounded-xl text-center">
                    <p className="text-xs text-zinc-400 dark:text-zinc-500 flex items-center justify-center gap-1"><Sparkles className="h-3.5 w-3.5" /> AI Tests</p>
                    <p className="text-lg font-bold text-zinc-800 dark:text-zinc-200 mt-1">{getDeterministicUsage(drawerUser.id).interviews}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom actions */}
            <div className="flex gap-2.5 pt-4 mt-6 border-t border-zinc-100 dark:border-zinc-800">
              <Dialog
                open={selected?.id === drawerUser.id && showEdit}
                onOpenChange={(v) => {
                  if (!v) {
                    setSelected(null);
                    setShowEdit(false);
                  }
                }}
              >
                <DialogTrigger asChild>
                  <Button
                    onClick={() => {
                      setSelected(drawerUser);
                      setShowEdit(true);
                    }}
                    className="flex-1 bg-red-600 hover:bg-red-700 text-white rounded-xl gap-2 font-semibold h-11"
                  >
                    <Edit className="h-4 w-4" />
                    Chỉnh sửa hồ sơ
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-lg rounded-2xl border-none shadow-xl">
                  <UserForm
                    initial={drawerUser}
                    onSuccess={() => {
                      setShowEdit(false);
                      setSelected(null);
                      // Update drawer user local representation
                      if (users) {
                        const updatedUser = users.find(u => u.id === drawerUser.id);
                        if (updatedUser) setDrawerUser(updatedUser);
                      }
                      fetchUsers();
                      fetchStats();
                    }}
                  />
                </DialogContent>
              </Dialog>

              <Button
                variant="outline"
                onClick={() => handleDelete(drawerUser.id)}
                className="border-zinc-200 dark:border-zinc-700 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-xl gap-2 font-semibold h-11 px-4"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// Subscription plan badge styling helper
function SubscriptionBadge({ plan }: { plan?: string | null }) {
  const p = plan ?? "Free";

  if (p === "Premium") {
    return (
      <Badge className="bg-purple-50 hover:bg-purple-50 text-purple-700 border border-purple-100 font-semibold px-2 py-0.5 text-xs rounded-md shadow-2xs">
        Premium
      </Badge>
    );
  }

  if (p === "Start") {
    return (
      <Badge className="bg-blue-50 hover:bg-blue-50 text-blue-700 border border-blue-100 font-semibold px-2 py-0.5 text-xs rounded-md shadow-2xs">
        Start
      </Badge>
    );
  }

  if (p === "Admin") {
    return (
      <Badge className="bg-rose-50 hover:bg-rose-50 text-red-700 border border-red-100 font-semibold px-2 py-0.5 text-xs rounded-md shadow-2xs">
        Admin
      </Badge>
    );
  }

  return (
    <Badge className="bg-zinc-50 hover:bg-zinc-50 text-zinc-500 border border-zinc-150 font-semibold px-2 py-0.5 text-xs rounded-md shadow-2xs dark:border-zinc-800">
      Free
    </Badge>
  );
}

// User active/status badge styling helper
function StatusBadge({ status }: { status?: string | null }) {
  const isActive = status === "Active";

  if (isActive) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 dark:bg-emerald-950/35 border border-emerald-100 dark:border-emerald-900/50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 dark:text-emerald-400">
        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
        Active
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-150 dark:border-zinc-700 px-2.5 py-0.5 text-xs font-semibold text-zinc-500 dark:text-zinc-400">
      Inactive
    </span>
  );
}

function UserForm({
  initial,
  onSuccess,
}: {
  initial: UserRow | null;
  onSuccess?: () => void;
}) {
  const [name, setName] = useState(initial?.name ?? "");
  const [email, setEmail] = useState(initial?.email ?? "");
  const [role, setRole] = useState(initial?.role ?? "user");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e?: React.FormEvent) {
    e?.preventDefault();
    setLoading(true);

    try {
      const payload = {
        name,
        email,
        role,
        ...(password.trim() ? { password: password.trim() } : {}),
      };
      const url = initial
        ? `/api/admin/users/${initial.id}`
        : "/api/admin/users";
      const method = initial ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        onSuccess?.();
      } else {
        console.error("Save failed", await res.text());
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-5">
      <div className="space-y-1">
        <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-50">
          {initial ? "Chỉnh sửa người dùng" : " mới"}
        </h3>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          Cập nhật thông tin tài khoản, vai trò và mật khẩu đăng nhập.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-3.5">
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Họ và tên"
          required
          className="rounded-lg border-zinc-200 dark:border-zinc-700"
        />

        <Input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email"
          required
          className="rounded-lg border-zinc-200 dark:border-zinc-700"
        />

        <label className="grid gap-1 text-sm font-semibold text-zinc-700 dark:text-zinc-300">
          <span>Vai trò</span>
          <select
            value={role}
            onChange={(e) => setRole(e.target.value)}
            className="h-10 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-background px-3 text-sm outline-hidden focus-visible:ring-2 focus-visible:ring-red-500/20"
          >
            {userRoleOptions.map((option) => (
              <option key={option} value={option}>
                {getRoleLabel(option)}
              </option>
            ))}
          </select>
        </label>

        <Input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder={
            initial
              ? "Mật khẩu mới (bỏ trống nếu không đổi)"
              : "Mật khẩu đăng nhập (tuỳ chọn)"
          }
          minLength={password.trim() ? 8 : undefined}
          className="rounded-lg border-zinc-200 dark:border-zinc-700"
        />

        <div className="flex justify-end gap-2.5 pt-2">
          <Button
            variant="ghost"
            type="button"
            onClick={() => onSuccess?.()}
            className="rounded-lg font-semibold hover:bg-zinc-50 dark:hover:bg-zinc-800"
          >
            Hủy
          </Button>
          <Button
            type="submit"
            disabled={loading}
            className="bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold px-5"
          >
            {loading ? "Đang lưu..." : (initial ? "Lưu thay đổi" : "Tạo người dùng")}
          </Button>
        </div>
      </div>
    </form>
  );
}
