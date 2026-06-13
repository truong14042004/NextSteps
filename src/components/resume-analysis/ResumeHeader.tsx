"use client";

import { SparklesIcon, MicIcon, CheckCircle2Icon, BriefcaseIcon, FileTextIcon, TargetIcon, BrainIcon } from "lucide-react";

export function ResumeHeader() {
  return (
    <section className="relative overflow-hidden rounded-[24px] border border-slate-200 dark:border-slate-800 bg-gradient-to-br from-rose-50/30 via-purple-50/30 to-indigo-50/40 p-6 shadow-xs dark:from-card dark:via-primary/5 dark:to-secondary/5 md:p-8">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(244,63,94,0.05),transparent_40%),radial-gradient(circle_at_bottom_left,rgba(99,102,241,0.05),transparent_40%)]" />

      <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
        <div className="max-w-3xl space-y-4">
          <div className="inline-flex items-center gap-1.5 rounded-full border border-rose-200 bg-rose-50/50 px-2.5 py-0.5 text-xs font-semibold text-rose-600 dark:border-rose-900/30 dark:bg-rose-950/20">
            <SparklesIcon className="size-3.5 animate-pulse" />
            AI Career Coach
          </div>

          <h1 className="text-3xl font-bold tracking-tight text-foreground md:text-4xl">
            Phân tích CV & Job Description
          </h1>

          <p className="max-w-2xl text-xs md:text-sm leading-relaxed text-slate-600 dark:text-slate-400">
            Đánh giá cấu trúc ATS, độ tương thích kỹ năng và nhận đề xuất cải thiện cá nhân hóa từ AI Career Coach.
          </p>

          <div className="flex flex-wrap gap-2 pt-1">
            <span className="bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400 hover:brightness-105 hover:shadow-xs transition-all duration-200 rounded-full px-2.5 py-0.5 text-xs font-semibold inline-flex items-center gap-1 cursor-default">
              <CheckCircle2Icon className="size-3.5" />
              ATS Analysis
            </span>
            <span className="bg-blue-50 text-blue-700 dark:bg-blue-950/20 dark:text-blue-400 hover:brightness-105 hover:shadow-xs transition-all duration-200 rounded-full px-2.5 py-0.5 text-xs font-semibold inline-flex items-center gap-1 cursor-default">
              <TargetIcon className="size-3.5" />
              CV Matching
            </span>
            <span className="bg-purple-50 text-purple-700 dark:bg-purple-950/20 dark:text-purple-400 hover:brightness-105 hover:shadow-xs transition-all duration-200 rounded-full px-2.5 py-0.5 text-xs font-semibold inline-flex items-center gap-1 cursor-default">
              <BrainIcon className="size-3.5" />
              AI Feedback
            </span>
            <span className="bg-amber-50 text-amber-700 dark:bg-amber-950/20 dark:text-amber-400 hover:brightness-105 hover:shadow-xs transition-all duration-200 rounded-full px-2.5 py-0.5 text-xs font-semibold inline-flex items-center gap-1 cursor-default">
              <SparklesIcon className="size-3.5" />
              Career Coach
            </span>
          </div>
        </div>

        {/* Desktop Visual Element */}
        <div className="hidden lg:flex items-center justify-center pr-4 shrink-0">
          <div className="relative flex size-24 items-center justify-center rounded-[24px] bg-gradient-to-br from-rose-500/10 via-purple-500/10 to-indigo-500/10 p-1 shadow-inner ring-8 ring-white/50 dark:ring-card/50">
            <div className="absolute inset-0 animate-ping rounded-[24px] bg-rose-500/5 opacity-50" />
            <div className="flex size-full items-center justify-center rounded-[20px] bg-white shadow dark:bg-card">
              <FileTextIcon className="size-10 text-primary" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
