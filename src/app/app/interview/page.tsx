"use client";

import { useEffect, useState, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { getJobInfoForClient } from "@/features/jobInfos/actions";
import {
  SparklesIcon,
  HistoryIcon,
  PlusCircleIcon,
  MessageSquareTextIcon,
  BriefcaseIcon,
  AudioLinesIcon,
  CheckCircle2Icon,
  WandSparklesIcon,
  TargetIcon,
  FlameIcon,
  TrophyIcon,
  ActivityIcon,
  LightbulbIcon,
  CheckIcon,
  MicIcon,
  CompassIcon
} from "lucide-react";
import { cn } from "@/lib/utils";
import { PreviousAnalysisOption } from "./_PreviousAnalysisOption";
import { QuickInterviewOption } from "./_QuickInterviewOption";
import { VapiInterviewCall } from "./_VapiInterviewCall";

export type InterviewJobInfo = {
  id: string;
  title: string;
  name: string;
  experienceLevel: string;
  description: string;
  cvSummary?: string;
  analysisResult?: string | null;
};

type SourceMode = "previous" | "new";

type UsageInfo = {
  used: number;
  total: number | null;
  remaining: number | null;
  planName: string;
  resetText: string;
};


const defaultUsage: UsageInfo = {
  used: 0,
  total: 0,
  remaining: 0,
  planName: "Free",
  resetText: "Đang tải...",
};


type InterviewStats = {
  latestScore: number | null;
  pacingScore: number | null;
  streakDays: number;
};


function getUsagePercent(usage: UsageInfo) {
  return usage.total != null && usage.total > 0
    ? Math.min((usage.used / usage.total) * 100, 100)
    : 100;
}

function formatUsageCount(value: number | null) {
  return value == null ? "Khong gioi han" : value.toLocaleString("vi-VN");
}

function InterviewPageContent() {
  const [selectedJobInfo, setSelectedJobInfo] =
    useState<InterviewJobInfo | null>(null);
  const [sourceMode, setSourceMode] = useState<SourceMode>("previous");
  const [usage, setUsage] = useState<UsageInfo>(defaultUsage);
  const [stats, setStats] = useState<any>(null);
  const searchParams = useSearchParams();

  useEffect(() => {
    const jobId = searchParams.get("jobId");
    if (jobId) {
      getJobInfoForClient(jobId).then((job) => {
        if (job) {
          setSelectedJobInfo({
            id: job.id,
            title: job.title || "",
            name: job.name,
            experienceLevel: job.experienceLevel,
            description: job.description,
          });
        }
      });
    }
  }, [searchParams]);

  const percent = getUsagePercent(usage);

  useEffect(() => {
    let ignore = false;

    async function loadUsage() {
      const response = await fetch("/api/user/usage?feature=mock_interview", {
        cache: "no-store",
      });
      if (!response.ok) return;

      const data = (await response.json()) as { usage?: UsageInfo | null };
      if (!ignore && data.usage != null) setUsage(data.usage);
    }

    async function loadStats() {
      try {
        const response = await fetch("/api/user/interview-stats", {
          cache: "no-store",
        });
        if (!response.ok) return;
        const data = await response.json();
        if (!ignore) setStats(data);
      } catch (err) {
        console.error("Failed to load interview stats", err);
      }
    }

    loadUsage();
    loadStats();
    return () => {
      ignore = true;
    };
  }, []);

  if (selectedJobInfo) {
    return (
      <VapiInterviewCall
        jobInfo={selectedJobInfo}
        onBack={() => setSelectedJobInfo(null)}
      />
    );
  }

  // Derived pacing status
  const getPacingText = () => {
    if (!stats) return "Đang tải...";
    if (stats.pacingScore === null) {
      if (usage.used === 0) return "Chưa bắt đầu";
      return "Đang đánh giá";
    }
    if (stats.pacingScore >= 85) return "Xuất sắc";
    if (stats.pacingScore >= 70) return "Tốt";
    if (stats.pacingScore >= 50) return "Tạm ổn";
    return "Cần rèn luyện";
  };

  const getPacingSubtitle = () => {
    if (!stats) return "Đang tải dữ liệu...";
    if (stats.pacingScore === null) {
      return "Luyện tập để đo phản xạ";
    }
    if (stats.pacingScore >= 85) return "Tốc độ trả lời rất tốt";
    if (stats.pacingScore >= 70) return "Nhịp độ & phản xạ ổn định";
    if (stats.pacingScore >= 50) return "Đang tiến bộ tốt";
    return "Hãy tập trung luyện thêm";
  };

  return (
    <div className="container my-6 space-y-8 max-w-6xl">

      {/* Hero Section */}
      <section className="relative overflow-hidden rounded-[32px] border border-primary/10 bg-gradient-to-br from-white via-red-50/20 to-violet-50/30 p-6 shadow-sm dark:from-card dark:via-primary/5 dark:to-secondary/5 md:p-8">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(179,0,0,0.05),transparent_40%),radial-gradient(circle_at_bottom_left,rgba(124,58,237,0.05),transparent_40%)]" />

        <div className="relative flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-3xl space-y-4">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/15 bg-primary/5 px-3 py-1.5 text-xs font-semibold text-primary">
              <SparklesIcon className="size-3.5 animate-pulse" />
              AI Mock Interview
            </div>

            <h1 className="text-3xl font-bold tracking-tight text-foreground md:text-5xl">
              Phỏng vấn với AI
            </h1>

            <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground md:text-base">
              Luyện phỏng vấn thực tế với AI, nhận câu hỏi sát vị trí ứng tuyển và feedback chi tiết sau từng buổi luyện tập. Trải nghiệm mô phỏng phòng phỏng vấn sinh động ngay tại nhà.
            </p>

            <div className="flex flex-wrap gap-2 pt-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3.5 py-1.5 text-xs font-medium text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400">
                <MicIcon className="size-3.5" />
                Voice interview
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-3.5 py-1.5 text-xs font-medium text-blue-700 dark:bg-blue-950/30 dark:text-blue-400">
                <CheckCircle2Icon className="size-3.5" />
                Feedback chi tiết
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-violet-50 px-3.5 py-1.5 text-xs font-medium text-violet-700 dark:bg-violet-950/30 dark:text-violet-400">
                <BriefcaseIcon className="size-3.5" />
                Câu hỏi theo CV/JD
              </span>
            </div>
          </div>

          {/* Desktop Visual Element */}
          <div className="hidden lg:flex items-center justify-center pr-4">
            <div className="relative flex size-32 items-center justify-center rounded-[28px] bg-gradient-to-br from-primary/10 to-violet-500/20 p-1 shadow-inner ring-8 ring-white/50 dark:ring-card/50">
              <div className="absolute inset-0 animate-ping rounded-[28px] bg-primary/5 opacity-50" />
              <div className="flex size-full items-center justify-center rounded-[24px] bg-white shadow dark:bg-card">
                <AudioLinesIcon className="size-12 text-primary animate-pulse" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Progress / Practice Summary Section */}
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Card 1: Buổi phỏng vấn */}
        <div className="group rounded-2xl border border-slate-100 bg-white p-5 shadow-xs transition-all duration-300 hover:-translate-y-1 hover:shadow-md dark:border-border/60 dark:bg-card">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-muted-foreground">Buổi phỏng vấn</span>
            <div className="flex size-9 items-center justify-center rounded-xl bg-primary/5 text-primary">
              <TrophyIcon className="size-4.5" />
            </div>
          </div>
          <div className="mt-4">
            <span className="text-2xl font-bold text-foreground">{usage.used || 0}</span>
            <span className="ml-1.5 text-xs text-muted-foreground">đã hoàn thành</span>
          </div>
          <div className="mt-3.5 h-1.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-muted">
            <div
              className="h-full rounded-full bg-primary transition-all duration-500"
              style={{ width: `${Math.min(((usage.used || 0) / 10) * 100, 100)}%` }}
            />
          </div>
        </div>

        {/* Card 2: Điểm gần nhất */}
        <div className="group rounded-2xl border border-slate-100 bg-white p-5 shadow-xs transition-all duration-300 hover:-translate-y-1 hover:shadow-md dark:border-border/60 dark:bg-card">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-muted-foreground">Điểm gần nhất</span>
            <div className="flex size-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/20 dark:text-emerald-400">
              <TargetIcon className="size-4.5" />
            </div>
          </div>
          <div className="mt-4">
            <span className="text-2xl font-bold text-foreground">
              {stats?.latestScore != null ? `${stats.latestScore}/100` : "--"}
            </span>
            <span className="ml-1.5 text-xs text-muted-foreground">
              {stats?.latestScore != null
                ? stats.latestScore >= 90
                  ? "Đạt mục tiêu 🎉"
                  : "Mục tiêu: >90"
                : "Chưa có đánh giá"}
            </span>
          </div>
          <div className="mt-3.5 h-1.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-muted">
            <div
              className="h-full rounded-full bg-emerald-500 transition-all duration-500"
              style={{ width: `${stats?.latestScore ?? 0}%` }}
            />
          </div>
        </div>

        {/* Card 3: Phản xạ trả lời */}
        <div className="group rounded-2xl border border-slate-100 bg-white p-5 shadow-xs transition-all duration-300 hover:-translate-y-1 hover:shadow-md dark:border-border/60 dark:bg-card">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-muted-foreground">Phản xạ trả lời</span>
            <div className="flex size-9 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950/20 dark:text-blue-400">
              <ActivityIcon className="size-4.5" />
            </div>
          </div>
          <div className="mt-4">
            <span className="text-2xl font-bold text-foreground">{getPacingText()}</span>
            <span className="ml-1.5 text-xs text-muted-foreground">{getPacingSubtitle()}</span>
          </div>
          <div className="mt-3.5 h-1.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-muted">
            <div
              className="h-full rounded-full bg-blue-500 transition-all duration-500"
              style={{ width: `${stats?.pacingScore ?? (stats?.latestScore ?? 0)}%` }}
            />
          </div>
        </div>

        {/* Card 4: Streak luyện tập */}
        <div className="group rounded-2xl border border-slate-100 bg-white p-5 shadow-xs transition-all duration-300 hover:-translate-y-1 hover:shadow-md dark:border-border/60 dark:bg-card">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-muted-foreground">Streak luyện tập</span>
            <div className="flex size-9 items-center justify-center rounded-xl bg-amber-50 text-amber-600 dark:bg-amber-950/20 dark:text-amber-400">
              <FlameIcon className="size-4.5 animate-pulse" />
            </div>
          </div>
          <div className="mt-4">
            <span className="text-2xl font-bold text-foreground">
              {stats?.streakDays != null ? `${stats.streakDays} ngày` : "--"}
            </span>
            <span className="ml-1.5 text-xs text-muted-foreground">
              {stats && stats.streakDays > 0 ? "Duy trì đều đặn" : "Bắt đầu luyện tập ngay"}
            </span>
          </div>
          <div className="mt-3.5 h-1.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-muted">
            <div
              className="h-full rounded-full bg-amber-500 transition-all duration-500"
              style={{ width: `${stats?.streakDays ? Math.min((stats.streakDays / 7) * 100, 100) : 0}%` }}
            />
          </div>
        </div>
      </section>

      {/* Main Content & Sidebar Layout */}
      <section className="grid items-start gap-6 lg:grid-cols-[1fr_380px]">

        {/* Main Interview Setup Section */}
        <div className="space-y-6 self-start min-w-0">
          <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-xs dark:border-border/60 dark:bg-card/80 md:p-6">
            
            {/* Header */}
            <div className="mb-5">
              <h2 className="text-lg font-bold text-foreground">
                Bắt đầu phỏng vấn
              </h2>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Chọn phương thức thiết lập câu hỏi phù hợp nhất cho buổi phỏng vấn giả định.
              </p>
            </div>

            {/* Entry Selection Cards */}
            <div className="grid gap-4 sm:grid-cols-2 mb-6">
              {/* Option 1: CV/JD đã lưu */}
              <button
                type="button"
                onClick={() => setSourceMode("previous")}
                className={cn(
                  "group flex items-start gap-3 rounded-xl border p-4 text-left transition-all cursor-pointer",
                  sourceMode === "previous"
                    ? "border-primary/30 bg-primary/5 dark:bg-primary/10 shadow-xs"
                    : "border-slate-150 hover:border-primary/20 bg-white hover:bg-slate-50/20 dark:border-border/40 dark:bg-card"
                )}
              >
                <div
                  className={cn(
                    "flex size-9 shrink-0 items-center justify-center rounded-lg transition-colors",
                    sourceMode === "previous"
                      ? "bg-primary text-white"
                      : "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400 group-hover:text-primary group-hover:bg-primary/5"
                  )}
                >
                  <HistoryIcon className="size-4.5" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-sm font-bold text-foreground group-hover:text-primary transition-colors">
                    CV/JD đã lưu
                  </h3>
                  <p className="mt-1 text-xs text-muted-foreground leading-normal">
                    Luyện tập dựa trên CV & mô tả công việc đã phân tích trước đó.
                  </p>
                </div>
              </button>

              {/* Option 2: Tạo mới */}
              <button
                type="button"
                onClick={() => setSourceMode("new")}
                className={cn(
                  "group flex items-start gap-3 rounded-xl border p-4 text-left transition-all cursor-pointer",
                  sourceMode === "new"
                    ? "border-violet-500/30 bg-violet-50/30 dark:bg-violet-950/20 shadow-xs"
                    : "border-slate-150 hover:border-violet-500/20 bg-white hover:bg-slate-50/20 dark:border-border/40 dark:bg-card"
                )}
              >
                <div
                  className={cn(
                    "flex size-9 shrink-0 items-center justify-center rounded-lg transition-colors",
                    sourceMode === "new"
                      ? "bg-violet-600 text-white"
                      : "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400 group-hover:text-violet-600 group-hover:bg-violet-500/5"
                  )}
                >
                  <PlusCircleIcon className="size-4.5" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-sm font-bold text-foreground group-hover:text-violet-600 transition-colors">
                    Tạo mới
                  </h3>
                  <p className="mt-1 text-xs text-muted-foreground leading-normal">
                    Tạo nhanh buổi phỏng vấn bằng cách nhập JD hoặc tải lên CV mới.
                  </p>
                </div>
              </button>
            </div>

            {/* Form Option Render */}
            <div>
              {sourceMode === "previous" ? (
                <PreviousAnalysisOption onSelect={setSelectedJobInfo} />
              ) : (
                <QuickInterviewOption onSelect={setSelectedJobInfo} />
              )}
            </div>
          </div>
        </div>

        {/* Right Sidebar / Coach Panel */}
        <aside className="flex flex-col gap-4 lg:sticky lg:top-8 self-start">
          {/* AI Career Coach Panel */}
          <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-xs dark:border-border/60 dark:bg-card">
            <div className="flex items-center gap-2.5">
              <div className="flex size-9 items-center justify-center rounded-lg bg-violet-50 text-violet-600 dark:bg-violet-950/30 dark:text-violet-400">
                <WandSparklesIcon className="size-4.5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-foreground">AI Interview Coach</h3>
                <p className="text-[10px] text-muted-foreground">Người bạn đồng hành luyện tập</p>
              </div>
            </div>

            {/* Coach Checklist */}
            <div className="mt-4 space-y-2.5">
              <div className="flex items-start gap-2.5 rounded-lg border border-slate-50 bg-slate-50/20 p-2.5 dark:border-border/30 dark:bg-background/10">
                <div className="flex size-4 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 dark:bg-emerald-950/30 dark:text-emerald-400 mt-0.5">
                  <CheckCircle2Icon className="size-3" />
                </div>
                <div>
                  <p className="text-xs font-bold text-foreground">Chuẩn bị câu trả lời theo STAR</p>
                  <p className="mt-0.5 text-[10px] text-muted-foreground leading-normal">Situation (Tình huống) - Task (Nhiệm vụ) - Action (Hành động) - Result (Kết quả).</p>
                </div>
              </div>

              <div className="flex items-start gap-2.5 rounded-lg border border-slate-50 bg-slate-50/20 p-2.5 dark:border-border/30 dark:bg-background/10">
                <div className="flex size-4 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 dark:bg-emerald-950/30 dark:text-emerald-400 mt-0.5">
                  <CheckCircle2Icon className="size-3" />
                </div>
                <div>
                  <p className="text-xs font-bold text-foreground">Luyện phản xạ với tình huống</p>
                  <p className="mt-0.5 text-[10px] text-muted-foreground leading-normal">Tập trung lắng nghe và trả lời trôi chảy, tránh các từ ậm ừ.</p>
                </div>
              </div>

              <div className="flex items-start gap-2.5 rounded-lg border border-slate-50 bg-slate-50/20 p-2.5 dark:border-border/30 dark:bg-background/10">
                <div className="flex size-4 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 dark:bg-emerald-950/30 dark:text-emerald-400 mt-0.5">
                  <CheckCircle2Icon className="size-3" />
                </div>
                <div>
                  <p className="text-xs font-bold text-foreground">Nhận feedback chi tiết</p>
                  <p className="mt-0.5 text-[10px] text-muted-foreground leading-normal">Đánh giá về cả nội dung chuyên môn lẫn sự tự tin trong giọng nói.</p>
                </div>
              </div>

              <div className="flex items-start gap-2.5 rounded-lg border border-slate-50 bg-slate-50/20 p-2.5 dark:border-border/30 dark:bg-background/10">
                <div className="flex size-4 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 dark:bg-emerald-950/30 dark:text-emerald-400 mt-0.5">
                  <CheckCircle2Icon className="size-3" />
                </div>
                <div>
                  <p className="text-xs font-bold text-foreground">Gợi ý cải thiện rõ ràng</p>
                  <p className="mt-0.5 text-[10px] text-muted-foreground leading-normal">Chỉ ra điểm cần khắc phục và phiên bản trả lời tốt hơn tham khảo.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Daily Suggestion Card */}
          <div className="rounded-2xl border border-amber-100 bg-gradient-to-br from-amber-50/40 to-orange-50/40 p-4.5 shadow-xs dark:border-amber-950/20 dark:from-amber-950/5 dark:to-orange-950/5">
            <div className="flex items-start gap-2.5">
              <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-amber-500 text-white shadow-xs">
                <LightbulbIcon className="size-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-amber-900 dark:text-amber-400">Gợi ý hôm nay</h4>
                <p className="mt-1 text-xs text-amber-850 dark:text-amber-300 leading-normal">
                  Hãy luyện 1 buổi phỏng vấn ngắn 5–10 phút cho vị trí bạn đang ứng tuyển gần nhất để duy trì phong độ và phản xạ tốt nhé!
                </p>
              </div>
            </div>
          </div>
        </aside>

      </section>
    </div>
  );
}

export default function InterviewPage() {
  return (
    <Suspense fallback={<div>Đang tải...</div>}>
      <InterviewPageContent />
    </Suspense>
  )
}
