"use client";

import { useEffect, useState } from "react";
import { getUserJobInfosBasic } from "@/features/jobInfos/actions";
import { getInterviewsForJobInfo } from "@/features/interviews/actions";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatExperienceLevel } from "@/features/jobInfos/lib/formatters";
import { formatDistanceToNow } from "date-fns";
import { vi } from "date-fns/locale";
import {
  Loader2Icon,
  BriefcaseIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  ClockIcon,
  CheckCircleIcon,
  PlayCircleIcon,
  FileTextIcon,
  SparklesIcon,
  ArrowRightIcon,
  HistoryIcon,
} from "lucide-react";
import { InterviewJobInfo } from "./page";
import { ScrollArea } from "@/components/ui/scroll-area";
import Link from "next/link";
import { cn } from "@/lib/utils";

type JobInfoData = Awaited<ReturnType<typeof getUserJobInfosBasic>>[number];
type InterviewData = Awaited<ReturnType<typeof getInterviewsForJobInfo>>;

export function PreviousAnalysisOption({
  onSelect,
}: {
  onSelect: (jobInfo: InterviewJobInfo) => void;
}) {
  const [jobInfos, setJobInfos] = useState<JobInfoData[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedJobId, setExpandedJobId] = useState<string | null>(null);
  const [interviews, setInterviews] = useState<Record<string, InterviewData>>(
    {},
  );
  const [loadingInterviews, setLoadingInterviews] = useState<
    Record<string, boolean>
  >({});

  useEffect(() => {
    getUserJobInfosBasic(10).then((data) => {
      setJobInfos(data);
      setLoading(false);
    });
  }, []);

  async function toggleHistory(jobInfoId: string) {
    if (expandedJobId === jobInfoId) {
      setExpandedJobId(null);
      return;
    }

    setExpandedJobId(jobInfoId);

    if (interviews[jobInfoId] != null) return;

    setLoadingInterviews((prev) => ({ ...prev, [jobInfoId]: true }));
    const data = await getInterviewsForJobInfo(jobInfoId);
    setInterviews((prev) => ({ ...prev, [jobInfoId]: data }));
    setLoadingInterviews((prev) => ({ ...prev, [jobInfoId]: false }));
  }

  if (loading) {
    return (
      <div className="flex justify-center py-14">
        <div className="flex items-center gap-3 rounded-2xl border border-primary/10 bg-primary/5 px-4 py-3 text-sm text-muted-foreground">
          <Loader2Icon className="size-4 animate-spin text-primary" />
          Đang tải dữ liệu đã phân tích...
        </div>
      </div>
    );
  }

  if (jobInfos.length === 0) {
    return (
      <div className="rounded-[28px] border border-border bg-background/70 p-8 text-center shadow-sm">
        <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <HistoryIcon className="size-6" />
        </div>

        <h3 className="text-lg font-semibold">Chưa có dữ liệu đã phân tích</h3>
        <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted-foreground">
          Bạn chưa có phân tích CV/JD nào trước đó. Hãy tạo phân tích mới hoặc
          chuyển sang tab “Phỏng vấn mới” để bắt đầu nhanh.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <ScrollArea className="h-[520px] pr-4">
        <div className="space-y-4">
          {jobInfos.map((jobInfo) => {
            const isExpanded = expandedJobId === jobInfo.id;
            const interviewList = interviews[jobInfo.id];

            return (
              <div
                key={jobInfo.id}
                className={cn(
                  "overflow-hidden rounded-[28px] border bg-background/80 shadow-sm transition-all",
                  isExpanded
                    ? "border-primary/20 shadow-md"
                    : "border-border hover:border-primary/15",
                )}
              >
                <div className="p-5 md:p-5">
                  <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start gap-3">
                        <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl border border-primary/10 bg-primary/5 text-primary">
                          <BriefcaseIcon className="size-5" />
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="truncate text-lg font-semibold text-foreground">
                              {jobInfo.title || "Không có tiêu đề"}
                            </h3>

                            <Badge
                              variant="outline"
                              className="rounded-full border-primary/15 bg-primary/5 text-primary"
                            >
                              {formatExperienceLevel(jobInfo.experienceLevel)}
                            </Badge>
                          </div>

                          <p className="mt-1 text-sm text-muted-foreground">
                            <span className="font-medium text-foreground">
                              {jobInfo.name}
                            </span>
                            {" • "}
                            {formatDistanceToNow(new Date(jobInfo.createdAt), {
                              addSuffix: true,
                              locale: vi,
                            })}
                          </p>
                        </div>
                      </div>

                      {jobInfo.description && !isExpanded && (
                        <div className="mt-4 rounded-2xl border border-border bg-muted/30 p-4">
                          <p className="line-clamp-2 text-sm leading-6 text-muted-foreground">
                            {jobInfo.description}
                          </p>
                        </div>
                      )}
                    </div>

                    <div className="flex flex-wrap gap-2 lg:justify-end">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => toggleHistory(jobInfo.id)}
                        className="rounded-xl border-primary/15 bg-white/80 hover:bg-primary/5 dark:bg-background/40"
                      >
                        <ClockIcon className="mr-2 size-4" />
                        Lịch sử
                        {isExpanded ? (
                          <ChevronUpIcon className="ml-2 size-4" />
                        ) : (
                          <ChevronDownIcon className="ml-2 size-4" />
                        )}
                      </Button>

                      <Button
                        type="button"
                        onClick={() =>
                          onSelect({
                            id: jobInfo.id,
                            title: jobInfo.title || "",
                            name: jobInfo.name,
                            experienceLevel: jobInfo.experienceLevel,
                            description: jobInfo.description,
                          })
                        }
                        className="rounded-xl btn-cta"
                      >
                        <PlayCircleIcon className="mr-2 size-4" />
                        Phỏng vấn ngay
                      </Button>
                    </div>
                  </div>
                </div>

                {isExpanded && (
                  <div className="border-t border-border bg-white/60 px-5 py-5 dark:bg-background/40 md:px-6">
                    <div className="mb-4 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                      <SparklesIcon className="size-3.5 text-primary" />
                      Lịch sử phỏng vấn
                    </div>

                    {jobInfo.description && (
                      <div className="mb-4 rounded-2xl border border-border bg-background/70 p-4">
                        <div className="mb-2 flex items-center gap-2 text-sm font-medium text-foreground">
                          <FileTextIcon className="size-4 text-primary" />
                          Mô tả công việc
                        </div>
                        <p className="whitespace-pre-wrap text-sm leading-6 text-muted-foreground">
                          {jobInfo.description}
                        </p>
                      </div>
                    )}

                    {loadingInterviews[jobInfo.id] ? (
                      <div className="flex justify-center py-8">
                        <div className="flex items-center gap-3 rounded-2xl border border-primary/10 bg-primary/5 px-4 py-3 text-sm text-muted-foreground">
                          <Loader2Icon className="size-4 animate-spin text-primary" />
                          Đang tải lịch sử phỏng vấn...
                        </div>
                      </div>
                    ) : interviewList?.length === 0 ? (
                      <div className="rounded-2xl border border-dashed border-border bg-background/60 px-4 py-8 text-center">
                        <div className="mx-auto mb-3 flex size-11 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
                          <ClockIcon className="size-5" />
                        </div>
                        <p className="font-medium text-foreground">
                          Chưa có lần phỏng vấn nào
                        </p>
                        <p className="mt-1 text-sm text-muted-foreground">
                          Bạn có thể bắt đầu buổi phỏng vấn đầu tiên từ dữ liệu
                          này ngay bây giờ.
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {interviewList?.map((interview) => {
                          const status =
                            interview.feedback != null
                              ? {
                                  label: "Có đánh giá",
                                  className:
                                    "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/20 dark:text-emerald-300 dark:border-emerald-900/40",
                                  icon: (
                                    <CheckCircleIcon className="size-3.5" />
                                  ),
                                }
                              : interview.vapiTranscript != null ||
                                  interview.humeChatId != null
                                ? {
                                    label: "Chưa đánh giá",
                                    className:
                                      "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/20 dark:text-amber-300 dark:border-amber-900/40",
                                    icon: <ClockIcon className="size-3.5" />,
                                  }
                                : {
                                    label: "Chưa hoàn thành",
                                    className:
                                      "bg-muted text-muted-foreground border-border",
                                    icon: <ClockIcon className="size-3.5" />,
                                  };

                          return (
                            <Link
                              key={interview.id}
                              href={`/app/interview/${interview.id}`}
                              className="group flex items-center justify-between gap-4 rounded-2xl border border-border bg-background/70 p-4 transition-all hover:border-primary/15 hover:bg-primary/5"
                            >
                              <div className="min-w-0 flex items-center gap-3">
                                <div className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                                  <ClockIcon className="size-4" />
                                </div>

                                <div className="min-w-0">
                                  <p className="text-sm font-semibold text-foreground">
                                    {formatDistanceToNow(
                                      new Date(interview.createdAt),
                                      {
                                        addSuffix: true,
                                        locale: vi,
                                      },
                                    )}
                                  </p>
                                  <p className="mt-1 text-xs text-muted-foreground">
                                    Thời lượng: {interview.duration}
                                  </p>
                                </div>
                              </div>

                              <div className="flex shrink-0 items-center gap-2">
                                <Badge
                                  className={cn(
                                    "rounded-full border text-xs font-medium",
                                    status.className,
                                  )}
                                >
                                  <span className="mr-1">{status.icon}</span>
                                  {status.label}
                                </Badge>

                                <ArrowRightIcon className="size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
                              </div>
                            </Link>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </ScrollArea>
    </div>
  );
}
