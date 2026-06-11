"use client";

import { SparklesIcon, MicIcon, CheckCircle2Icon, BriefcaseIcon, FileTextIcon, TargetIcon, BrainIcon } from "lucide-react";

export function ResumeHeader() {
  return (
    <section className="relative overflow-hidden rounded-[32px] border border-primary/10 bg-gradient-to-br from-white via-red-50/20 to-violet-50/30 p-6 shadow-sm dark:from-card dark:via-primary/5 dark:to-secondary/5 md:p-8">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(179,0,0,0.05),transparent_40%),radial-gradient(circle_at_bottom_left,rgba(124,58,237,0.05),transparent_40%)]" />

      <div className="relative flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
        <div className="max-w-3xl space-y-4">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/15 bg-primary/5 px-3 py-1.5 text-xs font-semibold text-primary">
            <SparklesIcon className="size-3.5 animate-pulse" />
            AI Career Coach
          </div>

          <h1 className="text-3xl font-bold tracking-tight text-foreground md:text-5xl">
            Phân tích CV & Job Description
          </h1>

          <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground md:text-base">
            Đánh giá cấu trúc ATS, độ tương thích kỹ năng và nhận đề xuất cải thiện cá nhân hóa từ AI Career Coach.
          </p>

          <div className="flex flex-wrap gap-2 pt-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3.5 py-1.5 text-xs font-medium text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400">
              <CheckCircle2Icon className="size-3.5" />
              ATS Analysis
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-3.5 py-1.5 text-xs font-medium text-blue-700 dark:bg-blue-950/30 dark:text-blue-400">
              <TargetIcon className="size-3.5" />
              CV Matching
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-violet-50 px-3.5 py-1.5 text-xs font-medium text-violet-700 dark:bg-violet-950/30 dark:text-violet-400">
              <BrainIcon className="size-3.5" />
              AI Feedback
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-3.5 py-1.5 text-xs font-medium text-amber-700 dark:bg-amber-950/30 dark:text-amber-400">
              <SparklesIcon className="size-3.5" />
              Career Coach
            </span>
          </div>
        </div>

        {/* Desktop Visual Element */}
        <div className="hidden lg:flex items-center justify-center pr-4">
          <div className="relative flex size-32 items-center justify-center rounded-[28px] bg-gradient-to-br from-primary/10 to-violet-500/20 p-1 shadow-inner ring-8 ring-white/50 dark:ring-card/50">
            <div className="absolute inset-0 animate-ping rounded-[28px] bg-primary/5 opacity-50" />
            <div className="flex size-full items-center justify-center rounded-[24px] bg-white shadow dark:bg-card">
              <FileTextIcon className="size-12 text-primary animate-pulse" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
