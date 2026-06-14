"use client";

import { Suspense, useEffect, useState, useTransition } from "react";
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
  FolderOpenIcon,
  Loader2Icon,
  ClockIcon,
  CheckCircleIcon,
  ArrowRightIcon,
  ChevronLeftIcon,
  UserIcon,
  PlayIcon,
  PercentIcon,
  CheckCircle2,
  MicIcon,
  StarIcon,
  TrendingUpIcon,
  FlameIcon,
  LightbulbIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PreviousAnalysisOption } from "./_PreviousAnalysisOption";
import { QuickInterviewOption } from "./_QuickInterviewOption";
import { VapiInterviewCall } from "./_VapiInterviewCall";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  getInterviewsForJobInfo,
  generateInterviewFeedback,
  getHumeMessagesAction,
  getUserInterviewStats,
} from "@/features/interviews/actions";
import { getJobInfoForClient } from "@/features/jobInfos/actions";
import { useSearchParams } from "next/navigation";
import { formatDistanceToNow } from "date-fns";
import { vi } from "date-fns/locale";
import { MarkdownRenderer } from "@/components/MarkdownRenderer";
import { toast } from "sonner";
import { formatExperienceLevel } from "@/features/jobInfos/lib/formatters";
import { CondensedMessages } from "@/services/hume/components/CondensedMessages";

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
  resetText: "Đang tải...",
};

function getUsagePercent(usage: UsageInfo) {
  return usage.total != null && usage.total > 0
    ? Math.min((usage.used / usage.total) * 100, 100)
    : 100;
}

function formatUsageCount(value: number | null) {
  return value == null ? "Không giới hạn" : value.toLocaleString("vi-VN");
}

type InterviewHistoryItem = Awaited<ReturnType<typeof getInterviewsForJobInfo>>[number];

function parseFeedbackDetails(markdown: string | null) {
  if (!markdown) return null;

  const parseScore = (regex: RegExp) => {
    const match = markdown.match(regex);
    return match ? parseFloat(match[1]) : null;
  };

  const overall = parseScore(/(?:Overall Rating|Overall Score|Điểm tổng hợp|Điểm tổng|Đánh giá chung)[\s\*:]*(\d+(\.\d+)?)\/10/i);
  const communication = parseScore(/(?:Communication Clarity|Giao tiếp|Diễn đạt|Khả năng giao tiếp)[\s\*:]*(\d+(\.\d+)?)\/10/i) || 8.0;
  const responseQuality = parseScore(/(?:Response Quality|Chất lượng câu trả lời|Tư duy tình huống|Tình huống|Tư duy)[\s\*:]*(\d+(\.\d+)?)\/10/i) || 7.5;
  const roleFit = parseScore(/(?:Role Fit[\s&]+Alignment|Phù hợp JD|Sự phù hợp|Phù hợp)[\s\*:]*(\d+(\.\d+)?)\/10/i) || 8.0;
  const specialty = parseScore(/(?:Technical|Chuyên môn|Kiến thức chuyên môn)[\s\*:]*(\d+(\.\d+)?)\/10/i) || 8.2;

  return {
    overall: overall || 8.0,
    communication,
    situational: responseQuality,
    fit: roleFit,
    specialty,
  };
}

export function InterviewPageContent() {
  const [selectedJobInfo, setSelectedJobInfo] =
    useState<InterviewJobInfo | null>(null);
  const [sourceMode, setSourceMode] = useState<SourceMode>("previous");
  const [usage, setUsage] = useState<UsageInfo>(defaultUsage);

  const searchParams = useSearchParams();
  const jobInfoId = searchParams.get("jobInfoId");

  useEffect(() => {
    if (jobInfoId) {
      getJobInfoForClient(jobInfoId).then((info) => {
        if (info) {
          let cvSummary: string | undefined;
          if (info.analysisResult) {
            try {
              const parsed = JSON.parse(info.analysisResult);
              cvSummary = parsed.other?.summary || parsed.ats?.summary || undefined;
            } catch (e) {
              // ignore
            }
          }
          setSelectedJobInfo({
            id: info.id,
            title: info.title || "",
            name: info.name,
            experienceLevel: info.experienceLevel,
            description: info.description,
            cvSummary,
          });
        }
      });
    }
  }, [jobInfoId]);

  // History Modal state
  const [historyJobInfo, setHistoryJobInfo] = useState<InterviewJobInfo | null>(null);
  const [historyInterviews, setHistoryInterviews] = useState<InterviewHistoryItem[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [selectedInterview, setSelectedInterview] = useState<InterviewHistoryItem | null>(null);
  const [humeMessages, setHumeMessages] = useState<Awaited<ReturnType<typeof getHumeMessagesAction>>>([]);
  const [loadingHumeMessages, setLoadingHumeMessages] = useState(false);
  const [isGeneratingFeedback, startGeneratingFeedback] = useTransition();

  const percent = getUsagePercent(usage);

  const [stats, setStats] = useState({
    totalInterviews: 0,
    averageScore: 0,
    improvementRate: 0,
    streakDays: 0,
    completionRate: 0,
  });

  const loadUsage = async () => {
    const response = await fetch("/api/user/usage?feature=mock_interview", {
      cache: "no-store",
    });
    if (!response.ok) return;

    const data = (await response.json()) as { usage?: UsageInfo | null };
    if (data.usage != null) setUsage(data.usage);
  };

  const loadStats = async () => {
    try {
      const data = await getUserInterviewStats();
      setStats(data);
    } catch (e) {
      console.error("Lỗi khi tải thống kê", e);
    }
  };

  useEffect(() => {
    loadUsage();
    loadStats();
  }, []);

  // Fetch interviews for history modal when target job info changes
  useEffect(() => {
    if (!historyJobInfo) {
      setHistoryInterviews([]);
      setSelectedInterview(null);
      setHumeMessages([]);
      return;
    }

    setLoadingHistory(true);
    getInterviewsForJobInfo(historyJobInfo.id)
      .then((data) => {
        setHistoryInterviews(data);
      })
      .catch((e) => {
        console.error("Lỗi khi tải lịch sử phỏng vấn", e);
        toast.error("Không thể tải danh sách lịch sử phỏng vấn");
      })
      .finally(() => {
        setLoadingHistory(false);
      });
  }, [historyJobInfo]);

  // Fetch Hume messages if needed when selected interview changes
  useEffect(() => {
    if (!selectedInterview) {
      setHumeMessages([]);
      return;
    }

    if (selectedInterview.humeChatId) {
      setLoadingHumeMessages(true);
      getHumeMessagesAction(selectedInterview.humeChatId)
        .then((messages) => {
          setHumeMessages(messages);
        })
        .catch((e) => {
          console.error("Lỗi tải tin nhắn Hume", e);
        })
        .finally(() => {
          setLoadingHumeMessages(false);
        });
    }
  }, [selectedInterview]);

  const handleGenerateFeedback = () => {
    if (!selectedInterview) return;
    startGeneratingFeedback(async () => {
      try {
        const res = await generateInterviewFeedback(selectedInterview.id);
        if (res.error) {
          toast.error(res.message);
          return;
        }
        toast.success("Đã tạo đánh giá AI thành công!");
        const updatedFeedback = res.feedback ?? null;

        // Update current selectedInterview state
        setSelectedInterview((prev) => prev ? { ...prev, feedback: updatedFeedback } : null);

        // Update in list
        setHistoryInterviews((prevList) =>
          prevList.map((item) =>
            item.id === selectedInterview.id ? { ...item, feedback: updatedFeedback } : item
          )
        );
      } catch (err) {
        toast.error("Tạo đánh giá thất bại");
        console.error(err);
      }
    });
  };

  if (selectedJobInfo) {
    return (
      <VapiInterviewCall
        jobInfo={selectedJobInfo}
        onBack={() => {
          setSelectedJobInfo(null);
          loadUsage();
          loadStats();
        }}
      />
    );
  }

  // Calculate parsed match score for the header
  let modalMatchScore: number | null = null;
  if (historyJobInfo?.id) {
    const matchedJob = historyInterviews.length > 0 ? historyJobInfo : null;
    // We can also extract this from the jobInfo structure if it was loaded
    // (PreviousAnalysisOption passes the jobInfo which contains analysisResult)
    const rawResult = (historyJobInfo as any)?.analysisResult;
    if (rawResult) {
      try {
        const parsed = JSON.parse(rawResult);
        if (parsed?.jobMatch?.score != null) {
          modalMatchScore = Math.round(parsed.jobMatch.score * 10);
        }
      } catch (e) {
        // ignore
      }
    }
  }

  return (
    <div className="min-h-screen bg-slate-50/50 dark:bg-background/95">
      <main className="container max-w-6xl py-8 px-4">
        {/* Page Header (Hero Section) */}
        <section className="relative overflow-hidden rounded-[24px] border border-slate-200 dark:border-slate-800 bg-gradient-to-br from-rose-50/30 via-purple-50/30 to-indigo-50/40 p-6 shadow-xs dark:from-card dark:via-primary/5 dark:to-secondary/5 md:p-8 mb-6">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(244,63,94,0.05),transparent_40%),radial-gradient(circle_at_bottom_left,rgba(99,102,241,0.05),transparent_40%)]" />

          <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-3xl space-y-4 flex-1">
              <div className="inline-flex items-center gap-1.5 rounded-full border border-rose-200 bg-rose-50/50 px-2.5 py-0.5 text-xs font-semibold text-rose-600 dark:border-rose-900/30 dark:bg-rose-950/20">
                <SparklesIcon className="size-3.5 animate-pulse" />
                AI Mock Interview Workspace
              </div>

              <h1 className="text-3xl font-bold tracking-tight text-foreground md:text-4xl">
                Phỏng vấn với AI
              </h1>

              <p className="max-w-2xl text-xs md:text-sm leading-relaxed text-slate-600 dark:text-slate-400">
                Luyện tập phỏng vấn thực tế với AI, nhận phản hồi sát CV/JD và cải thiện kỹ năng trả lời.
              </p>

              {/* Feature Tags */}
              <div className="flex flex-wrap gap-2 pt-1">
                <div className="bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400 hover:brightness-105 hover:shadow-xs transition-all duration-200 rounded-full px-2.5 py-0.5 text-xs font-semibold inline-flex items-center gap-1 cursor-default">
                  <CheckCircleIcon className="size-3.5" />
                  Phản hồi theo STAR
                </div>

                <div className="bg-blue-50 text-blue-700 dark:bg-blue-950/20 dark:text-blue-400 hover:brightness-105 hover:shadow-xs transition-all duration-200 rounded-full px-2.5 py-0.5 text-xs font-semibold inline-flex items-center gap-1 cursor-default">
                  <MicIcon className="size-3.5" />
                  Mô phỏng hội thoại
                </div>

                <div className="bg-purple-50 text-purple-700 dark:bg-purple-950/20 dark:text-purple-400 hover:brightness-105 hover:shadow-xs transition-all duration-200 rounded-full px-2.5 py-0.5 text-xs font-semibold inline-flex items-center gap-1 cursor-default">
                  <SparklesIcon className="size-3.5" />
                  AI Feedback
                </div>

                <div className="bg-amber-50 text-amber-700 dark:bg-amber-950/20 dark:text-amber-400 hover:brightness-105 hover:shadow-xs transition-all duration-200 rounded-full px-2.5 py-0.5 text-xs font-semibold inline-flex items-center gap-1 cursor-default">
                  <LightbulbIcon className="size-3.5" />
                  Career Coach
                </div>
              </div>
            </div>

            <div className="hidden lg:flex items-center justify-center pr-4 shrink-0">
              <div className="relative flex size-24 items-center justify-center rounded-[24px] bg-gradient-to-br from-rose-500/10 via-purple-500/10 to-indigo-500/10 p-1 shadow-inner ring-8 ring-white/50 dark:ring-card/50">
                <div className="absolute inset-0 animate-ping rounded-[24px] bg-rose-500/5 opacity-50" />
                <div className="flex size-full items-center justify-center rounded-[20px] bg-white shadow dark:bg-card">
                  <AudioLinesIcon className="size-10 text-primary" />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 4 KPI Cards Section */}
        <section className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {/* KPI 1 */}
          <div className="bg-white dark:bg-card border border-slate-200 dark:border-slate-800 rounded-[24px] p-4 shadow-xs hover:shadow-md transition-all duration-200 h-[100px] flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Tổng số cuộc phỏng vấn</span>
              <MicIcon className="size-4.5 text-rose-500" />
            </div>
            <div className="mt-1">
              <span className="text-xl font-bold text-slate-900 dark:text-foreground">{stats.totalInterviews}</span>
              <span className="text-[10px] text-muted-foreground ml-1">buổi đã lưu</span>
            </div>
          </div>

          {/* KPI 2 */}
          <div className="bg-white dark:bg-card border border-slate-200 dark:border-slate-800 rounded-[24px] p-4 shadow-xs hover:shadow-md transition-all duration-200 h-[100px] flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Điểm trung bình</span>
              <StarIcon className="size-4.5 text-amber-500 fill-amber-400" />
            </div>
            <div className="mt-1">
              <span className="text-xl font-bold text-slate-900 dark:text-foreground">
                {stats.averageScore > 0 ? stats.averageScore : "---"}{stats.averageScore > 0 && <span className="text-xs text-muted-foreground">/10</span>}
              </span>
              <span className={cn(
                "text-[10px] font-semibold ml-1",
                stats.averageScore >= 8.5
                  ? "text-emerald-600"
                  : stats.averageScore >= 7.0
                    ? "text-blue-600"
                    : stats.averageScore >= 5.0
                      ? "text-amber-600"
                      : stats.averageScore > 0
                        ? "text-rose-600"
                        : "text-muted-foreground"
              )}>
                {stats.averageScore >= 8.5
                  ? "Xuất sắc"
                  : stats.averageScore >= 7.0
                    ? "Khá tốt"
                    : stats.averageScore >= 5.0
                      ? "Trung bình"
                      : stats.averageScore > 0
                        ? "Cần cải thiện"
                        : "Chưa có"}
              </span>
            </div>
          </div>

          {/* KPI 3 */}
          <div className="bg-white dark:bg-card border border-slate-200 dark:border-slate-800 rounded-[24px] p-4 shadow-xs hover:shadow-md transition-all duration-200 h-[100px] flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Mức cải thiện</span>
              <TrendingUpIcon className="size-4.5 text-emerald-500" />
            </div>
            <div className="mt-1">
              <span className={cn(
                "text-xl font-bold",
                stats.improvementRate > 0
                  ? "text-emerald-600"
                  : stats.improvementRate < 0
                    ? "text-rose-600"
                    : "text-slate-900 dark:text-foreground"
              )}>
                {stats.improvementRate > 0 ? `+${stats.improvementRate}%` : `${stats.improvementRate}%`}
              </span>
              <span className="text-[10px] text-muted-foreground ml-1">xu hướng</span>
            </div>
          </div>

          {/* KPI 4 */}
          <div className="bg-white dark:bg-card border border-slate-200 dark:border-slate-800 rounded-[24px] p-4 shadow-xs hover:shadow-md transition-all duration-200 h-[100px] flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Chuỗi liên tiếp</span>
              <FlameIcon className="size-4.5 text-orange-500 fill-orange-400" />
            </div>
            <div className="mt-1">
              <span className="text-xl font-bold text-slate-900 dark:text-foreground">{stats.streakDays} ngày</span>
              <span className="text-[10px] text-muted-foreground ml-1">Luyện tập</span>
            </div>
          </div>
        </section>

        {/* Dashboard Grid */}
        <section id="start-interview-section" className="grid items-start gap-6 lg:grid-cols-3">
          {/* Main workspace container */}
          <div className="lg:col-span-2 space-y-6">
            {/* Selection Cards (Compact & Elegant as in the image) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => setSourceMode("previous")}
                className={cn(
                  "group flex items-center gap-3.5 p-4 rounded-xl border text-left transition-all duration-200 shadow-xs",
                  sourceMode === "previous"
                    ? "border-indigo-500 bg-indigo-50/40 dark:bg-indigo-950/20 ring-1 ring-indigo-500/20"
                    : "border-slate-200 dark:border-slate-800 bg-white dark:bg-card hover:border-indigo-200 hover:bg-indigo-50/5 dark:hover:bg-indigo-950/5"
                )}
              >
                <div className={cn(
                  "p-2.5 rounded-lg shrink-0 flex items-center justify-center transition-all duration-200",
                  sourceMode === "previous"
                    ? "bg-indigo-600 text-white shadow-sm shadow-indigo-500/30"
                    : "bg-slate-100 text-slate-500 dark:bg-muted group-hover:bg-indigo-100 group-hover:text-indigo-600 dark:group-hover:bg-indigo-950/50"
                )}>
                  <HistoryIcon className="size-5" />
                </div>
                <div className="min-w-0">
                  <h3 className={cn(
                    "text-sm font-bold transition-all duration-200",
                    sourceMode === "previous"
                      ? "text-indigo-900 dark:text-indigo-200"
                      : "text-slate-900 dark:text-foreground group-hover:text-indigo-700 dark:group-hover:text-indigo-300"
                  )}>
                    CV/JD đã lưu
                  </h3>
                  <p className="text-xs text-muted-foreground mt-0.5 leading-tight">
                    Luyện tập dựa trên CV & mô tả công việc đã phân tích trước đó.
                  </p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setSourceMode("new")}
                className={cn(
                  "group flex items-center gap-3.5 p-4 rounded-xl border text-left transition-all duration-200 shadow-xs",
                  sourceMode === "new"
                    ? "border-emerald-500 bg-emerald-50/40 dark:bg-emerald-950/20 ring-1 ring-emerald-500/20"
                    : "border-slate-200 dark:border-slate-800 bg-white dark:bg-card hover:border-emerald-200 hover:bg-emerald-50/5 dark:hover:bg-emerald-950/5"
                )}
              >
                <div className={cn(
                  "p-2.5 rounded-lg shrink-0 flex items-center justify-center transition-all duration-200",
                  sourceMode === "new"
                    ? "bg-emerald-600 text-white shadow-sm shadow-emerald-500/30"
                    : "bg-slate-100 text-slate-500 dark:bg-muted group-hover:bg-emerald-100 group-hover:text-emerald-600 dark:group-hover:bg-emerald-950/50"
                )}>
                  <PlusCircleIcon className="size-5" />
                </div>
                <div className="min-w-0">
                  <h3 className={cn(
                    "text-sm font-bold transition-all duration-200",
                    sourceMode === "new"
                      ? "text-emerald-900 dark:text-emerald-200"
                      : "text-slate-900 dark:text-foreground group-hover:text-emerald-700 dark:group-hover:text-emerald-300"
                  )}>
                    Tạo mới
                  </h3>
                  <p className="text-xs text-muted-foreground mt-0.5 leading-tight">
                    Tạo nhanh buổi phỏng vấn bằng cách nhập JD hoặc tải lên CV mới.
                  </p>
                </div>
              </button>
            </div>

            {/* Dynamic tab contents in clean cards */}
            <div className="rounded-[24px] border border-slate-200 dark:border-slate-800 bg-white p-5 shadow-xs dark:bg-card">
              {sourceMode === "previous" ? (
                <PreviousAnalysisOption
                  onSelect={setSelectedJobInfo}
                  onOpenHistory={setHistoryJobInfo}
                />
              ) : (
                <QuickInterviewOption
                  onSelect={setSelectedJobInfo}
                  onSaveDraft={() => {
                    setSourceMode("previous");
                    window.location.reload();
                  }}
                />
              )}
            </div>
          </div>

          {/* Sidebar controls */}
          <aside className="space-y-4">
            {/* AI Interview Coach info card */}
            <div className="rounded-[24px] border border-slate-200 dark:border-slate-800 bg-white p-5 shadow-xs dark:bg-card space-y-4">
              <div className="flex items-center gap-3">
                <div className="flex size-9 items-center justify-center rounded-xl bg-violet-50 text-violet-600 dark:bg-violet-950/20 dark:text-violet-400 border border-violet-100">
                  <WandSparklesIcon className="size-4.5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">
                    AI Interview Coach
                  </h3>
                  <p className="text-[11px] text-muted-foreground">
                    Người bạn đồng hành luyện tập
                  </p>
                </div>
              </div>

              <div className="space-y-3 pt-1">
                <div className="flex gap-2.5 items-start">
                  <CheckCircle2 className="size-4 shrink-0 text-emerald-600 dark:text-emerald-500 mt-0.5" />
                  <div className="text-xs">
                    <span className="font-semibold block text-slate-700 dark:text-slate-300">
                      Chuẩn bị câu trả lời theo STAR
                    </span>
                    <span className="text-muted-foreground">
                      Situation (Tình huống) - Task (Nhiệm vụ) - Action (Hành động) - Result (Kết quả).
                    </span>
                  </div>
                </div>

                <div className="flex gap-2.5 items-start">
                  <CheckCircle2 className="size-4 shrink-0 text-emerald-600 dark:text-emerald-500 mt-0.5" />
                  <div className="text-xs">
                    <span className="font-semibold block text-slate-700 dark:text-slate-300">
                      Luyện phản xạ với tình huống
                    </span>
                    <span className="text-muted-foreground">
                      Tập trung lắng nghe và trả lời trôi chảy, tránh các từ âm ờ.
                    </span>
                  </div>
                </div>

                <div className="flex gap-2.5 items-start">
                  <CheckCircle2 className="size-4 shrink-0 text-emerald-600 dark:text-emerald-500 mt-0.5" />
                  <div className="text-xs">
                    <span className="font-semibold block text-slate-700 dark:text-slate-300">
                      Nhận feedback chi tiết
                    </span>
                    <span className="text-muted-foreground">
                      Đánh giá về cả nội dung chuyên môn lẫn sự tự tin trong giọng nói.
                    </span>
                  </div>
                </div>

                <div className="flex gap-2.5 items-start">
                  <CheckCircle2 className="size-4 shrink-0 text-emerald-600 dark:text-emerald-500 mt-0.5" />
                  <div className="text-xs">
                    <span className="font-semibold block text-slate-700 dark:text-slate-300">
                      Gợi ý cải thiện rõ ràng
                    </span>
                    <span className="text-muted-foreground">
                      Chỉ ra điểm cần khắc phục và phiên bản trả lời tốt hơn tham khảo.
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Lượt phỏng vấn AI - Styled like orange card */}
            <div className="rounded-[24px] border border-amber-200 bg-amber-50/50 p-5 dark:border-amber-900/30 dark:bg-amber-950/10 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-amber-800 dark:text-amber-200">
                  Lượt phỏng vấn AI
                </span>
                <Badge className="bg-amber-500/10 text-amber-800 border-none hover:bg-amber-500/20">
                  {usage.planName}
                </Badge>
              </div>

              <div>
                <div className="flex items-baseline justify-between text-xs text-amber-700 dark:text-amber-300">
                  <span>Còn lại</span>
                  <span className="text-sm font-bold">
                    {formatUsageCount(usage.remaining)} / {formatUsageCount(usage.total)}
                  </span>
                </div>
                <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-amber-100 dark:bg-amber-950/40">
                  <div
                    className="h-full rounded-full bg-amber-500 transition-all duration-500"
                    style={{ width: `${percent}%` }}
                  />
                </div>
                <p className="mt-2 text-[10px] text-amber-600 dark:text-amber-400">
                  Đã dùng {usage.used} lượt • {usage.resetText}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-1">
                <Button asChild size="sm" className="rounded-xl text-[11px] font-semibold h-8.5 bg-amber-600 hover:bg-amber-700 text-white border-none shadow-xs">
                  <Link href="/#pricing">Mua thêm lượt</Link>
                </Button>
                <Button
                  asChild
                  variant="outline"
                  size="sm"
                  className="rounded-xl text-[11px] font-semibold border-amber-200 bg-white hover:bg-amber-50/50 dark:bg-background dark:border-amber-900/40 h-8.5 text-amber-800 dark:text-amber-200"
                >
                  <Link href="/#pricing">
                    <CreditCardIcon className="mr-1.5 size-3.5" />
                    Xem bảng giá
                  </Link>
                </Button>
              </div>
            </div>
          </aside>
        </section>
      </main>

      {/* Modern Dialog Popup Panel for interview history */}
      <Dialog open={historyJobInfo !== null} onOpenChange={(open) => { if (!open) setHistoryJobInfo(null); }}>
        <DialogContent className="max-w-4xl lg:max-w-5xl h-[85vh] flex flex-col p-0 overflow-hidden rounded-2xl border border-border bg-background shadow-2xl">
          {/* Main header block containing job information */}
          <DialogHeader className="p-5 border-b border-border bg-slate-50/50 dark:bg-card flex flex-row items-center justify-between gap-4">
            <div className="min-w-0">
              <DialogTitle className="text-lg font-bold text-foreground truncate flex items-center gap-2">
                <HistoryIcon className="size-5 text-primary" />
                <span>Lịch sử phỏng vấn AI</span>
              </DialogTitle>
              {historyJobInfo && (
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1.5 text-xs text-muted-foreground">
                  <span className="font-semibold text-slate-700 dark:text-slate-300">
                    Vị trí: {historyJobInfo.title}
                  </span>
                  <span>•</span>
                  <span>Ứng viên: {historyJobInfo.name}</span>
                  {modalMatchScore !== null && (
                    <>
                      <span>•</span>
                      <span className="inline-flex items-center gap-1 text-primary font-semibold">
                        <SparklesIcon className="size-3" />
                        Match Score: {modalMatchScore}%
                      </span>
                    </>
                  )}
                </div>
              )}
            </div>

            {/* Quick action button for new interview */}
            {historyJobInfo && !selectedInterview && (
              <Button
                type="button"
                onClick={() => {
                  setSelectedJobInfo(historyJobInfo);
                  setHistoryJobInfo(null);
                }}
                className="h-9 rounded-xl text-xs font-semibold bg-primary text-primary-foreground hover:bg-primary/95 shrink-0"
              >
                <PlayIcon className="mr-1.5 size-3.5 fill-current" />
                Phỏng vấn mới
              </Button>
            )}
          </DialogHeader>

          {/* Modal Main Body Area */}
          <div className="flex-1 overflow-hidden flex flex-col">
            {loadingHistory ? (
              <div className="flex flex-1 items-center justify-center">
                <Loader2Icon className="size-8 animate-spin text-primary" />
              </div>
            ) : !selectedInterview ? (
              /* TAB A: Historical interview attempts timeline list */
              <div className="flex-1 overflow-y-auto p-6">
                <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200 mb-4 uppercase tracking-wider">
                  Danh sách các lần phỏng vấn trước
                </h3>

                {historyInterviews.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-24 text-center">
                    <div className="flex size-12 items-center justify-center rounded-full bg-slate-100 text-slate-400 dark:bg-muted dark:text-slate-600">
                      <ClockIcon className="size-5" />
                    </div>
                    <p className="mt-3 text-sm font-semibold text-slate-700 dark:text-slate-300">
                      Chưa có lần phỏng vấn nào cho vị trí này
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground max-w-xs">
                      Bấm "Phỏng vấn ngay" để thực hiện lần đầu tiên.
                    </p>
                  </div>
                ) : (
                  <div className="relative border-l border-slate-200 dark:border-border/60 pl-6 ml-3 space-y-6">
                    {historyInterviews.map((interview) => {
                      const hasFeedback = interview.feedback !== null;
                      const hasTranscript = interview.vapiTranscript !== null || interview.humeChatId !== null;
                      const details = parseFeedbackDetails(interview.feedback);

                      return (
                        <div key={interview.id} className="relative group">
                          {/* Timeline dot */}
                          <div className="absolute -left-[31px] top-1.5 flex size-4 items-center justify-center rounded-full border border-background bg-slate-200 group-hover:bg-primary transition-colors dark:bg-muted" />

                          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 rounded-xl border border-border bg-white hover:border-primary/20 hover:shadow-xs transition-all duration-200 dark:bg-card">
                            <div className="space-y-1.5">
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-bold text-slate-800 dark:text-slate-200">
                                  {formatDistanceToNow(new Date(interview.createdAt), {
                                    addSuffix: true,
                                    locale: vi,
                                  })}
                                </span>
                                {hasFeedback ? (
                                  <Badge className="bg-emerald-50 text-emerald-700 border-emerald-100 text-[10px] rounded-md py-0 px-1.5 font-medium">
                                    <CheckCircleIcon className="size-3 mr-1" />
                                    Đã đánh giá
                                  </Badge>
                                ) : hasTranscript ? (
                                  <Badge className="bg-amber-50 text-amber-700 border-amber-100 text-[10px] rounded-md py-0 px-1.5 font-medium">
                                    <ClockIcon className="size-3 mr-1" />
                                    Chờ đánh giá
                                  </Badge>
                                ) : (
                                  <Badge variant="secondary" className="text-[10px] rounded-md py-0 px-1.5 font-medium">
                                    Chưa hoàn tất
                                  </Badge>
                                )}
                              </div>
                              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                                <span>Thời lượng: {interview.duration || "00:00"}</span>
                                {details && (
                                  <>
                                    <span>•</span>
                                    <span className="font-semibold text-slate-700 dark:text-slate-300">
                                      Điểm tổng: {details.overall}/10
                                    </span>
                                  </>
                                )}
                              </div>
                            </div>

                            <Button
                              type="button"
                              variant="outline"
                              onClick={() => {
                                setSelectedInterview(interview);
                              }}
                              className="h-8.5 rounded-lg text-xs font-semibold border-border hover:bg-primary/5 hover:text-primary transition-all self-start md:self-auto"
                            >
                              Xem chi tiết
                              <ArrowRightIcon className="ml-1.5 size-3.5" />
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            ) : (
              /* TAB B: Split Layout - Chat Bubbles + Full Feedback details */
              <div className="flex-1 overflow-hidden flex flex-col h-full bg-slate-50/20 dark:bg-card/20">
                {/* Back bar */}
                <div className="px-5 py-2.5 border-b border-border bg-white dark:bg-card flex items-center justify-between">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedInterview(null)}
                    className="h-8 rounded-lg text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100"
                  >
                    <ChevronLeftIcon className="mr-1 size-4" />
                    Quay lại lịch sử
                  </Button>
                  <span className="text-xs text-muted-foreground font-medium">
                    Thời lượng: {selectedInterview.duration} • {formatDistanceToNow(new Date(selectedInterview.createdAt), { addSuffix: true, locale: vi })}
                  </span>
                </div>

                {/* Grid Split Content */}
                <div className="flex-1 overflow-hidden grid grid-cols-1 md:grid-cols-2">
                  {/* Left Column: Chat Conversation */}
                  <div className="flex flex-col border-r border-border h-full overflow-hidden bg-white dark:bg-card/40">
                    <div className="px-5 py-3 border-b border-border bg-slate-50/40 dark:bg-card/60 flex items-center justify-between">
                      <span className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
                        <MessageSquareTextIcon className="size-4" />
                        Hội thoại phỏng vấn
                      </span>
                    </div>

                    <div className="flex-1 overflow-y-auto p-5 space-y-4">
                      {selectedInterview.vapiTranscript ? (
                        /* Vapi Chat Rendering */
                        (JSON.parse(selectedInterview.vapiTranscript) as Array<{ role: string; content: string }>).map((msg, idx) => (
                          <div
                            key={idx}
                            className={cn(
                              "flex items-start gap-2.5 max-w-[85%]",
                              msg.role === "user" ? "ml-auto flex-row-reverse" : "mr-auto"
                            )}
                          >
                            <div
                              className={cn(
                                "flex size-7 shrink-0 items-center justify-center rounded-full text-[10px] shadow-xs",
                                msg.role === "user" ? "bg-primary text-primary-foreground" : "bg-slate-100 text-slate-700 dark:bg-muted"
                              )}
                            >
                              {msg.role === "user" ? <UserIcon className="size-3.5" /> : "🤖"}
                            </div>
                            <div
                              className={cn(
                                "rounded-xl px-3.5 py-2 text-xs md:text-sm leading-relaxed",
                                msg.role === "user"
                                  ? "bg-primary text-primary-foreground rounded-tr-none"
                                  : "bg-slate-100 text-slate-800 dark:bg-muted dark:text-slate-200 rounded-tl-none"
                              )}
                            >
                              <p className="whitespace-pre-wrap">{msg.content}</p>
                            </div>
                          </div>
                        ))
                      ) : selectedInterview.humeChatId ? (
                        /* Hume Chat Rendering */
                        loadingHumeMessages ? (
                          <div className="flex justify-center py-10">
                            <Loader2Icon className="size-5 animate-spin text-primary" />
                          </div>
                        ) : humeMessages.length > 0 ? (
                          <CondensedMessages
                            messages={humeMessages}
                            user={{
                              name: historyJobInfo?.name || "Ứng viên",
                              imageUrl: "",
                            }}
                            className="text-xs md:text-sm"
                          />
                        ) : (
                          <p className="text-center text-xs text-muted-foreground py-8">
                            Không có dữ liệu tin nhắn Hume.
                          </p>
                        )
                      ) : (
                        <div className="text-center py-12 text-xs text-muted-foreground">
                          Không có dữ liệu cuộc hội thoại.
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right Column: AI Feedback details */}
                  <div className="flex flex-col h-full overflow-hidden bg-slate-50/10 dark:bg-card/10">
                    <div className="px-5 py-3 border-b border-border bg-slate-50/40 dark:bg-card/60">
                      <span className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
                        <SparklesIcon className="size-4 text-violet-500" />
                        Đánh giá & Gợi ý cải thiện
                      </span>
                    </div>

                    <div className="flex-1 overflow-y-auto p-5">
                      {selectedInterview.feedback ? (
                        <div className="space-y-6">
                          {/* Score metrics blocks */}
                          {(() => {
                            const scores = parseFeedbackDetails(selectedInterview.feedback);
                            if (!scores) return null;

                            const metrics = [
                              { label: "Điểm tổng", val: scores.overall },
                              { label: "Điểm giao tiếp", val: scores.communication },
                              { label: "Điểm chuyên môn", val: scores.specialty },
                              { label: "Tư duy tình huống", val: scores.situational },
                              { label: "Phù hợp JD", val: scores.fit },
                            ];

                            return (
                              <div className="rounded-xl border border-border bg-white p-4 shadow-xs dark:bg-card space-y-3">
                                <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                                  Chỉ số đánh giá (Out of 10)
                                </span>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                  {metrics.map((m, i) => (
                                    <div key={i} className="space-y-1">
                                      <div className="flex items-baseline justify-between text-xs font-medium">
                                        <span className="text-slate-700 dark:text-slate-300">{m.label}</span>
                                        <span className="font-bold text-slate-900 dark:text-foreground">{m.val}/10</span>
                                      </div>
                                      <div className="h-1.5 w-full bg-slate-100 rounded-full dark:bg-muted overflow-hidden">
                                        <div
                                          className={cn(
                                            "h-full rounded-full transition-all duration-300",
                                            m.label === "Điểm tổng" ? "bg-primary" : "bg-violet-500"
                                          )}
                                          style={{ width: `${(m.val / 10) * 100}%` }}
                                        />
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            );
                          })()}

                          {/* Render Full Markdown feedback (Strengths, Weaknesses, Suggestions) */}
                          <div className="prose prose-slate dark:prose-invert max-w-none text-xs md:text-sm leading-relaxed border-t pt-4">
                            <MarkdownRenderer>{selectedInterview.feedback}</MarkdownRenderer>
                          </div>
                        </div>
                      ) : (
                        /* Empty or generate feedback panel */
                        <div className="text-center py-16 space-y-4">
                          <p className="text-xs text-muted-foreground">
                            Buổi phỏng vấn này chưa được tạo feedback & đánh giá AI.
                          </p>
                          <Button
                            type="button"
                            disabled={isGeneratingFeedback}
                            onClick={handleGenerateFeedback}
                            className="rounded-xl px-5 text-xs font-semibold bg-primary hover:bg-primary/95 text-white"
                          >
                            {isGeneratingFeedback ? (
                              <>
                                <Loader2Icon className="mr-1.5 size-3.5 animate-spin" />
                                Đang phân tích kết quả...
                              </>
                            ) : (
                              <>
                                <SparklesIcon className="mr-1.5 size-3.5" />
                                Tạo đánh giá AI
                              </>
                            )}
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function InterviewPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center">
        <div className="flex items-center gap-3 rounded-2xl border border-primary/10 bg-primary/5 px-4 py-3 text-sm text-muted-foreground">
          <Loader2Icon className="size-4 animate-spin text-primary" />
          Đang tải trang phỏng vấn...
        </div>
      </div>
    }>
      <InterviewPageContent />
    </Suspense>
  );
}
