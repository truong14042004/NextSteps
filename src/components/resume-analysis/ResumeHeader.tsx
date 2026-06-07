"use client";

import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import {
  ClockIcon,
  CheckCircle2Icon,
  SparklesIcon,
  ZapIcon,
} from "lucide-react";
import type { UsageInfo } from "@/components/resume-analysis/types";

function getUsagePercent(usage: UsageInfo) {
  return usage.total != null && usage.total > 0
    ? Math.min((usage.used / usage.total) * 100, 100)
    : 100;
}

function formatUsageCount(value: number | null) {
  return value == null ? "Không giới hạn" : value.toLocaleString("vi-VN");
}

export function ResumeHeader({ usage }: { usage: UsageInfo }) {
  return (
    <header className="relative overflow-hidden rounded-2xl border border-border bg-card/80 p-6 shadow-sm backdrop-blur md:p-8">
      <div className="absolute right-0 top-0 -mr-16 -mt-16 size-56 rounded-full bg-gradient-to-br from-primary/10 via-primary/5 to-transparent blur-3xl pointer-events-none" />

      <div className="relative flex flex-col gap-6 xl:flex-row xl:items-center xl:justify-between">
        <div className="max-w-3xl space-y-4">
          <Badge className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/10 px-3.5 py-1 text-xs font-semibold text-primary">
            <SparklesIcon className="size-3.5 animate-pulse" />
            AI Careers Workspace
          </Badge>

          <div className="space-y-2">
            <h1 className="text-3xl font-bold tracking-tight text-foreground md:text-4xl">
              Phân tích CV với{" "}
              <span className="bg-gradient-to-r from-primary to-orange-500 bg-clip-text text-transparent">
                Trí Tuệ Nhân Tạo
              </span>
            </h1>
            <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground md:text-base">
              Tải lên CV và đối chiếu trực tiếp với Job Description để phát hiện
              khoảng trống kỹ năng, chuẩn ATS và gợi ý cải thiện rõ ràng.
            </p>
          </div>

          <div className="flex flex-wrap gap-3 text-xs font-medium text-muted-foreground">
            <div className="flex items-center gap-1.5 rounded-xl bg-muted px-3 py-1.5">
              <CheckCircle2Icon className="size-3.5 text-emerald-500" />
              Đã thực hiện:{" "}
              <span className="font-bold text-foreground">
                {usage.used} lượt
              </span>
            </div>
            <div className="flex items-center gap-1.5 rounded-xl bg-muted px-3 py-1.5">
              <ClockIcon className="size-3.5 text-primary" />
              Thời gian phân tích:{" "}
              <span className="font-bold text-foreground">~15 giây</span>
            </div>
          </div>
        </div>

        <Card className="w-full max-w-sm rounded-2xl border-border shadow-sm xl:w-80">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
                Gói hiện tại: {usage.planName}
              </span>
              <ZapIcon className="size-4 text-primary fill-primary/15" />
            </div>

            <div className="mt-2 flex items-baseline gap-1">
              <span className="text-3xl font-black text-foreground">
                {formatUsageCount(usage.remaining)}
              </span>
              <span className="text-xs font-medium text-muted-foreground">
                / {formatUsageCount(usage.total)} lượt còn lại
              </span>
            </div>

            <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-primary transition-all duration-500"
                style={{ width: `${getUsagePercent(usage)}%` }}
              />
            </div>

            <div className="mt-4 flex items-center justify-between text-xs">
              <Button
                asChild
                variant="link"
                className={cn("h-auto p-0 text-primary")}
              >
                <Link href="/#pricing">Nâng cấp / Mua thêm</Link>
              </Button>
              <span className="text-muted-foreground">{usage.resetText}</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </header>
  );
}
