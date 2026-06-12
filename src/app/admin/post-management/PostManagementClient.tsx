"use client";

import { useState, useTransition, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  CheckCircle2,
  XCircle,
  Search,
  Download,
  MoreHorizontal,
  User,
  Mail,
  Calendar,
  Clock,
  Activity,
  Sparkles,
  X,
  FileText,
  ShieldAlert,
  ArrowUpRight,
  MessageSquareOff,
  Trash2,
  RotateCcw,
  Heart,
  MessageSquare,
  Eye,
  EyeOff
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";
import {
  approveExplorePostAction,
  deleteExploreCommentAsAdminAction,
  deleteExplorePostAsAdminAction,
  hideExploreCommentAsAdminAction,
  hideExplorePostAsAdminAction,
  rejectExplorePostAction,
  restoreExplorePostAsAdminAction,
} from "@/features/admin/explore";
import {
  getExplorePostStatusLabel,
  getExplorePostTypeLabel,
  getRoleLabel,
} from "@/features/explore/exploreRules.mjs";

type Author = {
  id: string;
  name: string | null;
  email: string | null;
  imageUrl?: string | null;
  role: string | null;
};

type Comment = {
  id: string;
  content: string;
  status: "published" | "hidden" | "deleted";
  createdAt: Date;
  author: {
    id: string;
    name: string | null;
    email: string | null;
  } | null;
};

type ExplorePost = {
  id: string;
  authorId: string;
  type: "job_post" | "cv_showcase";
  status: "pending" | "published" | "rejected" | "hidden" | "deleted";
  title: string;
  content: string;
  companyName: string | null;
  positionTitle: string | null;
  location: string | null;
  salaryRange: string | null;
  skills: string | null;
  cvUrl: string | null;
  cvFileName: string | null;
  rejectionReason: string | null;
  reviewedById: string | null;
  reviewedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  author: Author | null;
  comments: Comment[];
};

type SummaryStats = {
  total: number;
  pending: number;
  published: number;
  hidden: number;
};


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

export default function PostManagementClient({
  posts,
  stats,
  currentStatus,
}: {
  posts: ExplorePost[];
  stats: SummaryStats;
  currentStatus: "all" | "pending" | "published" | "rejected" | "hidden" | "deleted";
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // Search & Dialog states
  const [searchQuery, setSearchQuery] = useState("");
  const [rejectReason, setRejectReason] = useState("");
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [selectedPost, setSelectedPost] = useState<ExplorePost | null>(null);

  // Drawer states
  const [drawerPost, setDrawerPost] = useState<ExplorePost | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Filter posts locally on search query
  const filteredPosts = posts.filter((p) => {
    const query = searchQuery.toLowerCase().trim();
    if (!query) return true;
    return (
      p.title.toLowerCase().includes(query) ||
      p.content.toLowerCase().includes(query) ||
      (p.author?.name || "").toLowerCase().includes(query) ||
      (p.author?.email || "").toLowerCase().includes(query) ||
      (p.companyName || "").toLowerCase().includes(query)
    );
  });

  const handleApprove = (id: string) => {
    if (!confirm("Xác nhận duyệt bài viết này?")) return;
    startTransition(async () => {
      try {
        await approveExplorePostAction(id);
        router.refresh();
        // Update local drawer state if open
        if (drawerPost?.id === id) {
          setDrawerPost((prev) => prev ? { ...prev, status: "published", rejectionReason: null } : null);
        }
      } catch (err) {
        console.error("Approve failed", err);
      }
    });
  };

  const handleHide = (id: string) => {
    if (!confirm("Xác nhận ẩn bài viết này?")) return;
    startTransition(async () => {
      try {
        await hideExplorePostAsAdminAction(id);
        router.refresh();
        if (drawerPost?.id === id) {
          setDrawerPost((prev) => prev ? { ...prev, status: "hidden" } : null);
        }
      } catch (err) {
        console.error("Hide failed", err);
      }
    });
  };

  const handleRestore = (id: string) => {
    if (!confirm("Xác nhận hiện lại bài viết này?")) return;
    startTransition(async () => {
      try {
        await restoreExplorePostAsAdminAction(id);
        router.refresh();
        if (drawerPost?.id === id) {
          setDrawerPost((prev) => prev ? { ...prev, status: "published", rejectionReason: null } : null);
        }
      } catch (err) {
        console.error("Restore failed", err);
      }
    });
  };

  const handleDelete = (id: string) => {
    if (!confirm("Xác nhận xóa bài viết này?")) return;
    startTransition(async () => {
      try {
        await deleteExplorePostAsAdminAction(id);
        router.refresh();
        if (drawerPost?.id === id) {
          setDrawerPost((prev) => prev ? { ...prev, status: "deleted" } : null);
        }
      } catch (err) {
        console.error("Delete failed", err);
      }
    });
  };

  const handleRejectSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPost) return;

    startTransition(async () => {
      try {
        await rejectExplorePostAction(selectedPost.id, rejectReason);
        setShowRejectDialog(false);
        setRejectReason("");
        setSelectedPost(null);
        router.refresh();
        if (drawerPost?.id === selectedPost.id) {
          setDrawerPost((prev) => prev ? { ...prev, status: "rejected", rejectionReason: rejectReason } : null);
        }
      } catch (err) {
        console.error("Reject failed", err);
      }
    });
  };

  // Comment moderation
  const handleHideComment = (commentId: string) => {
    if (!confirm("Xác nhận ẩn bình luận này?")) return;
    startTransition(async () => {
      try {
        await hideExploreCommentAsAdminAction(commentId);
        router.refresh();
        if (drawerPost) {
          setDrawerPost((prev) => {
            if (!prev) return null;
            return {
              ...prev,
              comments: prev.comments.map((c) =>
                c.id === commentId ? { ...c, status: "hidden" as const } : c
              ),
            };
          });
        }
      } catch (err) {
        console.error("Hide comment failed", err);
      }
    });
  };

  const handleDeleteComment = (commentId: string) => {
    if (!confirm("Xác nhận xóa bình luận này?")) return;
    startTransition(async () => {
      try {
        await deleteExploreCommentAsAdminAction(commentId);
        router.refresh();
        if (drawerPost) {
          setDrawerPost((prev) => {
            if (!prev) return null;
            return {
              ...prev,
              comments: prev.comments.map((c) =>
                c.id === commentId ? { ...c, status: "deleted" as const } : c
              ),
            };
          });
        }
      } catch (err) {
        console.error("Delete comment failed", err);
      }
    });
  };

  // Export to CSV helper
  const handleExport = () => {
    const headers = ["ID", "Tiêu đề", "Loại", "Tác giả", "Email Tác giả", "Nơi làm việc", "Trạng thái", "Ngày đăng", "Lượt thích", "Lượt bình luận"];
    const rows = posts.map(p => {
      return [
        p.id,
        p.title,
        p.type === "job_post" ? "Tuyển dụng" : "CV ứng viên",
        p.author?.name || "",
        p.author?.email || "",
        p.companyName || "",
        p.status,
        new Date(p.createdAt).toLocaleDateString("vi-VN"),
        "0",
        p.comments.length.toString(),
      ];
    });
    const csvContent = "data:text/csv;charset=utf-8,\uFEFF"
      + [headers.join(","), ...rows.map(e => e.map(val => `"${val.replace(/"/g, '""')}"`).join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Danh_Sach_Bai_Viet_${new Date().toISOString().split('T')[0]}.csv`);
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
            Quản lý bài viết Khám phá
          </h1>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            Theo dõi, kiểm duyệt và quản lý nội dung được đăng trên nền tảng.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3.5 top-3 h-4 w-4 text-zinc-400" />
            <Input
              placeholder="Tìm tiêu đề, tác giả..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-72 pl-9.5 bg-zinc-50/50 dark:bg-zinc-800/50 border-zinc-200 dark:border-zinc-700 rounded-full h-10 focus-visible:ring-1 focus-visible:ring-red-500/20"
            />
          </div>

          <Button
            onClick={handleExport}
            className="flex items-center gap-2 bg-zinc-900 hover:bg-zinc-850 dark:bg-zinc-800 dark:hover:bg-zinc-750 text-white font-medium rounded-full px-5 h-10 shadow-xs transition-colors duration-200 cursor-pointer text-sm"
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
              <p className="text-xs font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">Tổng bài viết</p>
              <h3 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50 mt-1">
                {stats.total.toLocaleString()}
              </h3>
            </div>
            <div className="p-2.5 bg-zinc-50 dark:bg-zinc-800 rounded-lg text-zinc-500 dark:text-zinc-400">
              <FileText className="h-4 w-4" />
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
              <p className="text-xs font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">Đã public</p>
              <h3 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50 mt-1">
                {stats.published.toLocaleString()}
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
              <p className="text-xs font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">Đã ẩn</p>
              <h3 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50 mt-1">
                {stats.hidden.toLocaleString()}
              </h3>
            </div>
            <div className="p-2.5 bg-slate-100 dark:bg-zinc-850 rounded-lg text-zinc-650 dark:text-zinc-400">
              <EyeOff className="h-4 w-4" />
            </div>
          </CardContent>
        </Card>
      </section>

      {/* 6. Filter System - Segmented Control style */}
      <section className="flex items-center gap-2 overflow-x-auto py-1">
        {([
          { value: "all", label: "Tất cả" },
          { value: "pending", label: "Chờ duyệt" },
          { value: "published", label: "Đã public" },
          { value: "hidden", label: "Đã ẩn" },
          { value: "rejected", label: "Từ chối" },
          { value: "deleted", label: "Đã xóa" }
        ] as const).map((tab) => {
          const isActive = currentStatus === tab.value;
          return (
            <Button
              key={tab.value}
              asChild
              variant="ghost"
              className={`rounded-full px-5 py-2 h-9 text-xs font-semibold transition-all cursor-pointer ${
                isActive
                  ? "bg-zinc-900 text-white dark:bg-zinc-50 dark:text-zinc-900 shadow-sm"
                  : "bg-white border border-zinc-200 text-zinc-650 hover:bg-zinc-50 dark:bg-zinc-900 dark:border-zinc-850 dark:text-zinc-400 dark:hover:bg-zinc-800"
              }`}
            >
              <Link href={`/admin/post-management?status=${tab.value}`}>
                {tab.label}
              </Link>
            </Button>
          );
        })}
      </section>

      {/* 3. Content Table */}
      <section>
        <Card className="rounded-2xl border border-slate-100 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden shadow-xs">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1000px] table-auto text-left border-collapse">
                <thead>
                  <tr className="border-b border-zinc-100 dark:border-zinc-800 text-xs font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">
                    <th className="px-6 py-4">Tác giả</th>
                    <th className="px-6 py-4">Loại bài viết</th>
                    <th className="px-6 py-4">Nội dung</th>
                    <th className="px-6 py-4">Tương tác</th>
                    <th className="px-6 py-4">Trạng thái</th>
                    <th className="px-6 py-4">Ngày đăng</th>
                    <th className="px-6 py-4 text-right"></th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-zinc-50 dark:divide-zinc-800/50">
                  {filteredPosts.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-16 text-center text-sm text-zinc-400 dark:text-zinc-500">
                        Không tìm thấy bài viết nào phù hợp
                      </td>
                    </tr>
                  ) : (
                    filteredPosts.map((post) => {
                      const isFocused = drawerPost?.id === post.id;

                      // Badges for Type
                      const typeBadge =
                        post.type === "job_post" ? (
                          <Badge className="bg-rose-50 hover:bg-rose-50 text-rose-700 border border-rose-100 font-semibold px-2 py-0.5 text-xs rounded-md shadow-3xs">
                            Tuyển dụng
                          </Badge>
                        ) : post.type === "cv_showcase" ? (
                          <Badge className="bg-indigo-50 hover:bg-indigo-50 text-indigo-700 border border-indigo-100 font-semibold px-2 py-0.5 text-xs rounded-md shadow-3xs">
                            CV ứng viên
                          </Badge>
                        ) : (
                          <Badge className="bg-zinc-50 hover:bg-zinc-50 text-zinc-650 border border-zinc-200 font-semibold px-2 py-0.5 text-xs rounded-md shadow-3xs">
                            Khác
                          </Badge>
                        );

                      return (
                        <tr
                          key={post.id}
                          onClick={() => {
                            setDrawerPost(post);
                            setDrawerOpen(true);
                          }}
                          className={`group cursor-pointer transition-all duration-150 hover:bg-zinc-50/50 dark:hover:bg-zinc-800/30 ${
                            isFocused ? "bg-zinc-50 dark:bg-zinc-800/40" : ""
                          }`}
                        >
                          {/* Author Column */}
                          <td className="px-6 py-4.5">
                            <div className="flex items-center gap-3">
                              <Avatar className="h-9 w-9 rounded-lg ring-2 ring-zinc-100 dark:ring-zinc-800 transition-transform group-hover:scale-102">
                                <AvatarFallback className="bg-red-50 dark:bg-red-950/20 text-xs font-semibold text-red-650 dark:text-red-400 rounded-lg">
                                  {(post.author?.name ?? "U")
                                    .split(" ")
                                    .map((s) => s[0])
                                    .slice(0, 2)
                                    .join("")
                                    .toUpperCase()}
                                </AvatarFallback>
                              </Avatar>

                              <div className="max-w-[180px] truncate">
                                <div className="font-semibold text-sm text-zinc-900 dark:text-zinc-100 group-hover:text-zinc-950 dark:group-hover:text-zinc-50 transition-colors">
                                  {post.author?.name ?? "—"}
                                </div>
                                <div className="text-xs text-zinc-400 dark:text-zinc-500 truncate mt-0.5">
                                  {post.author?.email ?? "—"}
                                </div>
                              </div>
                            </div>
                          </td>

                          {/* Type Column */}
                          <td className="px-6 py-4.5">{typeBadge}</td>

                          {/* Content Column */}
                          <td className="px-6 py-4.5 max-w-[280px]">
                            <div className="truncate font-semibold text-sm text-zinc-900 dark:text-zinc-100">
                              {post.title}
                            </div>
                            <div className="truncate text-xs text-zinc-400 dark:text-zinc-500 mt-0.5">
                              {post.content}
                            </div>
                          </td>

                          {/* Interactions Column */}
                          <td className="px-6 py-4.5">
                            <div className="flex items-center gap-3 text-xs font-semibold text-zinc-550 dark:text-zinc-400">
                              <span className="flex items-center gap-1">
                                <Heart className="h-3.5 w-3.5 text-rose-500 fill-rose-500" />
                                0
                              </span>
                              <span className="flex items-center gap-1">
                                <MessageSquare className="h-3.5 w-3.5 text-zinc-450" />
                                {post.comments.length}
                              </span>
                            </div>
                          </td>

                          {/* Status Column */}
                          <td className="px-6 py-4.5">
                            <PostStatusBadge status={post.status} />
                          </td>

                          {/* Date Column */}
                          <td className="px-6 py-4.5 text-xs font-semibold text-zinc-550 dark:text-zinc-400">
                            {formatRelativeTime(post.createdAt)}
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
                                    setDrawerPost(post);
                                    setDrawerOpen(true);
                                  }}
                                  className="rounded-lg text-zinc-700 dark:text-zinc-300 gap-2 font-semibold cursor-pointer text-xs"
                                >
                                  <Eye className="h-4 w-4" />
                                  Xem chi tiết
                                </DropdownMenuItem>

                                <DropdownMenuSeparator className="border-zinc-150 dark:border-zinc-800" />

                                {post.status === "pending" && (
                                  <>
                                    <DropdownMenuItem
                                      onClick={() => handleApprove(post.id)}
                                      className="rounded-lg text-emerald-600 dark:text-emerald-400 focus:bg-emerald-50 dark:focus:bg-emerald-950/20 focus:text-emerald-600 gap-2 font-semibold cursor-pointer text-xs"
                                    >
                                      <CheckCircle2 className="h-4 w-4" />
                                      Duyệt bài viết
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                      onClick={() => {
                                        setSelectedPost(post);
                                        setShowRejectDialog(true);
                                      }}
                                      className="rounded-lg text-red-600 dark:text-red-400 focus:bg-red-50 dark:focus:bg-red-950/20 focus:text-red-650 gap-2 font-semibold cursor-pointer text-xs"
                                    >
                                      <XCircle className="h-4 w-4" />
                                      Từ chối duyệt
                                    </DropdownMenuItem>
                                  </>
                                )}

                                {post.status === "published" && (
                                  <>
                                    <DropdownMenuItem
                                      onClick={() => handleHide(post.id)}
                                      className="rounded-lg text-zinc-600 dark:text-zinc-400 focus:bg-zinc-50 dark:focus:bg-zinc-800 gap-2 font-semibold cursor-pointer text-xs"
                                    >
                                      <EyeOff className="h-4 w-4" />
                                      Ẩn bài viết
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                      onClick={() => handleDelete(post.id)}
                                      className="rounded-lg text-red-650 dark:text-red-400 focus:bg-red-50 dark:focus:bg-red-950/20 focus:text-red-650 gap-2 font-semibold cursor-pointer text-xs"
                                    >
                                      <Trash2 className="h-4 w-4" />
                                      Xóa bài viết
                                    </DropdownMenuItem>
                                  </>
                                )}

                                {(post.status === "hidden" || post.status === "rejected" || post.status === "deleted") && (
                                  <DropdownMenuItem
                                    onClick={() => handleRestore(post.id)}
                                    className="rounded-lg text-emerald-600 dark:text-emerald-400 focus:bg-emerald-50 dark:focus:bg-emerald-950/20 focus:text-emerald-600 gap-2 font-semibold cursor-pointer text-xs"
                                  >
                                    <RotateCcw className="h-4 w-4" />
                                    Hiện lại bài
                                  </DropdownMenuItem>
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
      {drawerOpen && drawerPost && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40 bg-zinc-950/25 backdrop-blur-xs transition-opacity duration-350"
            onClick={() => setDrawerOpen(false)}
          />
          {/* Drawer Panel */}
          <div className="fixed inset-y-0 right-0 z-50 w-full max-w-xl bg-white dark:bg-zinc-900 border-l border-zinc-100 dark:border-zinc-800 shadow-2xl p-6 flex flex-col justify-between transform transition-transform duration-350 ease-out translate-x-0">
            <div className="space-y-6 overflow-y-auto pr-2">
              {/* Header */}
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-50 flex items-center gap-2">
                  <FileText className="h-5 w-5 text-red-600" />
                  Chi tiết bài viết
                </h3>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setDrawerOpen(false)}
                  className="h-8 w-8 rounded-lg text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800 cursor-pointer"
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>

              {/* Author & Meta Summary Card */}
              <div className="flex flex-col md:flex-row items-center md:items-start justify-between p-4 bg-zinc-50/50 dark:bg-zinc-800/35 rounded-2xl border border-zinc-100/50 dark:border-zinc-800/50 gap-4">
                <div className="flex items-center gap-3">
                  <Avatar className="h-14 w-14 rounded-2xl ring-4 ring-white dark:ring-zinc-800 shadow-xs">
                    <AvatarFallback className="bg-red-50 dark:bg-red-950/20 text-base font-bold text-red-600 dark:text-red-400 rounded-2xl">
                      {(drawerPost.author?.name ?? "U")
                        .split(" ")
                        .map((s) => s[0])
                        .slice(0, 2)
                        .join("")
                        .toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h4 className="text-base font-bold text-zinc-900 dark:text-zinc-100">{drawerPost.author?.name ?? "—"}</h4>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">{drawerPost.author?.email ?? "—"}</p>
                    <p className="text-[10px] text-zinc-400 font-semibold mt-1">
                      {getRoleLabel(drawerPost.author?.role ?? "user")} · Đăng {formatRelativeTime(drawerPost.createdAt)}
                    </p>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1.5 shrink-0">
                  <PostStatusBadge status={drawerPost.status} />
                  <Badge className={`rounded-md border-none px-2.5 py-0.5 font-bold text-xs ${
                    drawerPost.type === "job_post" ? "bg-rose-50 text-rose-700 dark:bg-rose-950/30" : "bg-indigo-50 text-indigo-700 dark:bg-indigo-950/30"
                  }`}>
                    {getExplorePostTypeLabel(drawerPost.type)}
                  </Badge>
                </div>
              </div>

              {/* Post Content */}
              <div className="space-y-4 border-b border-zinc-100 dark:border-zinc-800 pb-5">
                <h2 className="text-xl font-extrabold text-zinc-900 dark:text-zinc-50 leading-snug">
                  {drawerPost.title}
                </h2>

                {/* Sub info */}
                <div className="flex flex-wrap gap-2 text-xs">
                  {drawerPost.salaryRange && (
                    <span className="bg-emerald-50 text-emerald-800 dark:bg-emerald-950/20 dark:text-emerald-400 px-2.5 py-1 rounded-lg font-semibold">
                      Lương: {drawerPost.salaryRange}
                    </span>
                  )}
                  {drawerPost.location && (
                    <span className="bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-350 px-2.5 py-1 rounded-lg font-semibold">
                      Địa điểm: {drawerPost.location}
                    </span>
                  )}
                  {drawerPost.positionTitle && (
                    <span className="bg-indigo-50 text-indigo-800 dark:bg-indigo-950/20 dark:text-indigo-400 px-2.5 py-1 rounded-lg font-semibold">
                      Vị trí: {drawerPost.positionTitle}
                    </span>
                  )}
                </div>

                {/* Content body formatted */}
                <div className="bg-zinc-50/50 dark:bg-zinc-800/20 border border-zinc-150/50 dark:border-zinc-800/80 p-4 rounded-xl text-sm leading-relaxed text-zinc-700 dark:text-zinc-300 whitespace-pre-line">
                  {drawerPost.content}
                </div>

                {/* Attachments / CV Link */}
                {drawerPost.cvUrl && (
                  <div className="flex items-center justify-between p-3 bg-indigo-50/30 dark:bg-indigo-950/10 border border-indigo-100/50 dark:border-indigo-900/35 rounded-xl">
                    <div className="flex items-center gap-2 text-xs font-semibold text-indigo-700 dark:text-indigo-450">
                      <FileText className="h-4 w-4" />
                      <span>{drawerPost.cvFileName || "CV đính kèm"}</span>
                    </div>
                    <a
                      href={drawerPost.cvUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 text-xs font-bold text-red-600 hover:text-red-700 dark:text-red-400 hover:underline"
                    >
                      Tải CV xuống
                      <ArrowUpRight className="h-3 w-3" />
                    </a>
                  </div>
                )}

                {/* Rejection reason if any */}
                {drawerPost.rejectionReason && (
                  <div className="flex gap-2 rounded-xl border border-rose-100 bg-rose-50/30 p-3.5 text-xs text-rose-700 dark:text-rose-400 dark:border-rose-900/20">
                    <ShieldAlert className="h-4.5 w-4.5 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold">Lý do từ chối: </span>
                      <span className="leading-relaxed">{drawerPost.rejectionReason}</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Engagement Stats */}
              <div className="flex items-center gap-6 border-b border-zinc-100 dark:border-zinc-800 pb-4">
                <div className="flex items-center gap-1.5 text-sm font-semibold text-zinc-550 dark:text-zinc-400">
                  <Heart className="h-4 w-4 text-rose-500 fill-rose-500" />
                  <span>0 Lượt thích</span>
                </div>
                <div className="flex items-center gap-1.5 text-sm font-semibold text-zinc-550 dark:text-zinc-400">
                  <MessageSquare className="h-4 w-4 text-zinc-400" />
                  <span>{drawerPost.comments.length} Bình luận</span>
                </div>
              </div>

              {/* Comment Moderation section */}
              <div className="space-y-4">
                <h4 className="text-xs font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">
                  Kiểm duyệt bình luận ({drawerPost.comments.length})
                </h4>

                {drawerPost.comments.length === 0 ? (
                  <p className="text-xs text-zinc-400 dark:text-zinc-500 italic py-2">
                    Chưa có bình luận nào trên bài viết này.
                  </p>
                ) : (
                  <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
                    {drawerPost.comments.map((comment) => {
                      const isDeleted = comment.status === "deleted";
                      const isHidden = comment.status === "hidden";
                      return (
                        <div
                          key={comment.id}
                          className={`flex items-start justify-between gap-3 p-3 rounded-xl border text-xs leading-relaxed ${
                            isDeleted
                              ? "bg-red-50/10 border-red-100/30 text-zinc-400"
                              : isHidden
                              ? "bg-slate-50/30 border-slate-100/35 text-zinc-400"
                              : "bg-zinc-50/35 border-zinc-150/40 text-zinc-700 dark:text-zinc-300 dark:bg-zinc-800/10"
                          }`}
                        >
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-zinc-900 dark:text-zinc-200">
                                {comment.author?.name || "Người dùng"}
                              </span>
                              <span className="text-[10px] text-zinc-400">
                                {formatRelativeTime(comment.createdAt)}
                              </span>
                              {isHidden && (
                                <Badge variant="outline" className="text-[9px] px-1 py-0 border-slate-200 bg-slate-50 text-slate-500 font-medium rounded">
                                  Đã ẩn
                                </Badge>
                              )}
                              {isDeleted && (
                                <Badge variant="outline" className="text-[9px] px-1 py-0 border-red-200 bg-red-50 text-red-550 font-medium rounded">
                                  Đã xóa
                                </Badge>
                              )}
                            </div>
                            <p>{comment.content}</p>
                          </div>

                          {!isDeleted && !isHidden && (
                            <div className="flex items-center gap-1 shrink-0">
                              <Button
                                size="icon"
                                variant="ghost"
                                onClick={() => handleHideComment(comment.id)}
                                className="h-7 w-7 rounded-lg text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                                title="Ẩn bình luận"
                              >
                                <MessageSquareOff className="h-3.5 w-3.5" />
                              </Button>
                              <Button
                                size="icon"
                                variant="ghost"
                                onClick={() => handleDeleteComment(comment.id)}
                                className="h-7 w-7 rounded-lg text-red-550 hover:bg-red-50 dark:hover:bg-red-950/20"
                                title="Xóa bình luận"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Action Footer */}
            <div className="flex gap-2.5 pt-4 mt-6 border-t border-zinc-100 dark:border-zinc-800">
              <Button
                variant="outline"
                asChild
                className="border-zinc-200 dark:border-zinc-700 rounded-xl gap-2 font-semibold h-11 flex-1 bg-white dark:bg-zinc-900 cursor-pointer text-sm"
              >
                <Link href={`/admin/user-management?focus=${drawerPost.authorId}`}>
                  Xem User Profile
                </Link>
              </Button>

              {drawerPost.status === "pending" && (
                <>
                  <Button
                    onClick={() => {
                      setSelectedPost(drawerPost);
                      setShowRejectDialog(true);
                    }}
                    className="border border-zinc-200 dark:border-zinc-700 text-red-650 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-xl gap-2 font-semibold h-11 px-4 cursor-pointer text-sm"
                  >
                    Từ chối
                  </Button>
                  <Button
                    disabled={isPending}
                    onClick={() => handleApprove(drawerPost.id)}
                    className="bg-red-600 hover:bg-red-700 text-white rounded-xl gap-2 font-semibold h-11 px-5 cursor-pointer flex-1 text-sm shadow-sm"
                  >
                    <CheckCircle2 className="h-4 w-4" />
                    Duyệt bài đăng
                  </Button>
                </>
              )}

              {drawerPost.status === "published" && (
                <>
                  <Button
                    disabled={isPending}
                    onClick={() => handleHide(drawerPost.id)}
                    className="border border-zinc-200 dark:border-zinc-700 text-zinc-750 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 rounded-xl gap-2 font-semibold h-11 px-5 cursor-pointer flex-1 text-sm"
                  >
                    <EyeOff className="h-4 w-4" />
                    Ẩn bài viết
                  </Button>
                  <Button
                    disabled={isPending}
                    onClick={() => handleDelete(drawerPost.id)}
                    className="bg-red-600 hover:bg-red-700 text-white rounded-xl gap-2 font-semibold h-11 px-4 cursor-pointer text-sm"
                  >
                    <Trash2 className="h-4 w-4" />
                    Xóa bài
                  </Button>
                </>
              )}

              {(drawerPost.status === "hidden" || drawerPost.status === "rejected" || drawerPost.status === "deleted") && (
                <Button
                  disabled={isPending}
                  onClick={() => handleRestore(drawerPost.id)}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl gap-2 font-semibold h-11 px-5 cursor-pointer flex-1 text-sm"
                >
                  <RotateCcw className="h-4 w-4" />
                  Hiện lại bài đăng
                </Button>
              )}
            </div>
          </div>
        </>
      )}

      {/* Reject Reason Form Dialog */}
      <Dialog open={showRejectDialog} onOpenChange={(v) => {
        if (!v) {
          setShowRejectDialog(false);
          setSelectedPost(null);
          setRejectReason("");
        }
      }}>
        <DialogContent className="sm:max-w-md rounded-2xl border-none shadow-xl bg-white dark:bg-zinc-900 p-6">
          <form onSubmit={handleRejectSubmit} className="space-y-4">
            <div>
              <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-55">Từ chối duyệt bài viết</h3>
              <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
                Vui lòng cung cấp lý do từ chối đăng bài viết này.
              </p>
            </div>

            <Input
              name="reason"
              placeholder="Lý do từ chối (ví dụ: Nội dung chứa từ khóa vi phạm...)"
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              required
              className="rounded-lg border-zinc-200 dark:border-zinc-700 h-10 text-sm focus-visible:ring-1 focus-visible:ring-red-500/20"
            />

            <div className="flex justify-end gap-2.5 pt-2">
              <Button
                variant="ghost"
                type="button"
                onClick={() => {
                  setShowRejectDialog(false);
                  setSelectedPost(null);
                  setRejectReason("");
                }}
                className="rounded-lg font-semibold hover:bg-zinc-50 dark:hover:bg-zinc-800 text-sm"
              >
                Hủy
              </Button>
              <Button
                type="submit"
                disabled={isPending}
                className="bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold px-5 h-10 text-sm"
              >
                {isPending ? "Đang gửi..." : "Từ chối duyệt"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Post Status badge styling helper
function PostStatusBadge({ status }: { status: ExplorePost["status"] }) {
  if (status === "published") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 dark:bg-emerald-950/35 border border-emerald-100 dark:border-emerald-900/50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 dark:text-emerald-450">
        Published
      </span>
    );
  }

  if (status === "rejected") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-50 dark:bg-rose-950/35 border border-rose-100 dark:border-rose-900/50 px-2.5 py-0.5 text-xs font-semibold text-rose-700 dark:text-rose-450">
        Rejected
      </span>
    );
  }

  if (status === "hidden") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 dark:bg-zinc-800/80 border border-slate-200 dark:border-zinc-700 px-2.5 py-0.5 text-xs font-semibold text-zinc-500 dark:text-zinc-400">
        Hidden
      </span>
    );
  }

  if (status === "deleted") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-red-55/10 dark:bg-red-950/35 border border-red-200 dark:border-red-900/50 px-2.5 py-0.5 text-xs font-semibold text-red-600 dark:text-red-400">
        Deleted
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 dark:bg-amber-950/35 border border-amber-100 dark:border-amber-900/50 px-2.5 py-0.5 text-xs font-semibold text-amber-700 dark:text-amber-450">
      <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse" />
      Pending
    </span>
  );
}
