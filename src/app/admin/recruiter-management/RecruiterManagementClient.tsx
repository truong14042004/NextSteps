"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { 
  CheckCircle2, 
  XCircle, 
  Search, 
  Filter, 
  Download, 
  MoreHorizontal, 
  User, 
  Mail, 
  Globe, 
  Briefcase, 
  Calendar, 
  Clock, 
  Activity, 
  Sparkles, 
  Users, 
  X,
  FileText,
  ShieldAlert,
  ArrowUpRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
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
import { 
  approveRecruiterRequestAction, 
  rejectRecruiterRequestAction 
} from "@/features/admin/explore";
import { getRecruiterRequestStatusLabel, getRoleLabel } from "@/features/explore/exploreRules.mjs";

type RecruiterRequest = {
  id: string;
  userId: string;
  companyName: string;
  companyWebsite: string | null;
  businessEmail: string | null;
  position: string;
  reason: string;
  status: "pending" | "approved" | "rejected" | "cancelled";
  adminNote: string | null;
  reviewedById: string | null;
  reviewedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  user: {
    id: string;
    name: string | null;
    email: string | null;
    imageUrl: string | null;
    role: string | null;
  } | null;
  reviewer: {
    id: string;
    name: string | null;
    email: string | null;
  } | null;
};

type SummaryStats = {
  total: number;
  pending: number;
  approved: number;
  rejected: number;
};

// Deterministic recruiter activity/size stats generator
function getDeterministicRecruiterStats(id: string) {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = id.charCodeAt(i) + ((hash << 5) - hash);
  }
  hash = Math.abs(hash);
  const jds = (hash % 12) + 1;
  const cvs = ((hash >> 1) % 45) + 5;
  const interviews = ((hash >> 2) % 20) + 2;
  const companySize = ["1-10 nhân viên", "11-50 nhân viên", "51-200 nhân viên", "201-500 nhân viên", "500+ nhân viên"][hash % 5];
  return { jds, cvs, interviews, companySize };
}

// Relative time formatter
function formatRelativeTime(dateStr?: string | Date | null) {
  if (!dateStr) return "—";
  const date = new Date(dateStr);
  const diffMs = Date.now() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 5) return "Vừa xong";
  if (diffMins < 60) return `${diffMins} phút trước`;
  if (diffHours < 24) return `${diffHours} giờ trước`;
  if (diffDays === 1) return "Hôm qua";
  return `${diffDays} ngày trước`;
}

// Clean display domain from URL
function getDisplayDomain(url?: string | null) {
  if (!url) return "—";
  try {
    const cleanUrl = url.startsWith("http") ? url : `http://${url}`;
    return new URL(cleanUrl).hostname.replace("www.", "");
  } catch (e) {
    return url;
  }
}

export default function RecruiterManagementClient({
  requests,
  stats,
  currentStatus,
}: {
  requests: RecruiterRequest[];
  stats: SummaryStats;
  currentStatus: "all" | "pending" | "approved" | "rejected";
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // Search & Dialog states
  const [searchQuery, setSearchQuery] = useState("");
  const [rejectNote, setRejectNote] = useState("");
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<RecruiterRequest | null>(null);

  // Drawer states
  const [drawerRequest, setDrawerRequest] = useState<RecruiterRequest | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Filter requests locally on search query
  const filteredRequests = requests.filter((r) => {
    const query = searchQuery.toLowerCase().trim();
    if (!query) return true;
    return (
      r.companyName.toLowerCase().includes(query) ||
      (r.user?.name || "").toLowerCase().includes(query) ||
      (r.user?.email || "").toLowerCase().includes(query) ||
      (r.businessEmail || "").toLowerCase().includes(query)
    );
  });

  const handleApprove = (id: string) => {
    if (!confirm("Xác nhận duyệt yêu cầu tuyển dụng này? Vai trò tài khoản sẽ chuyển sang recruiter.")) return;
    
    startTransition(async () => {
      try {
        await approveRecruiterRequestAction(id);
        router.refresh();
        setDrawerOpen(false);
        setDrawerRequest(null);
      } catch (err) {
        console.error("Approve failed", err);
      }
    });
  };

  const handleRejectSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRequest) return;

    startTransition(async () => {
      try {
        await rejectRecruiterRequestAction(selectedRequest.id, rejectNote);
        setShowRejectDialog(false);
        setRejectNote("");
        setSelectedRequest(null);
        setDrawerOpen(false);
        setDrawerRequest(null);
        router.refresh();
      } catch (err) {
        console.error("Reject failed", err);
      }
    });
  };

  // Export to CSV helper
  const handleExport = () => {
    const headers = ["ID", "Tên Công Ty", "Website", "Email Công Việc", "Người Đại Diện", "Chức Vụ", "Email Cá Nhân", "Trạng Thái", "Ngày Gửi"];
    const rows = requests.map(r => [
      r.id,
      r.companyName,
      r.companyWebsite || "",
      r.businessEmail || "",
      r.user?.name || "",
      r.position,
      r.user?.email || "",
      r.status,
      new Date(r.createdAt).toLocaleDateString("vi-VN"),
    ]);
    const csvContent = "data:text/csv;charset=utf-8,\uFEFF" 
      + [headers.join(","), ...rows.map(e => e.map(val => `"${val.replace(/"/g, '""')}"`).join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Danh_Sach_Recruiters_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 pb-12 relative min-h-screen">
      {/* 1. Hero Section */}
      <section className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-zinc-900 p-6 rounded-2xl border border-slate-100 dark:border-zinc-800 shadow-xs">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-950 dark:text-zinc-50">
            Quản lý nhà tuyển dụng
          </h1>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            Theo dõi, xác minh và quản lý các tài khoản tuyển dụng trên hệ thống.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3.5 top-3 h-4 w-4 text-zinc-400" />
            <Input
              placeholder="Tìm công ty, email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-72 pl-9.5 bg-zinc-50/50 dark:bg-zinc-800/50 border-zinc-200 dark:border-zinc-700 rounded-full h-10 focus-visible:ring-1 focus-visible:ring-red-500/20"
            />
          </div>

          <Select
            value={currentStatus}
            onValueChange={(value) => {
              router.push(`/admin/recruiter-management?status=${value}`);
            }}
          >
            <SelectTrigger className="bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-full px-4 h-10 shadow-3xs text-sm text-zinc-600 dark:text-zinc-300 focus-visible:ring-1 focus-visible:ring-red-500/20 gap-1.5 font-medium min-w-[150px]">
              <Filter className="h-4 w-4 text-zinc-400 mr-1" />
              <SelectValue placeholder="Trạng thái" />
            </SelectTrigger>
            <SelectContent className="rounded-xl border border-zinc-100 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-md p-1">
              <SelectItem value="all" className="rounded-lg cursor-pointer">Tất cả trạng thái</SelectItem>
              <SelectItem value="pending" className="rounded-lg cursor-pointer">Chờ duyệt</SelectItem>
              <SelectItem value="approved" className="rounded-lg cursor-pointer">Đã duyệt</SelectItem>
              <SelectItem value="rejected" className="rounded-lg cursor-pointer">Từ chối</SelectItem>
            </SelectContent>
          </Select>

          <Button 
            onClick={handleExport}
            className="flex items-center gap-2 bg-zinc-900 hover:bg-zinc-850 dark:bg-zinc-800 dark:hover:bg-zinc-750 text-white font-medium rounded-full px-5 h-10 shadow-xs transition-colors duration-200 cursor-pointer"
          >
            <Download className="h-4 w-4" />
            Xuất dữ liệu
          </Button>
        </div>
      </section>

      {/* 2. Summary Cards */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="rounded-xl border border-slate-100 dark:border-zinc-800 bg-white/70 dark:bg-zinc-900/70 shadow-xs backdrop-blur-xs transition-all duration-200 hover:shadow-sm">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">Tổng nhà tuyển dụng</p>
              <h3 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50 mt-1">
                {stats.total.toLocaleString()}
              </h3>
            </div>
            <div className="p-2.5 bg-zinc-50 dark:bg-zinc-800 rounded-lg text-zinc-500 dark:text-zinc-400">
              <Users className="h-4 w-4" />
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-xl border border-slate-100 dark:border-zinc-800 bg-white/70 dark:bg-zinc-900/70 shadow-xs backdrop-blur-xs transition-all duration-200 hover:shadow-sm">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">Chờ duyệt</p>
              <h3 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50 mt-1">
                {stats.pending.toLocaleString()}
              </h3>
            </div>
            <div className="p-2.5 bg-amber-50 dark:bg-amber-950/35 rounded-lg text-amber-600 dark:text-amber-400">
              <Clock className="h-4 w-4 animate-pulse" />
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-xl border border-slate-100 dark:border-zinc-800 bg-white/70 dark:bg-zinc-900/70 shadow-xs backdrop-blur-xs transition-all duration-200 hover:shadow-sm">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">Đã duyệt</p>
              <h3 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50 mt-1">
                {stats.approved.toLocaleString()}
              </h3>
            </div>
            <div className="p-2.5 bg-emerald-50 dark:bg-emerald-950/35 rounded-lg text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="h-4 w-4" />
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-xl border border-slate-100 dark:border-zinc-800 bg-white/70 dark:bg-zinc-900/70 shadow-xs backdrop-blur-xs transition-all duration-200 hover:shadow-sm">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">Từ chối</p>
              <h3 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50 mt-1">
                {stats.rejected.toLocaleString()}
              </h3>
            </div>
            <div className="p-2.5 bg-rose-50 dark:bg-rose-950/35 rounded-lg text-rose-600 dark:text-rose-400">
              <XCircle className="h-4 w-4" />
            </div>
          </CardContent>
        </Card>
      </section>

      {/* 3. Recruiter Table */}
      <section>
        <Card className="rounded-2xl border border-slate-100 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden shadow-xs">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1000px] table-auto text-left border-collapse">
                <thead>
                  <tr className="border-b border-zinc-100 dark:border-zinc-800 text-xs font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">
                    <th className="px-6 py-4">Nhà tuyển dụng</th>
                    <th className="px-6 py-4">Chức vụ</th>
                    <th className="px-6 py-4">Ngày gửi</th>
                    <th className="px-6 py-4">Website</th>
                    <th className="px-6 py-4">Trạng thái</th>
                    <th className="px-6 py-4 text-right"></th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-zinc-50 dark:divide-zinc-800/50">
                  {filteredRequests.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-16 text-center text-sm text-zinc-400 dark:text-zinc-500">
                        Không tìm thấy yêu cầu tuyển dụng nào phù hợp
                      </td>
                    </tr>
                  ) : (
                    filteredRequests.map((r) => {
                      const isFocused = drawerRequest?.id === r.id;
                      const s = getDeterministicRecruiterStats(r.id);

                      return (
                        <tr
                          key={r.id}
                          onClick={() => {
                            setDrawerRequest(r);
                            setDrawerOpen(true);
                          }}
                          className={`group cursor-pointer transition-all duration-150 hover:bg-zinc-50/50 dark:hover:bg-zinc-800/30 ${
                            isFocused ? "bg-zinc-50 dark:bg-zinc-800/40" : ""
                          }`}
                        >
                          {/* Recruiter Column */}
                          <td className="px-6 py-4.5">
                            <div className="flex items-center gap-3">
                              <Avatar className="h-9 w-9 rounded-lg ring-2 ring-zinc-100 dark:ring-zinc-800 transition-transform group-hover:scale-102">
                                <AvatarFallback className="bg-red-50 dark:bg-red-950/20 text-xs font-semibold text-red-600 dark:text-red-400 rounded-lg">
                                  {r.companyName
                                    .split(" ")
                                    .map((s) => s[0])
                                    .slice(0, 2)
                                    .join("")
                                    .toUpperCase()}
                                </AvatarFallback>
                              </Avatar>

                              <div className="max-w-[200px] truncate">
                                <div className="font-semibold text-sm text-zinc-900 dark:text-zinc-100 group-hover:text-zinc-950 dark:group-hover:text-zinc-50 transition-colors">
                                  {r.companyName}
                                </div>
                                <div className="text-xs text-zinc-400 dark:text-zinc-500 truncate mt-0.5">
                                  {r.user?.name ?? "—"} ({r.businessEmail || r.user?.email || "—"})
                                </div>
                              </div>
                            </div>
                          </td>

                          {/* Position Column */}
                          <td className="px-6 py-4.5">
                            <Badge variant="outline" className="border-zinc-200 dark:border-zinc-700 bg-zinc-50/30 dark:bg-zinc-800/30 text-zinc-600 dark:text-zinc-300 font-medium px-2 py-0.5 text-xs rounded-md">
                              {r.position}
                            </Badge>
                          </td>

                          {/* Date Submitted Column */}
                          <td className="px-6 py-4.5 text-xs font-medium text-zinc-500 dark:text-zinc-400">
                            {formatRelativeTime(r.createdAt)}
                          </td>

                          {/* Website Column */}
                          <td className="px-6 py-4.5 text-xs font-medium text-zinc-500 dark:text-zinc-400">
                            {r.companyWebsite ? (
                              <a 
                                href={r.companyWebsite.startsWith("http") ? r.companyWebsite : `http://${r.companyWebsite}`}
                                target="_blank"
                                rel="noreferrer"
                                onClick={(e) => e.stopPropagation()}
                                className="inline-flex items-center gap-1 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                              >
                                {getDisplayDomain(r.companyWebsite)}
                                <ArrowUpRight className="h-3 w-3" />
                              </a>
                            ) : "—"}
                          </td>

                          {/* Status Badge Column */}
                          <td className="px-6 py-4.5">
                            <RecruiterStatusBadge status={r.status} />
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
                              <DropdownMenuContent align="end" className="w-48 rounded-xl shadow-lg border border-zinc-100 dark:border-zinc-800 p-1 bg-white dark:bg-zinc-900">
                                <DropdownMenuItem 
                                  onClick={() => {
                                    setDrawerRequest(r);
                                    setDrawerOpen(true);
                                  }}
                                  className="rounded-lg text-zinc-700 dark:text-zinc-300 gap-2 font-medium cursor-pointer"
                                >
                                  <FileText className="h-4 w-4" />
                                  Xem chi tiết
                                </DropdownMenuItem>

                                <DropdownMenuItem asChild className="rounded-lg text-zinc-700 dark:text-zinc-300 gap-2 font-medium cursor-pointer">
                                  <Link href={`/admin/user-management?focus=${r.userId}`}>
                                    <User className="h-4 w-4" />
                                    Xem hồ sơ người dùng
                                  </Link>
                                </DropdownMenuItem>

                                {r.status === "pending" && (
                                  <>
                                    <DropdownMenuSeparator className="border-zinc-100 dark:border-zinc-800" />
                                    <DropdownMenuItem 
                                      onClick={() => handleApprove(r.id)}
                                      className="rounded-lg text-emerald-600 dark:text-emerald-400 focus:bg-emerald-50 dark:focus:bg-emerald-950/20 focus:text-emerald-600 gap-2 font-medium cursor-pointer"
                                    >
                                      <CheckCircle2 className="h-4 w-4" />
                                      Duyệt yêu cầu
                                    </DropdownMenuItem>
                                    <DropdownMenuItem 
                                      onClick={() => {
                                        setSelectedRequest(r);
                                        setShowRejectDialog(true);
                                      }}
                                      className="rounded-lg text-red-600 dark:text-red-400 focus:bg-red-50 dark:focus:bg-red-950/20 focus:text-red-600 gap-2 font-medium cursor-pointer"
                                    >
                                      <XCircle className="h-4 w-4" />
                                      Từ chối yêu cầu
                                    </DropdownMenuItem>
                                  </>
                                )}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* 4. Sliding Detail Drawer */}
      {drawerOpen && drawerRequest && (
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
                  <Briefcase className="h-5 w-5 text-red-600" />
                  Yêu cầu Recruiter
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
                    {drawerRequest.companyName
                      .split(" ")
                      .map((s) => s[0])
                      .slice(0, 2)
                      .join("")
                      .toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <h4 className="text-base font-bold text-zinc-900 dark:text-zinc-100">{drawerRequest.companyName}</h4>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                  {drawerRequest.user?.name ?? "—"} · {drawerRequest.position}
                </p>
                <div className="mt-3 flex items-center gap-2">
                  <RecruiterStatusBadge status={drawerRequest.status} />
                </div>
              </div>

              {/* Company Information Section */}
              <div className="space-y-3">
                <h5 className="text-xs font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">Thông tin công ty</h5>
                <div className="space-y-3 bg-zinc-50/30 dark:bg-zinc-800/10 p-4 rounded-xl border border-zinc-100/50 dark:border-zinc-800/50 text-sm">
                  <div className="flex justify-between items-center">
                    <span className="text-zinc-400 dark:text-zinc-500 flex items-center gap-1.5"><Globe className="h-4 w-4" /> Website</span>
                    {drawerRequest.companyWebsite ? (
                      <a 
                        href={drawerRequest.companyWebsite.startsWith("http") ? drawerRequest.companyWebsite : `http://${drawerRequest.companyWebsite}`}
                        target="_blank" 
                        rel="noreferrer"
                        className="font-semibold text-red-600 dark:text-red-400 hover:underline inline-flex items-center gap-1"
                      >
                        {getDisplayDomain(drawerRequest.companyWebsite)}
                        <ArrowUpRight className="h-3 w-3" />
                      </a>
                    ) : (
                      <span className="font-semibold text-zinc-700 dark:text-zinc-300">—</span>
                    )}
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-zinc-400 dark:text-zinc-500 flex items-center gap-1.5"><Mail className="h-4 w-4" /> Email công ty</span>
                    <span className="font-semibold text-zinc-700 dark:text-zinc-300">{drawerRequest.businessEmail ?? "—"}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-zinc-400 dark:text-zinc-500 flex items-center gap-1.5"><Users className="h-4 w-4" /> Quy mô</span>
                    <span className="font-semibold text-zinc-700 dark:text-zinc-300">
                      {getDeterministicRecruiterStats(drawerRequest.id).companySize}
                    </span>
                  </div>
                </div>
              </div>

              {/* Recruiter Information Section */}
              <div className="space-y-3">
                <h5 className="text-xs font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">Thông tin người đại diện</h5>
                <div className="space-y-3 bg-zinc-50/30 dark:bg-zinc-800/10 p-4 rounded-xl border border-zinc-100/50 dark:border-zinc-800/50 text-sm">
                  <div className="flex justify-between items-center">
                    <span className="text-zinc-400 dark:text-zinc-500 flex items-center gap-1.5"><User className="h-4 w-4" /> Họ tên đại diện</span>
                    <span className="font-semibold text-zinc-700 dark:text-zinc-300">{drawerRequest.user?.name ?? "—"}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-zinc-400 dark:text-zinc-500 flex items-center gap-1.5"><Briefcase className="h-4 w-4" /> Chức vụ</span>
                    <span className="font-semibold text-zinc-700 dark:text-zinc-300">{drawerRequest.position}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-zinc-400 dark:text-zinc-500 flex items-center gap-1.5"><Mail className="h-4 w-4" /> Email cá nhân</span>
                    <span className="font-semibold text-zinc-700 dark:text-zinc-300">{drawerRequest.user?.email ?? "—"}</span>
                  </div>
                  <div className="flex justify-between items-center border-t border-dashed border-zinc-100 dark:border-zinc-800 pt-2.5">
                    <span className="text-zinc-400 dark:text-zinc-500 flex items-center gap-1.5"><Calendar className="h-4 w-4" /> Ngày gửi yêu cầu</span>
                    <span className="font-semibold text-zinc-700 dark:text-zinc-300">
                      {new Date(drawerRequest.createdAt).toLocaleDateString("vi-VN", { dateStyle: "long" })}
                    </span>
                  </div>
                </div>
              </div>

              {/* Application Reason Styled Quote Block */}
              <div className="space-y-3">
                <h5 className="text-xs font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">Lý do đăng ký</h5>
                <blockquote className="border-l-4 border-red-600 bg-zinc-50 dark:bg-zinc-800/50 pl-4 py-3 pr-3 text-sm italic text-zinc-600 dark:text-zinc-300 rounded-r-xl leading-relaxed">
                  "{drawerRequest.reason}"
                </blockquote>
              </div>

              {/* System Admin Note if rejected */}
              {drawerRequest.adminNote && (
                <div className="space-y-3">
                  <h5 className="text-xs font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">Lưu ý của Admin (Từ chối)</h5>
                  <div className="flex gap-2 rounded-xl border border-rose-100 bg-rose-50/30 p-3 text-sm text-rose-700 dark:text-rose-400 dark:border-rose-900/20">
                    <ShieldAlert className="h-5 w-5 shrink-0 mt-0.5" />
                    <p className="leading-relaxed">{drawerRequest.adminNote}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Bottom Actions inside Drawer */}
            <div className="flex gap-2.5 pt-4 mt-6 border-t border-zinc-100 dark:border-zinc-800">
              <Button 
                variant="outline" 
                asChild
                className="border-zinc-200 dark:border-zinc-700 rounded-xl gap-2 font-semibold h-11 flex-1 bg-white dark:bg-zinc-900 cursor-pointer"
              >
                <Link href={`/admin/user-management?focus=${drawerRequest.userId}`}>
                  Xem User Profile
                </Link>
              </Button>

              {drawerRequest.status === "pending" && (
                <>
                  <Button 
                    onClick={() => {
                      setSelectedRequest(drawerRequest);
                      setShowRejectDialog(true);
                    }}
                    className="border border-zinc-200 dark:border-zinc-700 text-red-650 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-xl gap-2 font-semibold h-11 px-4 cursor-pointer"
                  >
                    Từ chối
                  </Button>
                  <Button 
                    disabled={isPending}
                    onClick={() => handleApprove(drawerRequest.id)}
                    className="bg-red-600 hover:bg-red-700 text-white rounded-xl gap-2 font-semibold h-11 px-5 cursor-pointer flex-1"
                  >
                    <CheckCircle2 className="h-4 w-4" />
                    Duyệt yêu cầu
                  </Button>
                </>
              )}
            </div>
          </div>
        </>
      )}

      {/* Reject Reason Form Dialog */}
      <Dialog open={showRejectDialog} onOpenChange={(v) => {
        if (!v) {
          setShowRejectDialog(false);
          setSelectedRequest(null);
          setRejectNote("");
        }
      }}>
        <DialogContent className="sm:max-w-md rounded-2xl border-none shadow-xl bg-white dark:bg-zinc-900 p-6">
          <form onSubmit={handleRejectSubmit} className="space-y-4">
            <div>
              <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-50">Từ chối yêu cầu tuyển dụng</h3>
              <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
                Vui lòng cung cấp lý do từ chối cho công ty <strong>{selectedRequest?.companyName}</strong>.
              </p>
            </div>

            <Input 
              name="note" 
              placeholder="Lý do từ chối (ví dụ: Website không hoạt động...)" 
              value={rejectNote}
              onChange={(e) => setRejectNote(e.target.value)}
              required
              className="rounded-lg border-zinc-200 dark:border-zinc-700 h-10"
            />

            <div className="flex justify-end gap-2.5 pt-2">
              <Button 
                variant="ghost" 
                type="button" 
                onClick={() => {
                  setShowRejectDialog(false);
                  setSelectedRequest(null);
                  setRejectNote("");
                }}
                className="rounded-lg font-semibold hover:bg-zinc-50 dark:hover:bg-zinc-800"
              >
                Hủy
              </Button>
              <Button 
                type="submit" 
                disabled={isPending}
                className="bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold px-5 h-10"
              >
                {isPending ? "Đang gửi..." : "Từ chối yêu cầu"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Recruiter Status badge helper
function RecruiterStatusBadge({ status }: { status: RecruiterRequest["status"] }) {
  if (status === "approved") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 dark:bg-emerald-950/35 border border-emerald-100 dark:border-emerald-900/50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 dark:text-emerald-400">
        Đã duyệt
      </span>
    );
  }

  if (status === "rejected") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-50 dark:bg-rose-950/35 border border-rose-100 dark:border-rose-900/50 px-2.5 py-0.5 text-xs font-semibold text-rose-750 dark:text-rose-400">
        Từ chối
      </span>
    );
  }

  if (status === "cancelled") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-zinc-100 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700 px-2.5 py-0.5 text-xs font-semibold text-zinc-500 dark:text-zinc-400">
        Đã hủy
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 dark:bg-amber-950/35 border border-amber-100 dark:border-amber-900/50 px-2.5 py-0.5 text-xs font-semibold text-amber-700 dark:text-amber-400">
      <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse" />
      Chờ duyệt
    </span>
  );
}
