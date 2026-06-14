"use client";

import { Skeleton } from "@/components/Skeleton";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { aiAnalyzeSchema } from "@/services/ai/resumes/schemas";
import { DeepPartial } from "ai";
import {
  CheckCircle2Icon,
  AlertTriangleIcon,
  XCircleIcon,
  SparklesIcon,
  BrainCircuitIcon,
  ArrowRightIcon,
  AwardIcon,
  ZapIcon,
  BookOpenIcon,
  MicIcon,
  SmileIcon,
  FrownIcon,
  TrendingUpIcon,
  CheckIcon,
  XIcon,
  AlertOctagonIcon,
  HelpCircleIcon,
} from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import z from "zod";

type Keys = Exclude<keyof z.infer<typeof aiAnalyzeSchema>, "overallScore">;

interface AnalysisResultsProps {
  aiAnalysis: DeepPartial<z.infer<typeof aiAnalyzeSchema>> | undefined;
  isLoading: boolean;
  jobInfoId?: string | null;
}

export function AnalysisResults({
  aiAnalysis,
  isLoading,
  jobInfoId,
}: AnalysisResultsProps) {
  const [activeTab, setActiveTab] = useState("overview");

  const sections: Record<Keys, string> = {
    ats: "Tương thích ATS",
    jobMatch: "Mức độ phù hợp công việc",
    writingAndFormatting: "Viết & Trình bày",
    keywordCoverage: "Mức độ bao phủ từ khóa",
    other: "Nhận xét bổ sung",
  };

  // Flatten and extract all strengths
  const strengths = useMemo(() => {
    if (!aiAnalysis) return [];
    const list: Array<{ category: string; name: string; message: string }> = [];
    Object.entries(sections).forEach(([key, label]) => {
      const category = aiAnalysis[key as Keys];
      if (category?.feedback) {
        category.feedback.forEach((item) => {
          if (item?.type === "strength" && item.name && item.message) {
            list.push({ category: label, name: item.name, message: item.message });
          }
        });
      }
    });
    return list;
  }, [aiAnalysis]);

  // Flatten and extract all weaknesses & improvements
  const improvements = useMemo(() => {
    if (!aiAnalysis) return [];
    const list: Array<{
      category: string;
      name: string;
      message: string;
      type: "minor-improvement" | "major-improvement";
    }> = [];
    Object.entries(sections).forEach(([key, label]) => {
      const category = aiAnalysis[key as Keys];
      if (category?.feedback) {
        category.feedback.forEach((item) => {
          if (
            (item?.type === "minor-improvement" || item?.type === "major-improvement") &&
            item.name &&
            item.message
          ) {
            list.push({
              category: label,
              name: item.name,
              message: item.message,
              type: item.type as "minor-improvement" | "major-improvement",
            });
          }
        });
      }
    });
    return list;
  }, [aiAnalysis]);

  // Dynamic values
  const overallScore = aiAnalysis?.overallScore ?? 0;
  const atsScore = aiAnalysis?.ats?.score ?? 0;
  const matchScore = aiAnalysis?.jobMatch?.score ?? 0;
  const readinessScore = Math.min(Math.round(((overallScore + matchScore) / 2) * 10), 100);

  // Derive dynamic details for AI Coach Summary
  const strengthsList = useMemo(() => strengths.slice(0, 3).map((s) => s.name), [strengths]);
  const weaknessesList = useMemo(
    () => improvements.filter((i) => i.type === "major-improvement").slice(0, 3).map((i) => i.name),
    [improvements]
  );
  const missingSkillsList = useMemo(() => {
    // Collect feedbacks from keywordCoverage or jobMatch that are improvements
    const keywordsFeedback = aiAnalysis?.keywordCoverage?.feedback ?? [];
    const matchFeedback = aiAnalysis?.jobMatch?.feedback ?? [];
    const merged = [...keywordsFeedback, ...matchFeedback];
    return merged
      .filter((item) => item?.type === "major-improvement" || item?.type === "minor-improvement")
      .slice(0, 3)
      .map((item) => item?.name ?? "");
  }, [aiAnalysis]);

  const proposedRecommendations = useMemo(() => {
    return improvements.slice(0, 3).map((i) => i.message);
  }, [improvements]);

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="grid gap-6 md:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="rounded-[24px] border border-border bg-card p-6">
              <Skeleton className="h-4 w-32 mb-4" />
              <div className="flex items-center gap-4">
                <Skeleton className="size-16 rounded-full" />
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-6 w-16" />
                  <Skeleton className="h-3 w-28" />
                </div>
              </div>
            </div>
          ))}
        </div>
        <Skeleton className="h-11 w-full rounded-xl" />
        <Card className="rounded-[24px] border-none bg-muted/40">
          <CardContent className="p-6 space-y-4">
            <Skeleton className="h-5 w-48" />
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!aiAnalysis) return null;

  // Color helper for progress bar
  const getProgressBarColor = (score: number, max = 10) => {
    const ratio = score / max;
    if (ratio >= 0.8) return "bg-emerald-500";
    if (ratio >= 0.6) return "bg-amber-500";
    return "bg-primary"; // primary #b30500 red color for warnings/lows
  };

  return (
    <div className="space-y-6">
      {/* 4 Summary Score Cards (same style as Interview KPI cards) */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Card 1: Overall Score */}
        <div className="group rounded-2xl border border-slate-100 bg-white p-5 shadow-xs transition-all duration-300 hover:-translate-y-1 hover:shadow-md dark:border-border/60 dark:bg-card">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-muted-foreground">Overall Score</span>
            <div className="flex size-9 items-center justify-center rounded-xl bg-primary/5 text-primary">
              <SparklesIcon className="size-4.5" />
            </div>
          </div>
          <div className="mt-4">
            <span className="text-2xl font-bold text-foreground">{overallScore}/10</span>
            <span className="ml-1.5 text-xs text-muted-foreground">Chỉ số đánh giá tổng hợp</span>
          </div>
          <div className="mt-3.5 h-1.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-muted">
            <div
              className={cn("h-full rounded-full transition-all duration-500", getProgressBarColor(overallScore))}
              style={{ width: `${overallScore * 10}%` }}
            />
          </div>
        </div>

        {/* Card 2: ATS Score */}
        <div className="group rounded-2xl border border-slate-100 bg-white p-5 shadow-xs transition-all duration-300 hover:-translate-y-1 hover:shadow-md dark:border-border/60 dark:bg-card">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-muted-foreground">ATS Score</span>
            <div className="flex size-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/20 dark:text-emerald-400">
              <AwardIcon className="size-4.5" />
            </div>
          </div>
          <div className="mt-4">
            <span className="text-2xl font-bold text-foreground">{atsScore}/10</span>
            <span className="ml-1.5 text-xs text-muted-foreground">Độ tối ưu cấu trúc bộ lọc</span>
          </div>
          <div className="mt-3.5 h-1.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-muted">
            <div
              className={cn("h-full rounded-full transition-all duration-500", getProgressBarColor(atsScore))}
              style={{ width: `${atsScore * 10}%` }}
            />
          </div>
        </div>

        {/* Card 3: Job Match */}
        <div className="group rounded-2xl border border-slate-100 bg-white p-5 shadow-xs transition-all duration-300 hover:-translate-y-1 hover:shadow-md dark:border-border/60 dark:bg-card">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-muted-foreground">Job Match</span>
            <div className="flex size-9 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950/20 dark:text-blue-400">
              <ZapIcon className="size-4.5" />
            </div>
          </div>
          <div className="mt-4">
            <span className="text-2xl font-bold text-foreground">{matchScore * 10}%</span>
            <span className="ml-1.5 text-xs text-muted-foreground">So khớp kỹ năng với JD</span>
          </div>
          <div className="mt-3.5 h-1.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-muted">
            <div
              className={cn("h-full rounded-full transition-all duration-500", getProgressBarColor(matchScore * 10, 100))}
              style={{ width: `${matchScore * 10}%` }}
            />
          </div>
        </div>

        {/* Card 4: Interview Readiness */}
        <div className="group rounded-2xl border border-slate-100 bg-white p-5 shadow-xs transition-all duration-300 hover:-translate-y-1 hover:shadow-md dark:border-border/60 dark:bg-card">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-muted-foreground">Interview Readiness</span>
            <div className="flex size-9 items-center justify-center rounded-xl bg-purple-50 text-purple-600 dark:bg-purple-950/20 dark:text-purple-400">
              <SmileIcon className="size-4.5" />
            </div>
          </div>
          <div className="mt-4">
            <span className="text-2xl font-bold text-foreground">{readinessScore}%</span>
            <span className="ml-1.5 text-xs text-muted-foreground">Khả năng tự tin ứng tuyển</span>
          </div>
          <div className="mt-3.5 h-1.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-muted">
            <div
              className={cn("h-full rounded-full transition-all duration-500", getProgressBarColor(readinessScore, 100))}
              style={{ width: `${readinessScore}%` }}
            />
          </div>
        </div>
      </div>

      {/* AI Career Coach Summary - Checklist Redesign */}
      <Card className="rounded-[28px] border border-primary/10 bg-white dark:bg-card shadow-sm overflow-hidden">
        <CardContent className="p-6">
          <div className="flex items-center gap-2 mb-6 border-b border-slate-100 dark:border-border/60 pb-4">
            <div className="rounded-xl bg-primary/10 p-2 text-primary">
              <SparklesIcon className="size-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-foreground">AI Career Coach Summary</h3>
              <p className="text-xs text-muted-foreground">Nhận định & lộ trình tổng quát tối ưu chất lượng hồ sơ ứng tuyển</p>
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {/* Column 1: Điểm mạnh */}
            <div className="space-y-3.5">
              <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5 uppercase tracking-wide">
                <CheckCircle2Icon className="size-4 text-emerald-500" /> Điểm mạnh
              </span>
              <ul className="space-y-2.5">
                {strengthsList.length > 0 ? (
                  strengthsList.map((str, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-xs text-muted-foreground leading-relaxed">
                      <CheckIcon className="size-3.5 text-emerald-500 shrink-0 mt-0.5" />
                      <span>{str}</span>
                    </li>
                  ))
                ) : (
                  <li className="text-xs italic text-muted-foreground/60">Không phát hiện</li>
                )}
              </ul>
            </div>

            {/* Column 2: Điểm yếu */}
            <div className="space-y-3.5">
              <span className="text-xs font-bold text-red-650 dark:text-red-400 flex items-center gap-1.5 uppercase tracking-wide">
                <XCircleIcon className="size-4 text-primary" /> Điểm yếu
              </span>
              <ul className="space-y-2.5">
                {weaknessesList.length > 0 ? (
                  weaknessesList.map((weak, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-xs text-muted-foreground leading-relaxed">
                      <XIcon className="size-3.5 text-primary shrink-0 mt-0.5" />
                      <span>{weak}</span>
                    </li>
                  ))
                ) : (
                  <li className="text-xs text-emerald-600 font-medium flex items-center gap-1">
                    <CheckIcon className="size-3.5" /> Không có lỗi lớn
                  </li>
                )}
              </ul>
            </div>

            {/* Column 3: Kỹ năng còn thiếu */}
            <div className="space-y-3.5">
              <span className="text-xs font-bold text-amber-600 dark:text-amber-400 flex items-center gap-1.5 uppercase tracking-wide">
                <AlertTriangleIcon className="size-4 text-amber-500" /> Kỹ năng còn thiếu
              </span>
              <ul className="space-y-2.5">
                {missingSkillsList.length > 0 ? (
                  missingSkillsList.map((skill, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-xs text-muted-foreground leading-relaxed">
                      <AlertOctagonIcon className="size-3.5 text-amber-500 shrink-0 mt-0.5" />
                      <span>{skill}</span>
                    </li>
                  ))
                ) : (
                  <li className="text-xs text-emerald-600 font-medium flex items-center gap-1">
                    <CheckIcon className="size-3.5" /> Đáp ứng đủ kỹ năng
                  </li>
                )}
              </ul>
            </div>

            {/* Column 4: Đề xuất cải thiện */}
            <div className="space-y-3.5">
              <span className="text-xs font-bold text-blue-600 dark:text-blue-400 flex items-center gap-1.5 uppercase tracking-wide">
                <HelpCircleIcon className="size-4 text-blue-500" /> Đề xuất cải thiện
              </span>
              <ul className="space-y-2.5">
                {proposedRecommendations.length > 0 ? (
                  proposedRecommendations.map((rec, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-xs text-muted-foreground leading-relaxed">
                      <ArrowRightIcon className="size-3.5 text-blue-500 shrink-0 mt-0.5" />
                      <span>{rec}</span>
                    </li>
                  ))
                ) : (
                  <li className="text-xs text-emerald-600 font-medium">Sẵn sàng ứng tuyển</li>
                )}
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs Menu */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="flex w-full flex-nowrap overflow-x-auto gap-1 rounded-2xl border border-border/60 bg-muted/65 p-1">
          <TabsTrigger
            value="overview"
            className="rounded-xl px-4 py-2.5 text-xs font-bold tracking-wide transition-all data-[state=active]:bg-white dark:data-[state=active]:bg-card data-[state=active]:text-primary data-[state=active]:shadow-sm cursor-pointer"
          >
            Tổng kết
          </TabsTrigger>
          <TabsTrigger
            value="strengths"
            className="rounded-xl px-4 py-2.5 text-xs font-bold tracking-wide transition-all data-[state=active]:bg-white dark:data-[state=active]:bg-card data-[state=active]:text-primary data-[state=active]:shadow-sm cursor-pointer"
          >
            Điểm mạnh ({strengths.length})
          </TabsTrigger>
          <TabsTrigger
            value="improvements"
            className="rounded-xl px-4 py-2.5 text-xs font-bold tracking-wide transition-all data-[state=active]:bg-white dark:data-[state=active]:bg-card data-[state=active]:text-primary data-[state=active]:shadow-sm cursor-pointer"
          >
            Cải thiện ({improvements.length})
          </TabsTrigger>
          <TabsTrigger
            value="recommendations"
            className="rounded-xl px-4 py-2.5 text-xs font-bold tracking-wide transition-all data-[state=active]:bg-white dark:data-[state=active]:bg-card data-[state=active]:text-primary data-[state=active]:shadow-sm cursor-pointer"
          >
            Khuyến nghị
          </TabsTrigger>
          <TabsTrigger
            value="actions"
            className="rounded-xl px-4 py-2.5 text-xs font-bold tracking-wide transition-all data-[state=active]:bg-white dark:data-[state=active]:bg-card data-[state=active]:text-primary data-[state=active]:shadow-sm cursor-pointer"
          >
            Hành động
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab Content */}
        <TabsContent value="overview" className="mt-4 space-y-4">
          <Card className="rounded-[24px] border border-border/60 bg-white dark:bg-card shadow-sm">
            <CardContent className="p-6">
              <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                <SparklesIcon className="size-4.5 text-primary fill-primary/10" />
                Đánh giá toàn diện của AI Career Coach
              </h3>

              <div className="mt-6 space-y-5 divide-y divide-border/60">
                {Object.entries(sections).map(([key, label]) => {
                  const category = aiAnalysis[key as Keys];
                  if (!category) return null;
                  return (
                    <div key={key} className="pt-5 first:pt-0">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-bold text-foreground/90">{label}</span>
                        <Badge
                          variant="secondary"
                          className={cn(
                            "rounded-full px-2.5 py-0.5 text-xs font-bold",
                            category.score && category.score >= 8
                              ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-450 border-none"
                              : category.score && category.score >= 6
                                ? "bg-amber-500/10 text-amber-600 dark:text-amber-450 border-none"
                                : "bg-destructive/10 text-destructive dark:text-red-400 border-none"
                          )}
                        >
                          {category.score ? `${category.score}/10` : "N/A"}
                        </Badge>
                      </div>
                      <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                        {category.summary}
                      </p>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Strengths Tab Content */}
        <TabsContent value="strengths" className="mt-4">
          <Card className="rounded-[24px] border border-border/60 bg-white dark:bg-card shadow-sm">
            <CardContent className="p-6">
              <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                <CheckCircle2Icon className="size-5 text-emerald-500" />
                Điểm mạnh & Sự phù hợp nổi bật
              </h3>

              {strengths.length === 0 ? (
                <div className="flex flex-col items-center justify-center gap-2 py-12 text-center text-muted-foreground">
                  <FrownIcon className="size-8 text-muted-foreground" />
                  <p className="text-sm font-semibold">Chưa phát hiện điểm nổi bật nổi trội</p>
                </div>
              ) : (
                <div className="mt-5 grid gap-4 md:grid-cols-2">
                  {strengths.map((item, index) => (
                    <div
                      key={index}
                      className="rounded-2xl border border-emerald-500/20 bg-emerald-500/[0.02] p-4.5 flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-center justify-between gap-2 flex-wrap">
                          <h4 className="font-bold text-emerald-600 dark:text-emerald-400 text-sm">
                            {item.name}
                          </h4>
                          <Badge className="bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 border-none text-[9px] rounded-md font-bold uppercase tracking-wider">
                            {item.category}
                          </Badge>
                        </div>
                        <p className="mt-2.5 text-xs leading-relaxed text-muted-foreground">
                          {item.message}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Improvements Tab Content */}
        <TabsContent value="improvements" className="mt-4 space-y-6">
          <Card className="rounded-[24px] border border-border/60 bg-white dark:bg-card shadow-sm">
            <CardContent className="p-6">
              <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                <AlertTriangleIcon className="size-5 text-amber-500" />
                Điểm thiếu sót & Đề xuất cải thiện
              </h3>

              {improvements.length === 0 ? (
                <div className="flex flex-col items-center justify-center gap-2 py-12 text-center text-muted-foreground">
                  <SmileIcon className="size-8 text-emerald-500" />
                  <p className="text-sm font-semibold text-emerald-600">CV của bạn rất xuất sắc, không phát hiện lỗi lớn nào!</p>
                </div>
              ) : (
                <div className="mt-5 space-y-3">
                  {improvements.map((item, index) => (
                    <div
                      key={index}
                      className={cn(
                        "flex items-start gap-4 rounded-2xl border p-4.5 transition-all",
                        item.type === "major-improvement"
                          ? "border-destructive/20 bg-destructive/[0.02]"
                          : "border-amber-500/20 bg-amber-500/[0.02]"
                      )}
                    >
                      {item.type === "major-improvement" ? (
                        <XCircleIcon className="size-5 text-destructive shrink-0 mt-0.5" />
                      ) : (
                        <AlertTriangleIcon className="size-5 text-amber-500 shrink-0 mt-0.5" />
                      )}

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between flex-wrap gap-2">
                          <h4
                            className={cn(
                              "font-bold text-sm",
                              item.type === "major-improvement"
                                ? "text-destructive"
                                : "text-amber-600 dark:text-amber-400"
                            )}
                          >
                            {item.name}
                          </h4>

                          <div className="flex gap-2">
                            <Badge className="bg-muted text-muted-foreground hover:bg-muted/80 text-[9px] rounded-md font-bold uppercase tracking-wider border border-border">
                              {item.category}
                            </Badge>
                            <Badge
                              className={cn(
                                "text-[9px] rounded-md font-bold uppercase tracking-wider border-none",
                                item.type === "major-improvement"
                                  ? "bg-destructive/10 text-destructive"
                                  : "bg-amber-500/10 text-amber-600"
                              )}
                            >
                              {item.type === "major-improvement" ? "Khắc phục gấp" : "Khuyên sửa đổi"}
                            </Badge>
                          </div>
                        </div>
                        <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                          {item.message}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

        </TabsContent>

        {/* Recommendations Tab Content */}
        <TabsContent value="recommendations" className="mt-4">
          <Card className="rounded-[24px] border border-border/60 bg-white dark:bg-card shadow-sm">
            <CardContent className="p-6">
              <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                <ArrowRightIcon className="size-4.5 text-primary" />
                Lộ trình hành động khắc phục lỗi
              </h3>
              <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">
                Thực hiện tuần tự các gợi ý tối ưu hóa dưới đây để gia tăng tỷ lệ vượt qua hệ thống ATS tự động:
              </p>
              <div className="mt-6 space-y-4">
                {improvements.map((item, index) => (
                  <div key={index} className="flex gap-4 items-start bg-muted/30 p-4 rounded-xl border border-border">
                    <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-xs">
                      {index + 1}
                    </div>
                    <div>
                      <h4 className="font-bold text-foreground text-sm">{item.name}</h4>
                      <p className="mt-1 text-xs text-muted-foreground leading-relaxed">{item.message}</p>
                    </div>
                  </div>
                ))}
                {improvements.length === 0 && (
                  <p className="text-xs text-muted-foreground text-center py-8">
                    Không có đề xuất hành động nào! CV của bạn đã đạt độ tương thích ATS hoàn hảo.
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Action Center Tab Content */}
        <TabsContent value="actions" className="mt-4">
          <div className="grid gap-6 sm:grid-cols-3">
            {/* Card 1: Mock Interview */}
            <Card className="rounded-[24px] border border-border/60 bg-white dark:bg-card shadow-sm flex flex-col justify-between p-5">
              <div className="space-y-3">
                <div className="rounded-2xl bg-primary/10 text-primary p-3 w-fit">
                  <MicIcon className="size-6" />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-foreground">Mock Interview</h4>
                  <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                    Luyện phỏng vấn thử giọng nói, trả lời tự nhiên theo CV và JD vị trí này.
                  </p>
                </div>
              </div>

              <div className="mt-6">
                {jobInfoId ? (
                  <Button asChild className="w-full rounded-xl bg-primary hover:bg-primary/95 text-primary-foreground font-bold shadow-sm shadow-primary/10 cursor-pointer text-xs h-9">
                    <Link href={`/app/interview?jobInfoId=${jobInfoId}`}>
                      Bắt đầu phỏng vấn
                      <ArrowRightIcon className="ml-1.5 size-3.5" />
                    </Link>
                  </Button>
                ) : (
                  <Button disabled className="w-full rounded-xl font-bold text-xs h-9">
                    Yêu cầu lưu phân tích
                  </Button>
                )}
              </div>
            </Card>

            {/* Card 2: AI Quiz */}
            <Card className="rounded-[24px] border border-border/60 bg-white dark:bg-card shadow-sm flex flex-col justify-between p-5">
              <div className="space-y-3">
                <div className="rounded-2xl bg-sky-500/10 text-sky-600 dark:text-sky-400 p-3 w-fit">
                  <BookOpenIcon className="size-6" />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-foreground">AI Quiz</h4>
                  <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                    Tạo đề trắc nghiệm ôn luyện kỹ năng chuyên môn từ dữ liệu so khớp.
                  </p>
                </div>
              </div>

              <div className="mt-6">
                {jobInfoId ? (
                  <Button asChild className="w-full rounded-xl bg-primary hover:bg-primary/95 text-primary-foreground font-bold shadow-sm shadow-primary/10 cursor-pointer text-xs h-9">
                    <Link href={`/app/job-infos/${jobInfoId}/quizzes/new`}>
                      Tạo Quiz
                      <ArrowRightIcon className="ml-1.5 size-3.5" />
                    </Link>
                  </Button>
                ) : (
                  <Button disabled className="w-full rounded-xl font-bold text-xs h-9">
                    Yêu cầu lưu phân tích
                  </Button>
                )}
              </div>
            </Card>

            {/* Card 3: Improve CV */}
            <Card className="rounded-[24px] border border-border/60 bg-white dark:bg-card shadow-sm flex flex-col justify-between p-5">
              <div className="space-y-3">
                <div className="rounded-2xl bg-purple-500/10 text-purple-600 dark:text-purple-400 p-3 w-fit">
                  <TrendingUpIcon className="size-6" />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-foreground">Improve CV</h4>
                  <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                    Xem lại toàn bộ chỉ mục đề xuất và kế hoạch nâng cấp chất lượng CV.
                  </p>
                </div>
              </div>

              <div className="mt-6">
                <Button
                  onClick={() => setActiveTab("improvements")}
                  className="w-full rounded-xl bg-primary hover:bg-primary/95 text-primary-foreground font-bold shadow-sm shadow-primary/10 cursor-pointer text-xs h-9"
                >
                  Xem đề xuất
                  <ArrowRightIcon className="ml-1.5 size-3.5" />
                </Button>
              </div>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
