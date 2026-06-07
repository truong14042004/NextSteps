"use client";

import { Badge } from "@/components/ui/badge";
import { INDUSTRY_KEYWORDS } from "./constants";

export function ResumeKeywordsCard({
  industry,
  industryLabel,
  industryKeywords,
}: {
  industry?: string | null;
  industryLabel?: string | null;
  industryKeywords?: string[];
}) {
  const keywords = industryKeywords ?? INDUSTRY_KEYWORDS[industry ?? "other"];

  return (
    <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <h3 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-foreground">
          Từ khóa ATS Khuyên dùng
        </h3>
        <Badge className="border border-emerald-200 bg-emerald-50 text-[10px] text-emerald-700 hover:bg-emerald-100">
          {industryLabel ?? "Kỹ năng"}
        </Badge>
      </div>

      <p className="mt-1 text-[10px] text-muted-foreground">
        Thêm các từ khóa chuyên môn này vào CV nếu bạn có để gia tăng điểm lọc
        hồ sơ ATS.
      </p>

      <div className="mt-3.5 flex flex-wrap gap-1.5">
        {keywords.map((keyword) => (
          <span
            key={keyword}
            className="inline-block cursor-default rounded-md border border-border bg-muted px-2 py-1 text-[10px] font-semibold text-muted-foreground transition-colors hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700"
          >
            {keyword}
          </span>
        ))}
      </div>
    </div>
  );
}
