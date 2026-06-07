"use client";

import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { vi } from "date-fns/locale";
import { useMemo } from "react";
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
} from "lucide-react";
import { useResumeHistory } from "@/hooks/useResumeHistory";

export function ResumeHistoryPanel({
  isActive,
  usageUsed,
}: {
  isActive: boolean;
  usageUsed: number;
}) {
  const historyState = useResumeHistory({ isActive });

  const historyCount = useMemo(
    () => historyState.history?.length ?? 0,
    [historyState.history],
  );

  return (
    <section className="overflow-hidden rounded-2xl border border-border bg-card p-6 shadow-sm">
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

      {historyState.historyLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((item) => (
            <div
              key={item}
              className="h-20 animate-pulse rounded-2xl border border-border bg-muted/40"
            />
          ))}
        </div>
      ) : historyState.history == null || historyCount === 0 ? (
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
      ) : (
        <div className="space-y-4">
          {historyState.history.map((item) => {
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
                className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm"
              >
                <button
                  type="button"
                  onClick={() => historyState.toggleExpanded(item.id)}
                  className="group flex w-full cursor-pointer items-center gap-4 p-5 text-left transition-colors hover:bg-muted/30"
                >
                  <div className="rounded-xl bg-primary/10 p-3 text-primary">
                    <FileTextIcon className="size-5" />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="truncate text-sm font-semibold text-foreground">
                        {item.name}
                      </p>

                      {item.title && (
                        <Badge
                          variant="secondary"
                          className="rounded-md px-2 py-0.5 text-[10px] font-medium"
                        >
                          {item.title}
                        </Badge>
                      )}

                      <Badge
                        variant="outline"
                        className="rounded-md px-2 py-0.5 text-[10px] font-medium"
                      >
                        {formatExperienceLevel(item.experienceLevel)}
                      </Badge>

                      {parsed ? (
                        <Badge className="rounded-md border-none bg-emerald-600 px-2 py-0.5 text-[10px] font-medium text-white">
                          Đã đánh giá
                        </Badge>
                      ) : (
                        <Badge
                          variant="outline"
                          className="rounded-md px-2 py-0.5 text-[10px] font-medium text-muted-foreground"
                        >
                          Chờ kết quả
                        </Badge>
                      )}
                    </div>

                    <p className="mt-1.5 text-[10px] text-muted-foreground">
                      {formatDistanceToNow(new Date(item.createdAt), {
                        addSuffix: true,
                        locale: vi,
                      })}
                    </p>
                  </div>

                  <ChevronRightIcon
                    className={cn(
                      "size-4 flex-shrink-0 text-muted-foreground transition-transform duration-300",
                      isExpanded && "rotate-90 text-primary",
                    )}
                  />
                </button>

                {isExpanded && (
                  <div className="border-t border-border px-5 py-6">
                    <div className="mx-auto w-full max-w-full">
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
                                "fresh",
                                "junior",
                                "mid",
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

                          <div className="flex items-center gap-4 text-xs font-semibold">
                            <button
                              type="button"
                              onClick={() => historyState.startEditing(item)}
                              className="flex items-center gap-1 text-muted-foreground hover:text-foreground"
                            >
                              <PencilIcon className="size-3" />
                              Sửa thông tin
                            </button>

                            <Link
                              href={`/app/job-infos/${item.id}/resume`}
                              onClick={(event) => event.stopPropagation()}
                              className="flex items-center gap-1 text-primary hover:underline"
                            >
                              <RefreshCwIcon className="size-3" />
                              Phân tích lại
                            </Link>
                          </div>
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
