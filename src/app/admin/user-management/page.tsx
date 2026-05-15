"use client";

import { useCallback, useEffect, useState } from "react";
import { Plus, Edit, Trash2, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { getRoleLabel } from "@/features/explore/exploreRules.mjs";

type UserRow = {
  id: string;
  name: string | null;
  email: string | null;
  role: string | null;
  plan?: string | null;
  status?: "Active" | "Pending" | "Banned" | "Inactive";
  createdAt?: string | null;
  lastActiveAt?: string | null;
};

type UsersPagination = {
  page: number;
  pageSize: number;
  total: number;
};

const userRoleOptions = ["user", "pro", "recruiter", "admin"] as const;
const pageSize = 20;

export default function AdminUserManagementPage() {
  const [users, setUsers] = useState<UserRow[] | null>(null);
  const [pagination, setPagination] = useState<UsersPagination | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [focusedUserId, setFocusedUserId] = useState<string | null>(null);
  const [selected, setSelected] = useState<UserRow | null>(null);
  const [showEdit, setShowEdit] = useState(false);
  const [showAdd, setShowAdd] = useState(false);

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
  }, [page, query]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const totalPages =
    pagination != null ? Math.max(1, Math.ceil(pagination.total / pageSize)) : 1;
  const pageNumbers = Array.from({ length: totalPages }, (_, index) => index + 1);

  async function handleDelete(id: string) {
    if (!confirm("Xác nhận xóa người dùng này?")) return;

    try {
      const res = await fetch(`/api/admin/users/${id}`, { method: "DELETE" });
      if (res.ok) fetchUsers();
      else console.error("Delete failed", await res.text());
    } catch (err) {
      console.error(err);
    }
  }

  return (
    <div className="space-y-6">
      <section className="flex items-start justify-between gap-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Quản lý người dùng
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Quản lý người dùng, xem vai trò và theo dõi hoạt động.
            {pagination ? ` Đang hiển thị ${users?.length ?? 0}/${pagination.total} người dùng.` : ""}
          </p>
          {errorMessage && (
            <p className="mt-2 text-sm font-medium text-destructive">
              {errorMessage}
            </p>
          )}
        </div>

        <div className="flex items-center gap-3">
          <Input
            placeholder="Tìm theo tên, email hoặc ID..."
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setPage(1);
            }}
            className="w-80"
          />

          <Dialog open={showAdd} onOpenChange={setShowAdd}>
            <DialogTrigger asChild>
              <Button className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Thêm người dùng mới
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-lg">
              <UserForm
                initial={null}
                onSuccess={() => {
                  setShowAdd(false);
                  fetchUsers();
                }}
              />
            </DialogContent>
          </Dialog>
        </div>
      </section>

      <section>
        <Card className="rounded-2xl">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[800px] table-auto text-left">
                <thead>
                  <tr className="text-sm text-muted-foreground">
                    <th className="px-6 py-4">Người dùng</th>
                    <th className="px-6 py-4">Email</th>
                    <th className="px-6 py-4">Vai trò</th>
                    <th className="px-6 py-4">Gói dịch vụ</th>
                    <th className="px-6 py-4">Ngày tham gia</th>
                    <th className="px-6 py-4">Gần nhất</th>
                    <th className="px-6 py-4">Trạng thái</th>
                    <th className="px-6 py-4">Thao tác</th>
                  </tr>
                </thead>

                <tbody>
                  {loading && (
                    <tr>
                      <td
                        colSpan={8}
                        className="px-6 py-8 text-center text-sm text-muted-foreground"
                      >
                        Đang tải...
                      </td>
                    </tr>
                  )}

                  {!loading && (users?.length ?? 0) === 0 && (
                    <tr>
                      <td
                        colSpan={8}
                        className="px-6 py-8 text-center text-sm text-muted-foreground"
                      >
                        Không tìm thấy người dùng
                      </td>
                    </tr>
                  )}

                  {!loading &&
                    users?.map((u) => {
                      const isFocused = focusedUserId === u.id;

                      return (
                        <tr
                          key={u.id}
                          className={`border-t ${isFocused ? "bg-primary/5 ring-1 ring-inset ring-primary/20" : ""}`}
                        >
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <Avatar className="h-9 w-9">
                              <AvatarFallback className="bg-slate-100 text-sm text-muted-foreground">
                                {(u.name ?? "U")
                                  .split(" ")
                                  .map((s) => s[0])
                                  .slice(0, 2)
                                  .join("")}
                              </AvatarFallback>
                            </Avatar>

                            <div>
                              <div className="font-medium">{u.name ?? "—"}</div>
                              <div className="text-xs text-muted-foreground">
                                ID: {u.id}
                              </div>
                            </div>
                          </div>
                        </td>

                        <td className="px-6 py-4">{u.email ?? "—"}</td>

                        <td className="px-6 py-4">
                          <Badge variant="secondary">{getRoleLabel(u.role ?? "user")}</Badge>
                        </td>

                        <td className="px-6 py-4">{u.plan ?? "—"}</td>

                        <td className="px-6 py-4 text-sm text-muted-foreground">
                          {u.createdAt
                            ? new Date(u.createdAt).toLocaleDateString()
                            : "—"}
                        </td>

                        <td className="px-6 py-4 text-sm text-muted-foreground">
                          {u.lastActiveAt
                            ? new Date(u.lastActiveAt).toLocaleString("vi-VN")
                            : "—"}
                        </td>

                        <td className="px-6 py-4">
                          <StatusBadge status={u.status} />
                        </td>

                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
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
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    setSelected(u);
                                    setShowEdit(true);
                                  }}
                                  className="flex items-center gap-2"
                                >
                                  <Edit className="h-4 w-4" />
                                  <span className="hidden sm:inline">
                                    Chỉnh sửa
                                  </span>
                                </Button>
                              </DialogTrigger>

                              <DialogContent className="sm:max-w-lg">
                                <UserForm
                                  initial={u}
                                  onSuccess={() => {
                                    setShowEdit(false);
                                    setSelected(null);
                                    fetchUsers();
                                  }}
                                />
                              </DialogContent>
                            </Dialog>

                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDelete(u.id)}
                              className="flex items-center gap-2 text-red-600"
                            >
                              <Trash2 className="h-4 w-4" />
                              <span className="hidden sm:inline">Xóa</span>
                            </Button>
                          </div>
                        </td>
                        </tr>
                      );
                    })}
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
              onClick={() => setPage((value) => Math.max(1, value - 1))}
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
                className="min-w-9"
              >
                {pageNumber}
              </Button>
            ))}

            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages || loading}
              onClick={() => setPage((value) => Math.min(totalPages, value + 1))}
            >
              Sau
              <ChevronRight className="ml-1 size-4" />
            </Button>
          </div>
        )}
      </section>
    </div>
  );
}

function StatusBadge({ status }: { status?: string | null }) {
  const k = status ?? "Inactive";
  const cls =
    k === "Active"
      ? "bg-green-100 text-green-700"
      : k === "Pending"
        ? "bg-yellow-100 text-yellow-700"
        : k === "Banned"
          ? "bg-red-100 text-red-700"
          : "bg-gray-100 text-muted-foreground";

  return (
    <span
      className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${cls}`}
    >
      {k}
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
        <h3 className="text-lg font-semibold">
          {initial ? "Chỉnh sửa người dùng" : "Thêm người dùng mới"}
        </h3>
        <p className="text-sm text-muted-foreground">
          Cập nhật thông tin tài khoản, vai trò và mật khẩu đăng nhập custom auth.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-3">
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Họ và tên"
          required
        />

        <Input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email"
          required
        />

        <label className="grid gap-1 text-sm">
          <span className="text-muted-foreground">Vai trò</span>
          <select
            value={role}
            onChange={(e) => setRole(e.target.value)}
            className="h-10 rounded-md border border-input bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
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
        />

        <div className="flex justify-end gap-2 pt-2">
          <Button variant="ghost" type="button" onClick={() => onSuccess?.()}>
            Hủy
          </Button>
          <Button type="submit" disabled={loading}>
            {initial ? "Lưu thay đổi" : "Tạo người dùng"}
          </Button>
        </div>
      </div>
    </form>
  );
}
