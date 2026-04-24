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
      <Badge
        variant="secondary"
        className="border-emerald-500/20 bg-emerald-500/10 text-emerald-700"
      >
        Active
      </Badge>
    );
  }

  return (
    <Badge
      variant="secondary"
      className="border-rose-500/20 bg-rose-500/10 text-rose-700"
    >
      Inactive
    </Badge>
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

  return (
    <Card className="rounded-2xl bg-card">
      <div className="flex items-start justify-between gap-4 p-6">
        <div>
          <h2 className="text-base font-semibold">
            Người dùng cập nhật gần đây
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            10 tài khoản có thay đổi hồ sơ hoặc phiên đăng nhập mới nhất
          </p>
        </div>
        <Button variant="link" className="h-auto px-0" asChild>
          <Link href="/admin/user-management">Xem tất cả người dùng</Link>
        </Button>
      </div>

      <div className="px-2 pb-6">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="min-w-[160px]">Tên người dùng</TableHead>
              <TableHead className="min-w-[220px]">Email</TableHead>
              <TableHead className="min-w-[120px]">Trạng thái</TableHead>
              <TableHead className="min-w-[160px]">Cập nhật gần nhất</TableHead>
              <TableHead className="w-[80px]">Hành động</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="py-8 text-center text-muted-foreground"
                >
                  Đang tải...
                </TableCell>
              </TableRow>
            ) : users.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="py-8 text-center text-muted-foreground"
                >
                  Không có dữ liệu
                </TableCell>
              </TableRow>
            ) : (
              users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">
                    {user.name ?? "-"}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {user.email ?? "-"}
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={user.status} />
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {timeAgo(user.updatedAt ?? user.createdAt)}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 rounded-xl"
                          aria-label={`Mở hành động cho ${user.name ?? "user"}`}
                        >
                          <MoreHorizontal className="size-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-52">
                        <DropdownMenuItem asChild>
                          <Link href="/admin/user-management">
                            <Users className="mr-2 h-4 w-4" />
                            Quản lý người dùng
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem onSelect={() => copyEmail(user.email)}>
                          <Copy className="mr-2 h-4 w-4" />
                          Sao chép email
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link href={`/admin/user-management?focus=${user.id}`}>
                            <ExternalLink className="mr-2 h-4 w-4" />
                            Mở tài khoản này
                          </Link>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </Card>
  );
}
