"use client";

import {
  CheckCircle2,
  Shield,
  Users,
  Settings2,
  FileSearch,
  Plus,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const permissions = [
  {
    title: "Quản trị Toàn diện",
    description: "Toàn quyền cấu hình, giám sát và kiểm soát hệ thống.",
    icon: Shield,
    tags: ["SYSTEM_ROOT", "AUTH_WRITE"],
  },
  {
    title: "Quản lý Người dùng",
    description: "Quản lý tài khoản, phân quyền và trạng thái người dùng.",
    icon: Users,
    tags: ["USER_DELETE", "MOD_AUDIT"],
  },
  {
    title: "Cấu hình Hệ thống",
    description: "Thiết lập biến môi trường, API key và cấu hình hệ thống.",
    icon: Settings2,
    tags: ["ENV_EDIT", "API_KEY_MGMT"],
  },
  {
    title: "Logs & Audit",
    description: "Xem lịch sử thao tác và nhật ký hoạt động hệ thống.",
    icon: FileSearch,
    tags: ["AUDIT_VIEW", "LOG_EXPORT"],
  },
];

export function AdminPermissionsCard() {
  return (
    <Card className="rounded-3xl border-border/60 shadow-sm">
      <CardContent className="p-6">
        <div className="mb-5 flex items-center justify-between gap-4">
          <div>
            <h3 className="text-xl font-semibold tracking-tight">
              Quyền hạn & Truy cập
            </h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Các nhóm quyền hiện có cho tài khoản quản trị này.
            </p>
          </div>

          <Button variant="outline" className="rounded-2xl">
            <Plus className="mr-2 h-4 w-4" />
            Yêu cầu quyền mới
          </Button>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {permissions.map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.title}
                className="rounded-2xl border border-border/60 bg-muted/20 p-4 transition-all hover:bg-muted/30"
              >
                <div className="flex items-start gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                    <Icon className="h-5 w-5" />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium">{item.title}</h4>
                      <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                    </div>
                    <p className="mt-1 text-sm leading-6 text-muted-foreground">
                      {item.description}
                    </p>

                    <div className="mt-3 flex flex-wrap gap-2">
                      {item.tags.map((tag) => (
                        <Badge
                          key={tag}
                          variant="secondary"
                          className="rounded-full"
                        >
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
