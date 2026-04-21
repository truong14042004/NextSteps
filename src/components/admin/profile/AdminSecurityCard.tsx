"use client";

import React from "react";
import Link from "next/link";
import {
  ChevronRight,
  KeyRound,
  Mail,
  ShieldCheck,
  Smartphone,
  TriangleAlert,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

function SecurityItem({
  icon: Icon,
  title,
  description,
  extra,
  actionLabel,
  href,
  tone = "default",
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  extra?: React.ReactNode;
  actionLabel: string;
  href: string;
  tone?: "default" | "warning";
}) {
  return (
    <div
      className={`rounded-2xl border p-4 ${
        tone === "warning"
          ? "border-red-200 bg-red-50/60"
          : "border-border/60 bg-background"
      }`}
    >
      <div className="flex items-start gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <Icon className="h-5 w-5" />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h4 className="font-medium">{title}</h4>
            {extra}
          </div>
          <p className="mt-1 text-sm leading-6 text-muted-foreground">
            {description}
          </p>
        </div>

        <Link href={href}>
          <Button variant="ghost" size="icon" className="rounded-xl">
            <ChevronRight className="h-4 w-4" />
          </Button>
        </Link>
      </div>

      <div className="mt-4">
        <Link href={href}>
          <Button
            variant={tone === "warning" ? "destructive" : "outline"}
            className="rounded-2xl"
          >
            {actionLabel}
          </Button>
        </Link>
      </div>
    </div>
  );
}

export function AdminSecurityCard() {
  return (
    <Card className="rounded-3xl border-border/60 shadow-sm">
      <CardContent className="p-6">
        <div className="mb-5">
          <h3 className="text-xl font-semibold tracking-tight">
            Bảo mật hệ thống
          </h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Theo dõi xác thực, khôi phục tài khoản và trạng thái mật khẩu.
          </p>
        </div>

        <div className="space-y-4">
          <SecurityItem
            icon={ShieldCheck}
            title="Xác thực 2 lớp (2FA)"
            description="Đã bật bằng Google Authenticator để tăng cường bảo mật đăng nhập."
            actionLabel="Cấu hình 2FA"
            href="/admin/profile/security/2fa"
            extra={
              <Badge className="rounded-full bg-primary/10 text-primary hover:bg-primary/10">
                Đang bật
              </Badge>
            }
          />

          <SecurityItem
            icon={Mail}
            title="Email khôi phục"
            description="m.tuan.backup@corp.com"
            actionLabel="Thay đổi email"
            href="/admin/profile/edit"
          />

          <SecurityItem
            icon={Smartphone}
            title="Số điện thoại bảo mật"
            description="(+84) ••• ••• 8842"
            actionLabel="Xác thực lại"
            href="/admin/profile/security/phone"
          />

          <SecurityItem
            icon={KeyRound}
            title="Mật khẩu tài khoản"
            description="Lần thay đổi gần nhất cách đây 45 ngày. Nên cập nhật định kỳ để đảm bảo an toàn."
            actionLabel="Đổi mật khẩu"
            href="/admin/profile/change-password"
            tone="warning"
            extra={
              <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2.5 py-1 text-xs font-medium text-red-700">
                <TriangleAlert className="h-3.5 w-3.5" />
                Cần chú ý
              </span>
            }
          />
        </div>
      </CardContent>
    </Card>
  );
}
