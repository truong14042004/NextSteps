"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Copy, ExternalLink, MoreHorizontal, Users } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type UserRow = {
  id: string;
  name: string | null;
  email: string | null;
  role: string | null;
  status?: "Active" | "Inactive";
  updatedAt?: string | null;
  createdAt?: string | null;
};

function StatusBadge({ status }: { status?: string | null }) {
  if (status === "Active") {
    return (
      <span className="inline-flex items-center rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 ring-1 ring-inset ring-emerald-500/20 dark:bg-emerald-500/20 dark:text-emerald-400">
        Active
      </span>
    );
  }

  return (
    <span className="inline-flex items-center rounded-full bg-rose-500/10 px-2.5 py-0.5 text-xs font-semibold text-rose-700 ring-1 ring-inset ring-rose-500/20 dark:bg-rose-500/20 dark:text-rose-400">
      Inactive
    </span>
  );
}

function timeAgo(date?: string | null) {
  if (!date) return "-";
  const d = new Date(date);
  const diff = Date.now() - d.getTime();
  const sec = Math.floor(diff / 1000);
  if (sec < 60) return `${sec} giây trước`;
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min} phút trước`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr} giờ trước`;
  const days = Math.floor(hr / 24);
  if (days < 7) return `${days} ngày trước`;
  return d.toLocaleDateString("vi-VN");
}

async function copyEmail(email: string | null) {
  if (!email) return;
  await navigator.clipboard.writeText(email);
  toast.success("Đã sao chép email");
}

export function UserActivityTable() {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  useEffect(() => {
    let mounted = true;

    const fetchUsers = async () => {
      try {
        const res = await fetch("/api/admin/recent-users");
        const data = await res.json();
        if (mounted) {
          setUsers(data?.users ?? []);
        }
      } catch (err) {
        console.error("Failed to fetch recent users", err);
        if (mounted) {
          setUsers([]);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    fetchUsers();

    return () => {
      mounted = false;
    };
  }, []);

  const totalPages = Math.ceil(users.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedUsers = users.slice(startIndex, startIndex + itemsPerPage);

  return (
    <Card className="rounded-[20px] border border-border/40 bg-card shadow-sm overflow-hidden">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 border-b border-border/40">
        <div className="flex items-center gap-2.5">
          <div className="rounded-xl bg-primary/10 p-2.5 text-primary border border-primary/10">
            <Users className="size-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-foreground">
              Người dùng cập nhật gần đây
            </h2>
            <p className="mt-0.5 text-xs text-muted-foreground/80">
              Tài khoản có thay đổi hồ sơ hoặc phiên đăng nhập mới nhất
            </p>
          </div>
        </div>
        <Button
          variant="outline"
          className="rounded-full text-xs font-semibold border-primary/20 text-primary hover:bg-primary/5 hover:text-primary active:scale-95 transition-all self-start sm:self-center"
          asChild
        >
          <Link href="/admin/user-management">Xem tất cả người dùng</Link>
        </Button>
      </div>

      <div className="overflow-x-auto scrollbar-thin">
        <Table className="relative">
          <TableHeader className="sticky top-0 z-10 bg-background/90 backdrop-blur-sm border-b border-border/40 shadow-[0_1px_0_0_rgba(0,0,0,0.05)]">
            <TableRow className="hover:bg-transparent border-b border-border/40">
              <TableHead className="min-w-[160px] pl-6 h-11 text-xs font-bold uppercase tracking-wider text-muted-foreground/90">
                Tên người dùng
              </TableHead>
              <TableHead className="min-w-[220px] h-11 text-xs font-bold uppercase tracking-wider text-muted-foreground/90">
                Email
              </TableHead>
              <TableHead className="min-w-[120px] h-11 text-xs font-bold uppercase tracking-wider text-muted-foreground/90">
                Trạng thái
              </TableHead>
              <TableHead className="min-w-[160px] h-11 text-xs font-bold uppercase tracking-wider text-muted-foreground/90">
                Cập nhật gần nhất
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell
                  colSpan={4}
                  className="py-12 text-center text-sm text-muted-foreground"
                >
                  <div className="flex items-center justify-center gap-2">
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                    Đang tải dữ liệu...
                  </div>
                </TableCell>
              </TableRow>
            ) : users.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={4}
                  className="py-12 text-center text-sm text-muted-foreground"
                >
                  Không có dữ liệu người dùng
                </TableCell>
              </TableRow>
            ) : (
              paginatedUsers.map((user) => (
                <TableRow
                  key={user.id}
                  className="hover:bg-muted/20 border-b border-border/30 last:border-0 transition-colors"
                >
                  <TableCell className="font-semibold text-foreground pl-6 py-3.5">
                    {user.name ?? "-"}
                  </TableCell>
                  <TableCell className="text-muted-foreground py-3.5">
                    {user.email ?? "-"}
                  </TableCell>
                  <TableCell className="py-3.5">
                    <StatusBadge status={user.status} />
                  </TableCell>
                  <TableCell className="text-muted-foreground py-3.5">
                    {timeAgo(user.updatedAt ?? user.createdAt)}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination Footer Controls */}
      {!loading && users.length > 0 && (
        <div className="flex items-center justify-between border-t border-border/40 px-6 py-4 bg-muted/5">
          <div className="text-xs text-muted-foreground font-medium">
            Hiển thị {startIndex + 1}-{Math.min(startIndex + itemsPerPage, users.length)} trong tổng số {users.length} tài khoản
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              className="rounded-full text-xs font-semibold"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            >
              Trước
            </Button>
            <span className="text-xs font-semibold text-muted-foreground">
              Trang {currentPage} / {totalPages || 1}
            </span>
            <Button
              variant="outline"
              size="sm"
              className="rounded-full text-xs font-semibold"
              disabled={currentPage === totalPages || totalPages === 0}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            >
              Sau
            </Button>
          </div>
        </div>
      )}
    </Card>
  );
}
