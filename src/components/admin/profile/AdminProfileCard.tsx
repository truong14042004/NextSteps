"use client";

import { User as UserIcon } from "lucide-react";
import Link from "next/link";
import { Camera, LogOut, Mail, PencilLine, Shield } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export function AdminProfileCard({
  user,
}: {
  user: { name: string; imageUrl?: string };
}) {
  return (
    <Card className="overflow-hidden rounded-3xl border-border/60 shadow-sm">
      <CardContent className="p-0">
        <div className="h-28 bg-gradient-to-r from-primary/12 via-primary/5 to-transparent" />

        <div className="px-6 pb-6">
          <div className="-mt-12 flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
              {/* avatar replaced with icon placeholder */}
              <Link
                href="/admin/profile/edit"
                className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-3xl border-4 border-background bg-muted shadow-sm"
                aria-label="Edit profile"
              >
                <div className="flex items-center justify-center rounded-full p-3">
                  <UserIcon className="h-10 w-10 text-muted-foreground" />
                </div>
              </Link>

              <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-3">
                  <h2 className="text-2xl font-semibold tracking-tight">
                    {user.name}
                  </h2>
                  <Badge className="rounded-full bg-primary/10 px-3 py-1 text-primary hover:bg-primary/10">
                    Super Administrator
                  </Badge>
                </div>

                <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
                  Chịu trách nhiệm vận hành, giám sát bảo mật và quản lý toàn bộ
                  hạ tầng hệ thống NextStep.
                </p>

                <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                  <span className="inline-flex items-center gap-2">
                    <Shield className="h-4 w-4 text-primary" />
                    Admin ID:{" "}
                    <span className="font-medium text-foreground">
                      #NS-8842-ADMIN
                    </span>
                  </span>
                  <span className="inline-flex items-center gap-2">
                    <Mail className="h-4 w-4 text-primary" />
                    tuan.nguyen@example.com
                  </span>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <Link href="/admin/profile/edit">
                <Button className="rounded-2xl shadow-sm">
                  <PencilLine className="mr-2 h-4 w-4" />
                  Chỉnh sửa hồ sơ
                </Button>
              </Link>

              <Link href="/admin/profile/change-password">
                <Button variant="outline" className="rounded-2xl">
                  Đổi mật khẩu
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
