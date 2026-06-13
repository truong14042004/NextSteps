"use client";

import { useEffect, useState, useMemo } from "react";
import { getUserJobInfosBasic } from "@/features/jobInfos/actions";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatExperienceLevel } from "@/features/jobInfos/lib/formatters";
import { formatDistanceToNow } from "date-fns";
import { vi } from "date-fns/locale";
import {
  Loader2Icon,
  BriefcaseIcon,
  ClockIcon,
  PlayCircleIcon,
  PlayIcon,
  SearchIcon,
  FilterIcon,
  HistoryIcon,
  PercentIcon,
  SparklesIcon,
} from "lucide-react";
import { InterviewJobInfo } from "./page";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

type JobInfoData = Awaited<ReturnType<typeof getUserJobInfosBasic>>[number];

export function PreviousAnalysisOption({
  onSelect,
  onOpenHistory,
}: {
  onSelect: (jobInfo: InterviewJobInfo) => void;
  onOpenHistory: (jobInfo: InterviewJobInfo) => void;
}) {
  const [jobInfos, setJobInfos] = useState<JobInfoData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [experienceFilter, setExperienceFilter] = useState<string>("all");

  useEffect(() => {
    getUserJobInfosBasic(50).then((data) => {
      setJobInfos(data);
      setLoading(false);
    });
  }, []);

  const filteredJobInfos = useMemo(() => {
    return jobInfos.filter((item) => {
      const matchSearch =
        (item.title?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
        (item.name?.toLowerCase() || "").includes(searchTerm.toLowerCase());
      
      const matchExp =
        experienceFilter === "all" || item.experienceLevel === experienceFilter;

      return matchSearch && matchExp;
    });
  }, [jobInfos, searchTerm, experienceFilter]);

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
      <div className="rounded-[24px] border border-border bg-background/50 p-8 text-center shadow-xs">
        <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <HistoryIcon className="size-5" />
        </div>

        <h3 className="text-lg font-semibold">Chưa có dữ liệu đã phân tích</h3>
        <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-muted-foreground">
          Bạn chưa có phân tích CV/JD nào trước đó. Hãy tạo phân tích mới hoặc
          chuyển sang tab “Phỏng vấn mới” để bắt đầu nhanh.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Search & Filter Controls */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1">
          <SearchIcon className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Tìm theo vị trí, tên ứng viên..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="h-10 rounded-xl border-border bg-background/80 pl-10 pr-4 shadow-none"
          />
        </div>
        <div className="w-full sm:w-[180px]">
          <Select value={experienceFilter} onValueChange={setExperienceFilter}>
            <SelectTrigger className="h-10 rounded-xl border-border bg-background/80 shadow-none">
              <span className="flex items-center gap-2 text-sm text-muted-foreground">
                <FilterIcon className="size-3.5" />
                <SelectValue placeholder="Cấp độ" />
              </span>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả cấp độ</SelectItem>
              <SelectItem value="intern">Intern</SelectItem>
              <SelectItem value="fresh">Fresher</SelectItem>
              <SelectItem value="junior">Junior</SelectItem>
              <SelectItem value="mid-level">Middle</SelectItem>
              <SelectItem value="senior">Senior</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <ScrollArea className="h-[480px] pr-2">
        <div className="divide-y divide-slate-100 dark:divide-slate-800 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden bg-white dark:bg-card shadow-xs">
          {filteredJobInfos.length === 0 ? (
            <div className="py-12 text-center text-sm text-muted-foreground bg-white dark:bg-card">
              Không tìm thấy kết quả phù hợp.
            </div>
          ) : (
            filteredJobInfos.map((jobInfo) => {
              // Parse match score from analysisResult
              let matchScore: number | null = null;
              if (jobInfo.analysisResult) {
                try {
                  const parsed = JSON.parse(jobInfo.analysisResult);
                  if (parsed?.jobMatch?.score != null) {
                    matchScore = Math.round(parsed.jobMatch.score * 10);
                  }
                } catch (e) {
                  // ignore
                }
              }

              return (
                <div
                  key={jobInfo.id}
                  onClick={() =>
                    onOpenHistory({
                      id: jobInfo.id,
                      title: jobInfo.title || "",
                      name: jobInfo.name,
                      experienceLevel: jobInfo.experienceLevel,
                      description: jobInfo.description,
                    })
                  }
                  className="group flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 transition-all hover:bg-slate-50/50 dark:hover:bg-muted/10 cursor-pointer min-h-[70px] sm:min-h-[85px] hover:-translate-y-[1px] duration-150"
                >
                  <div className="min-w-0 flex-1 flex items-center gap-3.5">
                    <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-red-50 border border-red-100 text-red-600 dark:bg-red-950/20 dark:text-red-400 dark:border-red-900/30">
                      <BriefcaseIcon className="size-5" />
                    </div>

                    <div className="min-w-0 flex-1">
                      <h4 className="truncate text-sm font-bold text-slate-900 dark:text-foreground">
                        {jobInfo.title || "Không có vị trí"}
                      </h4>
                      <p className="text-xs text-muted-foreground mt-0.5 truncate">
                        {jobInfo.name}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-6 sm:justify-end shrink-0">
                    {/* Match Score Display */}
                    <div className="min-w-[80px] text-left sm:text-right">
                      <span className="block text-[10px] text-slate-400 uppercase font-bold tracking-wider">
                        Match Score
                      </span>
                      {matchScore !== null ? (
                        <span className={cn(
                          "text-xs font-bold block mt-0.5",
                          matchScore >= 75
                            ? "text-emerald-600 dark:text-emerald-400"
                            : "text-amber-500 dark:text-amber-400"
                        )}>
                          {matchScore}%
                        </span>
                      ) : (
                        <span className="text-xs text-muted-foreground block mt-0.5">--</span>
                      )}
                    </div>

                    {/* Updated Time Display */}
                    <div className="min-w-[90px] text-left sm:text-right">
                      <span className="block text-[10px] text-slate-400 uppercase font-bold tracking-wider">
                        Cập nhật
                      </span>
                      <span className="text-xs text-slate-700 dark:text-slate-300 block mt-0.5">
                        {formatDistanceToNow(new Date(jobInfo.createdAt), {
                          addSuffix: false,
                          locale: vi,
                        })} trước
                      </span>
                    </div>

                    <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
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
                        className="h-8.5 rounded-lg text-xs font-bold bg-primary text-primary-foreground hover:bg-primary/95 shadow-md shadow-primary/20 hover:shadow-lg hover:shadow-primary/30 transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] flex items-center gap-1.5"
                      >
                        <div className="flex size-4 items-center justify-center rounded-full bg-white text-primary shrink-0">
                          <PlayIcon className="size-2 fill-current ml-[1px]" />
                        </div>
                        Phỏng vấn ngay
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
