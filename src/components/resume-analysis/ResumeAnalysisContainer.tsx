"use client";

import type { DeepPartial } from "ai";
import { aiAnalyzeSchema } from "@/services/ai/resumes/schemas";
import type { z } from "zod";
import { ResumeAnalysisResult } from "@/components/resume-analysis/ResumeAnalysisResult";
import { SparklesIcon } from "lucide-react";

export function ResumeAnalysisContainer({
  aiAnalysis,
  jobInfoId,
}: {
  aiAnalysis: DeepPartial<z.infer<typeof aiAnalyzeSchema>> | undefined;
  jobInfoId?: string | null;
}) {
  // Only render this section when there is something to show
  if (!aiAnalysis) return null;

  return (
    <section className="rounded-2xl border border-border bg-card p-6 shadow-sm md:p-8">
      <div className="mb-6 flex items-start gap-4">
        <div className="rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-500 p-2.5 text-white shadow-md shadow-emerald-500/10">
          <SparklesIcon className="size-5" />
        </div>
        <div>
          <h2 className="text-xl font-bold tracking-tight text-foreground">
            Báo cáo đánh giá & So khớp chi tiết
          </h2>
          <p className="mt-1 text-xs text-muted-foreground">
            Báo cáo phân tích chuyên sâu các yếu tố cấu trúc ATS và mức độ
            tương thích kỹ năng với JD.
          </p>
        </div>
      </div>

      <ResumeAnalysisResult
        aiAnalysis={aiAnalysis}
        isLoading={false}
        jobInfoId={jobInfoId}
      />
    </section>
  );
}
