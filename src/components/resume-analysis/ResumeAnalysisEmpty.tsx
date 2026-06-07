"use client";

import { Card, CardContent } from "@/components/ui/card";
import { LightbulbIcon, SparklesIcon } from "lucide-react";

export function ResumeAnalysisEmpty() {
  return (
    <Card className="rounded-2xl border-border shadow-sm">
      <CardContent className="space-y-4 p-6">
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-primary/10 p-2.5 text-primary">
            <SparklesIcon className="size-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-foreground">
              Kết quả phân tích sẽ hiển thị ở đây
            </h3>
            <p className="text-xs text-muted-foreground">
              Sau khi bạn gửi CV và JD, hệ thống sẽ trả về báo cáo ATS, điểm
              khớp và gợi ý cải thiện.
            </p>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-muted/30 p-4 text-sm text-muted-foreground">
          <div className="flex items-start gap-3">
            <LightbulbIcon className="mt-0.5 size-4 shrink-0 text-primary" />
            <p>
              Mẹo: dán JD đầy đủ mô tả, yêu cầu kỹ năng và trách nhiệm để AI so
              khớp chính xác hơn.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
