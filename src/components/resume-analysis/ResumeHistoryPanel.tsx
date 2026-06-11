"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { format, formatDistanceToNow } from "date-fns";
import { vi } from "date-fns/locale";
import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { formatExperienceLevel } from "@/features/jobInfos/lib/formatters";
import { type ExperienceLevel } from "@/drizzle/schema/jobInfo";
import { AnalysisResults } from "@/app/app/AnalysisResults";
import {
  ChevronRightIcon,
  CheckIcon,
  ClockIcon,
  FileTextIcon,
  PencilIcon,
  RefreshCwIcon,
  SearchIcon,
  FilterIcon,
  BrainIcon,
  CalendarIcon,
  AwardIcon,
  ZapIcon,
  EyeIcon,
  EyeOffIcon,
} from "lucide-react";
import { useResumeHistory } from "@/hooks/useResumeHistory";

export function ResumeHistoryPanel({
  isActive,
  usageUsed,
  historyState,
}: {
  isActive: boolean;
  usageUsed: number;
  historyState: ReturnType<typeof useResumeHistory>;
}) {
  const [searchQuery, setSearchQuery] = useState("");
  const [levelFilter, setLevelFilter] = useState("all");
  const router = useRouter();

  const filteredHistory = useMemo(() => {
    if (!historyState.history) return [];
    return historyState.history.filter((item) => {
      const nameMatch = item.name
        ?.toLowerCase()
        .includes(searchQuery.toLowerCase());
      const titleMatch = item.title
        ?.toLowerCase()
        .includes(searchQuery.toLowerCase());
      const matchesSearch = nameMatch || titleMatch;

      const matchesLevel =
        levelFilter === "all" || item.experienceLevel === levelFilter;

      return matchesSearch && matchesLevel;
    });
  }, [historyState.history, searchQuery, levelFilter]);

  const historyCount = useMemo(() => filteredHistory.length, [filteredHistory]);

  return (
    <section className="overflow-hidden rounded-[28px] border border-border/60 bg-white dark:bg-card p-6 shadow-sm">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-foreground">
            Lịch sử phân tích
          </h2>
          <p className="mt-1 text-xs text-muted-foreground">
            Xem lại toàn bộ hồ sơ CV và yêu cầu JD đã thực hiện phân tích trước
            đây.
          </p>
        </div>
        <Badge className="rounded-full border border-primary/20 bg-primary/10 px-3 py-1 font-semibold text-primary">
          Đã thực hiện: {usageUsed} lượt
        </Badge>
      </div>

      {/* Search and Filter UI */}
      <div className="mb-6 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <SearchIcon className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Tìm theo tên ứng viên hoặc vị trí..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 h-10 rounded-xl border-border/60 bg-muted/20 focus:bg-card"
          />
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <FilterIcon className="size-4 text-muted-foreground hidden sm:block" />
          <select
            value={levelFilter}
            onChange={(e) => setLevelFilter(e.target.value)}
            className="h-10 rounded-xl border border-border/60 bg-muted/20 px-3 text-xs font-semibold text-muted-foreground focus:border-primary focus:bg-card focus:outline-none cursor-pointer"
          >
            <option value="all">Tất cả cấp độ</option>
            <option value="intern">Intern</option>
            <option value="fresh">Fresh</option>
            <option value="junior">Junior</option>
            <option value="mid-level">Mid-Level</option>
            <option value="senior">Senior</option>
          </select>
        </div>
      </div>

      {historyState.historyLoading ? (
        <div className="grid gap-6 md:grid-cols-2">
          {[1, 2, 3, 4].map((item) => (
            <div
              key={item}
              className="h-44 animate-pulse rounded-[28px] border border-slate-100 bg-muted/40"
            />
          ))}
        </div>
      ) : historyState.history == null || historyState.history.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 py-16 text-center text-muted-foreground">
          <div className="rounded-full bg-primary/10 p-4 text-primary">
            <ClockIcon className="size-8" />
          </div>
          <div>
            <p className="text-sm font-bold text-foreground">
              Chưa có lịch sử phân tích
            </p>
            <p className="mt-1 text-xs">
              Hãy tạo phân tích đầu tiên tại tab “Tạo phân tích mới”.
            </p>
          </div>
        </div>
      ) : historyCount === 0 ? (
        <div className="flex flex-col items-center justify-center gap-2 py-12 text-center text-muted-foreground">
          <p className="text-sm font-semibold">
            Không tìm thấy kết quả phù hợp
          </p>
          <p className="text-xs">
            Vui lòng thay đổi từ khóa tìm kiếm hoặc bộ lọc.
          </p>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2">
          {filteredHistory.map((item) => {
            const parsed = item.analysisResult
              ? (() => {
                  try {
                    return JSON.parse(item.analysisResult!);
                  } catch {
                    return null;
                  }
                })()
              : null;

            const isExpanded = historyState.expandedId === item.id;
            const isEditing = historyState.editingId === item.id;

            return (
              <div
                key={item.id}
                className={cn(
                  "group relative overflow-hidden rounded-[28px] border border-slate-100 bg-white p-5 shadow-sm transition-all duration-300 hover:shadow-md dark:border-border/60 dark:bg-card flex flex-col justify-between",
                  isExpanded && "ring-1 ring-primary/20 md:col-span-2",
                )}
              >
                <div className="space-y-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-1 min-w-0">
                      <h3 className="font-bold text-foreground text-base truncate">
                        {item.name}
                      </h3>
                      {item.title && (
                        <p className="text-xs text-muted-foreground flex items-center gap-1.5 truncate">
                          <BrainIcon className="size-3.5 text-primary shrink-0" />
                          {item.title}
                        </p>
                      )}
                      <p className="text-[10px] text-muted-foreground/80 font-semibold font-mono uppercase">
                        Cấp độ: {formatExperienceLevel(item.experienceLevel)}
                      </p>
                    </div>

                    <Badge
                      className={cn(
                        "rounded-full px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-wider shrink-0",
                        parsed
                          ? "bg-emerald-500/15 text-emerald-600 border-none"
                          : "bg-slate-100 text-slate-500 border-none dark:bg-muted dark:text-muted-foreground",
                      )}
                    >
                      {parsed ? "Đã đánh giá" : "Chờ kết quả"}
                    </Badge>
                  </div>

                  {/* Quiz-like Stats Grid */}
                  <div className="grid grid-cols-3 gap-3 rounded-2xl bg-slate-50/50 p-3.5 dark:bg-background/40">
                    <div>
                      <span className="block text-[9px] text-muted-foreground uppercase tracking-wider font-bold flex items-center gap-1">
                        <AwardIcon className="size-3 text-emerald-500" /> ATS
                      </span>
                      <span className="text-xs font-bold text-foreground mt-0.5 block">
                        {parsed?.ats?.score != null
                          ? `${parsed.ats.score}/10`
                          : "--"}
                      </span>
                    </div>
                    <div>
                      <span className="block text-[9px] text-muted-foreground uppercase tracking-wider font-bold flex items-center gap-1">
                        <ZapIcon className="size-3 text-amber-500" /> Match
                      </span>
                      <span className="text-xs font-bold text-foreground mt-0.5 block">
                        {parsed?.jobMatch?.score != null
                          ? `${parsed.jobMatch.score * 10}%`
                          : "--"}
                      </span>
                    </div>
                    <div>
                      <span className="block text-[9px] text-muted-foreground uppercase tracking-wider font-bold flex items-center gap-1">
                        <CalendarIcon className="size-3 text-blue-500" /> Ngày
                      </span>
                      <span className="text-[10px] font-bold text-foreground mt-0.5 block truncate">
                        {format(new Date(item.createdAt), "dd/MM/yyyy")}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Bottom Actions inside Card */}
                <div className="flex items-center justify-between gap-2 pt-3.5 border-t border-slate-100 dark:border-border/60 mt-4">
                  {/* Left Side: Secondary actions */}
                  <div className="flex items-center gap-1.5">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        if (!isExpanded) historyState.toggleExpanded(item.id);
                        historyState.startEditing(item);
                      }}
                      className="rounded-xl font-bold text-xs h-9 border-slate-200 hover:bg-slate-50 dark:border-border text-muted-foreground hover:text-foreground transition-all px-3"
                    >
                      <PencilIcon className="size-3.5 mr-1.5" />
                      Chỉnh sửa
                    </Button>

                    <Button
                      size="sm"
                      variant="outline"
                      onClick={(event) => {
                        event.stopPropagation();
                        sessionStorage.setItem(
                          "analyze_prefill",
                          JSON.stringify({
                            candidateName: item.name,
                            jobTitle: item.title ?? "",
                            experienceLevel: item.experienceLevel,
                            jobDescription: item.description,
                          }),
                        );
                        router.push(`/app/analyze?jobInfoId=${item.id}`);
                      }}
                      className="rounded-xl font-bold text-xs h-9 border-primary/20 hover:bg-primary/5 text-primary transition-all px-3"
                    >
                      <RefreshCwIcon className="size-3.5 mr-1.5" />
                      Phân tích lại
                    </Button>
                  </div>

                  {/* Right Side: Primary Toggle Detail Button */}
                  <Button
                    size="sm"
                    onClick={() => {
                      historyState.toggleExpanded(item.id);
                      historyState.cancelEditing();
                    }}
                    className={cn(
                      "rounded-xl font-bold text-xs h-9 px-4 transition-all shadow-xs flex items-center gap-1.5",
                      isExpanded
                        ? "bg-slate-100 hover:bg-slate-200 dark:bg-muted text-slate-700 dark:text-muted-foreground dark:hover:bg-muted/80 shadow-none"
                        : "bg-primary text-primary-foreground hover:bg-primary/95"
                    )}
                  >
                    {isExpanded ? (
                      <>
                        <EyeOffIcon className="size-3.5" />
                        Đóng chi tiết
                      </>
                    ) : (
                      <>
                        <EyeIcon className="size-3.5" />
                        Xem kết quả
                      </>
                    )}
                  </Button>
                </div>

                {isExpanded && (
                  <div className="w-full border-t border-border/60 pt-5 mt-5">
                    {isEditing && historyState.editValues ? (
                      <div className="space-y-4">
                        <div className="space-y-1.5">
                          <label className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
                            Vị trí ứng tuyển
                          </label>
                          <Input
                            value={historyState.editValues.title}
                            onChange={(event) =>
                              historyState.setEditValues((current) =>
                                current
                                  ? { ...current, title: event.target.value }
                                  : null,
                              )
                            }
                            className="rounded-xl border-border bg-card"
                          />
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
                            Cấp độ
                          </label>
                          <select
                            className="h-10 w-full rounded-xl border border-border bg-background px-3 text-sm text-foreground focus:border-primary"
                            value={historyState.editValues.experienceLevel}
                            onChange={(event) =>
                              historyState.setEditValues((current) =>
                                current
                                  ? {
                                      ...current,
                                      experienceLevel: event.target
                                        .value as ExperienceLevel,
                                    }
                                  : null,
                              )
                            }
                          >
                            {(
                              [
                                "intern",
                                "fresh",
                                "junior",
                                "mid-level",
                                "senior",
                              ] as ExperienceLevel[]
                            ).map((level) => (
                              <option key={level} value={level}>
                                {formatExperienceLevel(level)}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
                            Mô tả công việc (JD)
                          </label>
                          <textarea
                            className="min-h-[120px] w-full resize-y rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-primary"
                            value={historyState.editValues.description}
                            onChange={(event) =>
                              historyState.setEditValues((current) =>
                                current
                                  ? {
                                      ...current,
                                      description: event.target.value,
                                    }
                                  : null,
                              )
                            }
                          />
                        </div>

                        <div className="flex justify-end gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="rounded-xl"
                            onClick={historyState.cancelEditing}
                          >
                            Hủy
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            className="rounded-xl bg-primary font-bold text-primary-foreground hover:bg-primary/95"
                            disabled={historyState.isSaving}
                            onClick={() =>
                              void historyState.saveEditing(item.id)
                            }
                          >
                            {historyState.isSaving ? (
                              <RefreshCwIcon className="mr-1.5 size-3.5 animate-spin" />
                            ) : (
                              <CheckIcon className="mr-1.5 size-3.5" />
                            )}
                            Lưu thay đổi
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <Tabs
                        defaultValue={parsed ? "result" : "jd"}
                        className="w-full"
                      >
                        <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                          <TabsList className="w-fit rounded-xl bg-muted p-1">
                            <TabsTrigger
                              value="jd"
                              className="cursor-pointer rounded-lg text-xs"
                            >
                              Mô tả JD
                            </TabsTrigger>
                            {parsed && (
                              <TabsTrigger
                                value="result"
                                className="cursor-pointer rounded-lg text-xs"
                              >
                                Kết quả đánh giá
                              </TabsTrigger>
                            )}
                          </TabsList>
                        </div>

                        <TabsContent
                          value="jd"
                          className="mt-2 space-y-4 text-sm"
                        >
                          <div className="grid gap-4 sm:grid-cols-3">
                            <div>
                              <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                                Ứng viên
                              </p>
                              <p className="mt-0.5 font-semibold text-foreground">
                                {item.name}
                              </p>
                            </div>
                            <div>
                              <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                                Vị trí
                              </p>
                              <p className="mt-0.5 font-semibold text-foreground">
                                {item.title || "N/A"}
                              </p>
                            </div>
                            <div>
                              <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                                Cấp độ
                              </p>
                              <p className="mt-0.5 font-semibold text-foreground">
                                {formatExperienceLevel(item.experienceLevel)}
                              </p>
                            </div>
                          </div>

                          <div>
                            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                              Chi tiết mô tả JD
                            </p>
                            <p className="mt-1 whitespace-pre-wrap rounded-xl border border-border bg-muted/40 p-4 text-xs leading-relaxed text-muted-foreground">
                              {item.description}
                            </p>
                          </div>

                          {item.resumeUrl && (
                            <div className="pt-2">
                              <a
                                href={`/api/job-infos/${item.id}/resume`}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-2 rounded-xl border border-border bg-muted/30 px-3.5 py-2 text-xs font-semibold text-foreground transition-colors hover:bg-muted"
                              >
                                <FileTextIcon className="size-4 text-primary" />
                                Xem CV đã lưu trữ
                              </a>
                            </div>
                          )}
                        </TabsContent>

                        {parsed && (
                          <TabsContent value="result" className="mt-4">
                            <AnalysisResults
                              aiAnalysis={parsed}
                              isLoading={false}
                              jobInfoId={item.id}
                            />
                          </TabsContent>
                        )}
                      </Tabs>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
