"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  SparklesIcon,
  HistoryIcon,
  PlusCircleIcon,
  MessageSquareTextIcon,
  BriefcaseIcon,
  AudioLinesIcon,
  CreditCardIcon,
  CheckCircle2Icon,
  WandSparklesIcon,
  TargetIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
  resetText: "Dang tai...",
};

function getUsagePercent(usage: UsageInfo) {
  return usage.total != null && usage.total > 0
    ? Math.min((usage.used / usage.total) * 100, 100)
    : 100;
}

function formatUsageCount(value: number | null) {
  return value == null ? "Khong gioi han" : value.toLocaleString("vi-VN");
}

export default function InterviewPage() {
  const [selectedJobInfo, setSelectedJobInfo] =
    useState<InterviewJobInfo | null>(null);
  const [sourceMode, setSourceMode] = useState<SourceMode>("previous");

  const [usage, setUsage] = useState<UsageInfo>(defaultUsage);

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

    loadUsage();
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

  return (
    <div className="bg-[radial-gradient(circle_at_top,rgba(179,0,0,0.10),transparent_28%),radial-gradient(circle_at_top_right,rgba(124,58,237,0.05),transparent_24%),linear-gradient(to_bottom,var(--background),var(--background))]">
      <main className="container py-8 md:py-10">
        <section className="mb-8">
          <div className="rounded-[32px] border border-primary/10 bg-white/85 p-6 shadow-sm backdrop-blur dark:bg-card/80 md:p-8">
            <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
              <div className="max-w-3xl">
                <div className="inline-flex items-center gap-2 rounded-full border border-primary/15 bg-primary/5 px-3 py-1 text-xs font-medium text-primary">
                  <SparklesIcon className="size-3.5" />
                  AI Mock Interview
                </div>

                <h1 className="mt-4 text-3xl font-bold tracking-tight text-foreground md:text-5xl">
                  Phỏng vấn với AI
                </h1>

                <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground md:text-base">
                  Luyện phỏng vấn thực tế với AI, nhận câu hỏi bám sát vị trí
                  ứng tuyển và cải thiện phản xạ trả lời trước buổi phỏng vấn
                  thật.
                </p>
              </div>

              <div className="flex flex-wrap gap-3">
                <div className="rounded-2xl border border-primary/10 bg-primary/5 px-4 py-3">
                  <div className="flex items-center gap-2 text-sm font-medium text-primary">
                    <MessageSquareTextIcon className="size-4" />
                    Câu hỏi sát vị trí
                  </div>
                </div>

                <div className="rounded-2xl border border-secondary/20 bg-secondary px-4 py-3">
                  <div className="flex items-center gap-2 text-sm font-medium text-secondary-foreground">
                    <AudioLinesIcon className="size-4" />
                    Mô phỏng hội thoại thật
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6">
              <div className="relative overflow-hidden rounded-[28px] border border-primary/10 bg-gradient-to-r from-primary/5 via-white to-secondary/10 p-5 shadow-sm dark:from-primary/10 dark:via-card dark:to-secondary/10">
                <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(179,0,0,0.10),transparent_30%),radial-gradient(circle_at_bottom_left,rgba(109,40,217,0.08),transparent_28%)]" />

                <div className="relative flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  <div className="flex items-start gap-4">
                    <div className="rounded-2xl bg-white/90 p-3 shadow-sm ring-1 ring-primary/10 dark:bg-background/80">
                      <SparklesIcon className="size-5 text-primary" />
                    </div>

                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-base font-semibold text-foreground">
                          {formatUsageCount(usage.remaining)}/{formatUsageCount(usage.total)} lượt phỏng vấn còn lại
                        </p>
                        <Badge className="rounded-full bg-primary text-primary-foreground hover:bg-primary">
                          {usage.planName}
                        </Badge>
                      </div>

                      <p className="mt-1 text-sm text-muted-foreground">
                        Đã dùng {usage.used}/{formatUsageCount(usage.total)} lượt •{" "}
                        {usage.resetText}
                      </p>

                      <div className="mt-3 h-2.5 w-full max-w-md overflow-hidden rounded-full bg-primary/10">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-primary via-[#c83a3a] to-secondary transition-all"
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <Button asChild className="btn-cta rounded-xl">
                      <Link href="/#pricing">Mua thêm lượt</Link>
                    </Button>
                    <Button
                      asChild
                      variant="outline"
                      className="rounded-xl border-primary/15 bg-white/80 hover:bg-primary/5 dark:bg-background/40"
                    >
                      <Link href="/#pricing">
                        <CreditCardIcon className="mr-2 size-4" />
                        Xem bảng giá
                      </Link>
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="grid items-start gap-8 xl:grid-cols-[1.18fr_0.82fr]">
          <div className="min-w-0 space-y-6">
            <div className="rounded-[32px] border border-primary/10 bg-white/90 p-6 shadow-sm dark:bg-card/80 md:p-7">
              <div className="mb-6">
                <div className="flex items-start gap-3">
                  <div className="rounded-2xl bg-gradient-to-br from-primary to-[#d14b4b] p-2.5 text-white shadow-sm">
                    {sourceMode === "previous" ? (
                      <HistoryIcon className="size-5" />
                    ) : (
                      <PlusCircleIcon className="size-5" />
                    )}
                  </div>

                  <div>
                    <h2 className="text-xl font-semibold">
                      {sourceMode === "previous"
                        ? "Bắt đầu từ dữ liệu đã phân tích"
                        : "Tạo buổi phỏng vấn mới"}
                    </h2>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {sourceMode === "previous"
                        ? "Chọn CV/JD đã có để bắt đầu nhanh hơn với ngữ cảnh sát hơn."
                        : "Nhập nhanh thông tin vị trí để AI bắt đầu một buổi phỏng vấn mới."}
                    </p>
                  </div>
                </div>
              </div>

              <div className="mb-6 grid gap-4 md:grid-cols-2">
                <button
                  type="button"
                  onClick={() => setSourceMode("previous")}
                  className={cn(
                    "group min-h-[168px] rounded-[26px] border p-5 text-left transition-all",
                    sourceMode === "previous"
                      ? "border-primary/25 bg-primary/5 shadow-sm"
                      : "border-border bg-background hover:border-primary/20 hover:bg-primary/5",
                  )}
                >
                  <div
                    className={cn(
                      "mb-5 flex size-12 items-center justify-center rounded-2xl border transition-colors",
                      sourceMode === "previous"
                        ? "border-primary/15 bg-primary/10 text-primary"
                        : "border-border bg-muted text-muted-foreground",
                    )}
                  >
                    <HistoryIcon className="size-5" />
                  </div>

                  <h3 className="text-lg font-semibold">Dữ liệu đã có</h3>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">
                    Sử dụng CV/JD đã phân tích trước đó để AI hiểu rõ ngữ cảnh
                    của bạn hơn.
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => setSourceMode("new")}
                  className={cn(
                    "group min-h-[168px] rounded-[26px] border p-5 text-left transition-all",
                    sourceMode === "new"
                      ? "border-primary/25 bg-primary/5 shadow-sm"
                      : "border-border bg-background hover:border-primary/20 hover:bg-primary/5",
                  )}
                >
                  <div
                    className={cn(
                      "mb-5 flex size-12 items-center justify-center rounded-2xl border transition-colors",
                      sourceMode === "new"
                        ? "border-primary/15 bg-primary/10 text-primary"
                        : "border-border bg-muted text-muted-foreground",
                    )}
                  >
                    <PlusCircleIcon className="size-5" />
                  </div>

                  <h3 className="text-lg font-semibold">Phỏng vấn mới</h3>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">
                    Tạo nhanh buổi phỏng vấn mới bằng cách nhập vị trí và thông
                    tin cần thiết.
                  </p>
                </button>
              </div>

              <div className="min-w-0">
                {sourceMode === "previous" ? (
                  <PreviousAnalysisOption onSelect={setSelectedJobInfo} />
                ) : (
                  <QuickInterviewOption onSelect={setSelectedJobInfo} />
                )}
              </div>
            </div>
          </div>

          <aside className="min-w-0 space-y-6 xl:self-start">
            <div className="rounded-[32px] border border-secondary/20 bg-gradient-to-br from-secondary/10 via-white to-primary/5 p-6 shadow-sm dark:from-secondary/10 dark:via-card dark:to-primary/10">
              <div className="flex items-start gap-3">
                <div className="rounded-2xl bg-gradient-to-br from-fuchsia-500 to-amber-400 p-2.5 text-white shadow-sm">
                  <WandSparklesIcon className="size-5" />
                </div>

                <div>
                  <h3 className="text-xl font-semibold">
                    Sau khi phân tích bạn nhận được gì?
                  </h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Kết quả rõ ràng, gọn và hữu ích để tối ưu CV trước khi ứng
                    tuyển.
                  </p>
                </div>
              </div>

              <div className="mt-5 space-y-3">
                <div className="rounded-2xl border border-border bg-white/80 p-4 dark:bg-background/50">
                  <p className="font-medium">
                    Câu hỏi sát với vị trí ứng tuyển
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    AI đặt câu hỏi dựa trên vị trí, kinh nghiệm và mô tả công
                    việc của bạn.
                  </p>
                </div>

                <div className="rounded-2xl border border-border bg-white/80 p-4 dark:bg-background/50">
                  <p className="font-medium">Luyện phản xạ trả lời phỏng vấn</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Tập trả lời mạch lạc và tự tin hơn trước buổi phỏng vấn
                    thật.
                  </p>
                </div>

                <div className="rounded-2xl border border-border bg-white/80 p-4 dark:bg-background/50">
                  <p className="font-medium">
                    Nhận feedback sau mỗi câu trả lời
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    AI đánh giá câu trả lời và gợi ý cách cải thiện để bạn trả
                    lời tốt hơn.
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-[32px] border border-amber-200/60 bg-gradient-to-r from-amber-50 via-rose-50 to-violet-50 p-6 shadow-sm dark:border-amber-900/30 dark:from-amber-950/10 dark:via-rose-950/10 dark:to-violet-950/10">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="text-xl font-semibold">
                    Cần thêm lượt phân tích?
                  </h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Mua lẻ theo nhu cầu hoặc nâng cấp gói tháng để dùng nhiều
                    hơn.
                  </p>
                </div>

                <Badge className="rounded-full bg-gradient-to-r from-fuchsia-500 to-amber-400 text-white hover:from-fuchsia-500 hover:to-amber-400">
                  15.000đ/lượt
                </Badge>
              </div>

              <div className="mt-5 space-y-3">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <CheckCircle2Icon className="size-4 text-primary" />
                  Mua thêm lượt ngay khi cần
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <TargetIcon className="size-4 text-primary" />
                  Phù hợp cho luyện tập theo từng đợt ứng tuyển
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <BriefcaseIcon className="size-4 text-primary" />
                  Linh hoạt giữa mua lẻ và nâng cấp gói
                </div>
              </div>

              <div className="mt-4 grid gap-2 sm:grid-cols-2">
                <Button
                  asChild
                  className="rounded-2xl bg-violet-600 hover:bg-violet-700"
                >
                  <Link href="/#pricing">Mua thêm lượt</Link>
                </Button>
                <Button
                  asChild
                  variant="outline"
                  className="rounded-2xl bg-white/70 dark:bg-background/40"
                >
                  <Link href="/#pricing">Xem bảng giá</Link>
                </Button>
              </div>
            </div>
          </aside>
        </section>
      </main>
    </div>
  );
}
