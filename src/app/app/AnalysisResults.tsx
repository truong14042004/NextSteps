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
  BriefcaseIcon,
  BrainCircuitIcon,
  ArrowRightIcon,
  FileTextIcon,
  AwardIcon,
  ZapIcon,
  BookOpenIcon,
  MicIcon,
  HelpCircleIcon,
  SmileIcon,
  FrownIcon,
} from "lucide-react";
import Link from "next/link";
import { useMemo } from "react";
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

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="grid gap-6 md:grid-cols-3">
          {[1, 2, 3].map((i) => (
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

  return (
    <div className="space-y-6">
      {/* Overview Metric Widgets */}
      <div className="grid gap-4 md:grid-cols-3 md:items-stretch">
        {/* Overall Score */}
        <div className="group relative flex flex-col overflow-hidden rounded-[24px] border border-border bg-gradient-to-br from-primary/5 via-card to-orange-500/[0.01] p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Điểm đánh giá tổng quát</h4>
            <SparklesIcon className="size-4 text-primary" />
          </div>
          <div className="mt-4 flex items-center gap-4">
            <div className="relative flex size-16 items-center justify-center">
              <svg className="size-full -rotate-90" viewBox="0 0 36 36">
                <path
                  className="text-muted/60 dark:text-muted/30"
                  strokeWidth="3.5"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
                <path
                  className="text-primary transition-all duration-1000 ease-out"
                  strokeWidth="3.5"
                  strokeDasharray={`${overallScore * 10}, 100`}
                  strokeLinecap="round"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
              </svg>
              <div className="absolute text-base font-black text-primary">
                {overallScore}
              </div>
            </div>
            <div>
              <p className="text-2xl font-black text-foreground">{overallScore}/10</p>
              <p className="text-[10px] text-muted-foreground font-medium">Chỉ số đánh giá tổng hợp AI</p>
            </div>
          </div>
        </div>

        {/* ATS score */}
        <div className="group relative flex flex-col overflow-hidden rounded-[24px] border border-border bg-gradient-to-br from-primary/5 via-card to-rose-500/[0.01] p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Tương thích ATS</h4>
            <AwardIcon className="size-4 text-primary" />
          </div>
          <div className="mt-4 flex items-center gap-4">
            <div className="relative flex size-16 items-center justify-center">
              <svg className="size-full -rotate-90" viewBox="0 0 36 36">
                <path
                  className="text-muted/60 dark:text-muted/30"
                  strokeWidth="3.5"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
                <path
                  className="text-primary transition-all duration-1000 ease-out"
                  strokeWidth="3.5"
                  strokeDasharray={`${atsScore * 10}, 100`}
                  strokeLinecap="round"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
              </svg>
              <div className="absolute text-base font-black text-primary">
                {atsScore}
              </div>
            </div>
            <div>
              <p className="text-2xl font-black text-foreground">{atsScore}/10</p>
              <p className="text-[10px] text-muted-foreground font-medium">Độ tối ưu cấu trúc bộ quét</p>
            </div>
          </div>
        </div>

        {/* Match Percentage */}
        <div className="group relative flex flex-col overflow-hidden rounded-[24px] border border-border bg-gradient-to-br from-orange-500/[0.05] via-card to-yellow-500/[0.01] p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Khớp yêu cầu công việc</h4>
            <ZapIcon className="size-4 text-orange-500" />
          </div>
          <div className="mt-4 flex items-center gap-4">
            <div className="relative flex size-16 items-center justify-center">
              <svg className="size-full -rotate-90" viewBox="0 0 36 36">
                <path
                  className="text-muted/60 dark:text-muted/30"
                  strokeWidth="3.5"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
                <path
                  className="text-orange-500 transition-all duration-1000 ease-out"
                  strokeWidth="3.5"
                  strokeDasharray={`${matchScore * 10}, 100`}
                  strokeLinecap="round"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
              </svg>
              <div className="absolute text-sm font-black text-orange-600">
                {matchScore * 10}%
              </div>
            </div>
            <div>
              <p className="text-2xl font-black text-foreground">{matchScore * 10}%</p>
              <p className="text-[10px] text-muted-foreground font-medium">So khớp kỹ năng với JD</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs Menu */}
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="flex w-full flex-nowrap overflow-x-auto gap-1 rounded-2xl border border-border bg-muted p-1">
          <TabsTrigger
            value="overview"
            className="rounded-xl px-4 py-2.5 text-xs font-bold tracking-wide transition-all data-[state=active]:bg-card data-[state=active]:text-primary data-[state=active]:shadow-sm cursor-pointer"
          >
            Tổng quan
          </TabsTrigger>
          <TabsTrigger
            value="strengths"
            className="rounded-xl px-4 py-2.5 text-xs font-bold tracking-wide transition-all data-[state=active]:bg-card data-[state=active]:text-primary data-[state=active]:shadow-sm cursor-pointer"
          >
            Điểm mạnh ({strengths.length})
          </TabsTrigger>
          <TabsTrigger
            value="weaknesses"
            className="rounded-xl px-4 py-2.5 text-xs font-bold tracking-wide transition-all data-[state=active]:bg-card data-[state=active]:text-primary data-[state=active]:shadow-sm cursor-pointer"
          >
            Cần cải thiện ({improvements.length})
          </TabsTrigger>
          <TabsTrigger
            value="recommendations"
            className="rounded-xl px-4 py-2.5 text-xs font-bold tracking-wide transition-all data-[state=active]:bg-card data-[state=active]:text-primary data-[state=active]:shadow-sm cursor-pointer"
          >
            Khuyến nghị
          </TabsTrigger>
          <TabsTrigger
            value="interview"
            className="rounded-xl px-4 py-2.5 text-xs font-bold tracking-wide transition-all data-[state=active]:bg-card data-[state=active]:text-primary data-[state=active]:shadow-sm cursor-pointer"
          >
            Luyện phỏng vấn
          </TabsTrigger>
          <TabsTrigger
            value="quiz"
            className="rounded-xl px-4 py-2.5 text-xs font-bold tracking-wide transition-all data-[state=active]:bg-card data-[state=active]:text-primary data-[state=active]:shadow-sm cursor-pointer"
          >
            Trắc nghiệm
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab Content */}
        <TabsContent value="overview" className="mt-4 space-y-4">
          <Card className="rounded-[24px] border border-border bg-card shadow-sm">
            <CardContent className="p-6">
              <h3 className="text-base  font-bold text-foreground flex items-center gap-2">
                <SparklesIcon className="size-4.5 text-primary fill-primary/10" />
                Đánh giá toàn diện của AI Career Coach
              </h3>

              <div className="mt-6 space-y-5 divide-y divide-border">
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
          <Card className="rounded-[24px] border border-border bg-card shadow-sm">
            <CardContent className="p-6">
              <h3 className="text-base  font-bold text-foreground flex items-center gap-2">
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

        {/* Weaknesses Tab Content */}
        <TabsContent value="weaknesses" className="mt-4">
          <Card className="rounded-[24px] border border-border bg-card shadow-sm">
            <CardContent className="p-6">
              <h3 className="text-base  font-bold text-foreground flex items-center gap-2">
                <AlertTriangleIcon className="size-5 text-amber-500" />
                Điểm thiếu sót & Từ khóa cần bổ sung
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
          <Card className="rounded-[24px] border border-border bg-card shadow-sm">
            <CardContent className="p-6">
              <h3 className="text-base font-bold text-foreground">Lộ trình hành động khắc phục lỗi</h3>
              <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">
                Thực hiện tuần tự các gợi ý tối ưu hóa dưới đây để gia tăng tỷ lệ vượt qua hệ thống ATS tự động:
              </p>

              <div className="mt-6 space-y-4">
                {improvements.map((item, index) => (
                  <div key={index} className="flex gap-4 items-start bg-muted/30 p-4 rounded-xl border border-border">
                    <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary  font-bold text-xs">
                      {index + 1}
                    </div>
                    <div>
                      <h4 className="font-bold text-foreground text-sm">{item.name}</h4>
                      <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
                        {item.message}
                      </p>
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

        {/* Interview Preparation Tab */}
        <TabsContent value="interview" className="mt-4">
          <Card className="rounded-[24px] border border-border bg-card shadow-sm">
            <CardContent className="p-6">
              <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <h3 className="text-base  font-bold text-foreground flex items-center gap-2">
                    <MicIcon className="size-5 text-primary" />
                    Luyện phỏng vấn mô phỏng thoại tự nhiên
                  </h3>
                  <p className="text-xs text-muted-foreground mt-1 max-w-2xl leading-relaxed">
                    Dựa trên thông tin CV của bạn và yêu cầu của JD, AI Career Coach đã thiết kế sẵn các tình huống phỏng vấn mô phỏng. Bắt đầu hội thoại ngay để nâng cao phản xạ trả lời.
                  </p>
                </div>

                {jobInfoId ? (
                  <Button asChild className="rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-bold shrink-0 shadow-sm shadow-primary/10 cursor-pointer">
                    <Link href={`/app/job-infos/${jobInfoId}/interviews/new`}>
                      Hội thoại với AI
                      <ArrowRightIcon className="ml-2 size-4" />
                    </Link>
                  </Button>
                ) : (
                  <Button disabled className="rounded-xl font-bold shrink-0">
                    Lưu phân tích trước khi phỏng vấn
                  </Button>
                )}
              </div>

              <div className="mt-8 grid gap-4 md:grid-cols-2">
                <div className="rounded-2xl border border-border bg-muted/10 p-5">
                  <div className="flex items-center gap-2 font-bold text-foreground text-sm">
                    <BrainCircuitIcon className="size-4 text-primary" />
                    Câu hỏi kỹ thuật (Technical) dự tính
                  </div>
                  <ul className="mt-3.5 space-y-2 text-xs text-muted-foreground list-disc list-inside leading-relaxed">
                    <li>Câu hỏi về các công nghệ cốt lõi yêu cầu trong JD.</li>
                    <li>Giải quyết bài toán thực tế dựa trên kinh nghiệm ghi trong CV.</li>
                    <li>Cách tối ưu hóa hiệu năng hệ thống hoặc giải quyết bug lớn.</li>
                  </ul>
                </div>

                <div className="rounded-2xl border border-border bg-muted/10 p-5">
                  <div className="flex items-center gap-2 font-bold text-foreground text-sm">
                    <HelpCircleIcon className="size-4 text-primary" />
                    Câu hỏi hành vi (Behavioral) dự tính
                  </div>
                  <ul className="mt-3.5 space-y-2 text-xs text-muted-foreground list-disc list-inside leading-relaxed">
                    <li>Cách làm việc nhóm và giải quyết mâu thuẫn trong dự án cũ.</li>
                    <li>Cách tiếp nhận ý kiến đóng góp và cải thiện bản thân.</li>
                    <li>Giải thích các cột mốc quan trọng trong quá trình làm việc của bạn.</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Quiz Preparation Tab */}
        <TabsContent value="quiz" className="mt-4">
          <Card className="rounded-[24px] border border-border bg-card shadow-sm">
            <CardContent className="p-6">
              <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <h3 className="text-base  font-bold text-foreground flex items-center gap-2">
                    <BookOpenIcon className="size-5 text-primary" />
                    Tạo đề trắc nghiệm AI ôn luyện kỹ năng
                  </h3>
                  <p className="text-xs text-muted-foreground mt-1 max-w-2xl leading-relaxed">
                    Kiểm tra ngay kiến thức chuyên môn cốt lõi thông qua bộ câu hỏi trắc nghiệm gồm 30 câu (45 phút) được AI tạo tự động dựa trên CV và JD của bạn.
                  </p>
                </div>

                {jobInfoId ? (
                  <Button asChild className="rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-bold shrink-0 shadow-sm shadow-primary/10 cursor-pointer">
                    <Link href={`/app/job-infos/${jobInfoId}/quizzes/new`}>
                      Tạo bộ trắc nghiệm
                      <ArrowRightIcon className="ml-2 size-4" />
                    </Link>
                  </Button>
                ) : (
                  <Button disabled className="rounded-xl font-bold shrink-0">
                    Lưu phân tích trước để tạo Quiz
                  </Button>
                )}
              </div>

              <div className="mt-8 rounded-2xl border border-border bg-muted/10 p-5">
                <h4 className="font-bold text-foreground text-sm flex items-center gap-2">
                  <ZapIcon className="size-4 text-primary fill-primary/15" />
                  Thông tin cấu trúc bộ đề trắc nghiệm
                </h4>

                <div className="mt-4 grid gap-4 sm:grid-cols-3 text-center">
                  <div className="rounded-xl bg-card p-3.5 shadow-sm border border-border">
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider  font-bold">Độ khó ước tính</p>
                    <p className="mt-1 text-xs  font-bold text-primary">Trung bình - Khó</p>
                  </div>
                  <div className="rounded-xl bg-card p-3.5 shadow-sm border border-border">
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider  font-bold">Số lượng câu hỏi</p>
                    <p className="mt-1 text-xs  font-bold text-primary">30 câu trắc nghiệm</p>
                  </div>
                  <div className="rounded-xl bg-card p-3.5 shadow-sm border border-border">
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider  font-bold">Thời gian làm bài</p>
                    <p className="mt-1 text-xs  font-bold text-primary">45 phút</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
