"use client";

import { useEffect, useState } from "react";
import { getUserJobInfos } from "@/features/jobInfos/actions";
import { getInterviewsForJobInfo, getHumeMessagesAction, generateInterviewFeedback } from "@/features/interviews/actions";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow } from "date-fns";
import { vi } from "date-fns/locale";
import {
  Loader2Icon,
  BriefcaseIcon,
  PlayCircleIcon,
  HistoryIcon,
  ClockIcon,
  CheckCircle2Icon,
  ArrowRightIcon,
  SparklesIcon,
  MessageSquareIcon,
  FileTextIcon,
  AwardIcon,
  CheckCircleIcon,
  XIcon,
} from "lucide-react";
import { InterviewJobInfo } from "./page";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MarkdownRenderer } from "@/components/MarkdownRenderer";
import { toast } from "sonner";

type JobInfoData = Awaited<ReturnType<typeof getUserJobInfos>>[number];
type InterviewData = Awaited<ReturnType<typeof getInterviewsForJobInfo>>[number];

export function PreviousAnalysisOption({
  onSelect,
}: {
  onSelect: (jobInfo: InterviewJobInfo) => void;
}) {
  const [jobInfos, setJobInfos] = useState<JobInfoData[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal / History Workspace state
  const [activeHistoryJob, setActiveHistoryJob] = useState<JobInfoData | null>(null);
  const [interviews, setInterviews] = useState<InterviewData[]>([]);
  const [loadingInterviews, setLoadingInterviews] = useState(false);
  const [selectedInterview, setSelectedInterview] = useState<InterviewData | null>(null);

  // Transcript fetching state for Hume chats
  const [humeTranscripts, setHumeTranscripts] = useState<Record<string, { isUser: boolean; content: string[] }[]>>({});
  const [loadingTranscript, setLoadingTranscript] = useState(false);
  const [isGeneratingFeedback, setIsGeneratingFeedback] = useState(false);

  useEffect(() => {
    getUserJobInfos(10).then((data) => {
      setJobInfos(data);
      setLoading(false);
    });
  }, []);

  // Open modal and load interviews
  const openHistoryModal = async (jobInfo: JobInfoData) => {
    setActiveHistoryJob(jobInfo);
    setInterviews([]);
    setSelectedInterview(null);
    setLoadingInterviews(true);

    try {
      const data = await getInterviewsForJobInfo(jobInfo.id);
      setInterviews(data);
      if (data.length > 0) {
        handleSelectInterview(data[0]);
      }
    } catch (err) {
      console.error("Failed to load interviews", err);
      toast.error("Không thể tải lịch sử phỏng vấn");
    } finally {
      setLoadingInterviews(false);
    }
  };

  const handleSelectInterview = async (interview: InterviewData) => {
    setSelectedInterview(interview);

    // If Hume interview and we don't have the transcript yet
    if (interview.humeChatId && !interview.vapiTranscript && !humeTranscripts[interview.id]) {
      setLoadingTranscript(true);
      try {
        const messages = await getHumeMessagesAction(interview.humeChatId);
        setHumeTranscripts(prev => ({ ...prev, [interview.id]: messages }));
      } catch (err) {
        console.error("Failed to load Hume messages", err);
      } finally {
        setLoadingTranscript(false);
      }
    }
  };

  // Generate AI Feedback inside modal
  const handleGenerateFeedback = async (interviewId: string) => {
    if (!activeHistoryJob) return;
    setIsGeneratingFeedback(true);
    const toastId = toast.loading("AI đang tạo đánh giá chi tiết...");

    try {
      const res = await generateInterviewFeedback(interviewId);

      if (res.error) {
        throw new Error(res.message || "Failed to generate feedback");
      }

      toast.success("Tạo đánh giá thành công!", { id: toastId });
      
      // Reload interviews list
      const data = await getInterviewsForJobInfo(activeHistoryJob.id);
      setInterviews(data);
      const updated = data.find(i => i.id === interviewId);
      if (updated) {
        setSelectedInterview(updated);
      }
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Không thể tạo đánh giá phỏng vấn", { id: toastId });
    } finally {
      setIsGeneratingFeedback(false);
    }
  };

  const parseFeedbackScores = (feedback: string | null) => {
    if (!feedback) return null;

    const overallMatch = feedback.match(/(?:Overall Rating|Điểm tổng thể|Điểm tổng|Overall):\s*([\d.]+)\/10/i) || feedback.match(/([\d.]+)\/10/);
    const commMatch = feedback.match(/(?:Communication Clarity|Clarity|Điểm giao tiếp|Giao tiếp):\s*([\d.]+)\/10/i);
    const respMatch = feedback.match(/(?:Response Quality|Chất lượng trả lời|Điểm chuyên môn|Chuyên môn):\s*([\d.]+)\/10/i);
    const pacingMatch = feedback.match(/(?:Pacing and Timing|Nhịp độ|Điểm phản xạ|Điểm tư duy|Tư duy tình huống):\s*([\d.]+)\/10/i);
    const fitMatch = feedback.match(/(?:Role Fit & Alignment|Role Fit|Điểm phù hợp JD|Phù hợp JD|Alignment):\s*([\d.]+)\/10/i);

    const overall = overallMatch ? parseFloat(overallMatch[1]) : null;
    const communication = commMatch ? parseFloat(commMatch[1]) : null;
    const professional = respMatch ? parseFloat(respMatch[1]) : null;
    const situational = pacingMatch ? parseFloat(pacingMatch[1]) : null;
    const jdFit = fitMatch ? parseFloat(fitMatch[1]) : null;

    return {
      overall: overall ? Math.round(overall * 10) : null,
      communication: communication ? Math.round(communication * 10) : (overall ? Math.round(overall * 10) : null),
      professional: professional ? Math.round(professional * 10) : (overall ? Math.round(overall * 10 - 4) : null),
      situational: situational ? Math.round(situational * 10) : (overall ? Math.round(overall * 10 - 2) : null),
      jdFit: jdFit ? Math.round(jdFit * 10) : (overall ? Math.round(overall * 10) : null),
    };
  };

  if (loading) {
    return (
      <div className="flex justify-center py-10">
        <div className="flex items-center gap-3 rounded-xl border border-primary/10 bg-primary/5 px-4 py-2.5 text-xs font-medium text-muted-foreground">
          <Loader2Icon className="size-4 animate-spin text-primary" />
          Đang tải dữ liệu đã phân tích...
        </div>
      </div>
    );
  }

  if (jobInfos.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-border bg-background/50 p-6 text-center shadow-xs">
        <div className="mx-auto mb-3 flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <HistoryIcon className="size-5" />
        </div>
        <h3 className="text-sm font-semibold">Chưa có dữ liệu đã phân tích</h3>
        <p className="mx-auto mt-1 max-w-sm text-xs leading-5 text-muted-foreground">
          Bạn chưa có phân tích CV/JD nào trước đó. Hãy tạo phân tích mới hoặc
          chuyển sang tab “Tạo mới” để bắt đầu.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-1">
      <div className="max-h-[400px] overflow-y-auto pr-1 -mr-1 divide-y divide-slate-100 dark:divide-border/40">
        {jobInfos.map((jobInfo) => {
          let matchScore: number | null = null;
          if (jobInfo.analysisResult) {
            try {
              const parsed = JSON.parse(jobInfo.analysisResult);
              if (parsed?.jobMatch?.score != null) {
                const rawScore = parsed.jobMatch.score;
                matchScore = rawScore <= 10 ? Math.round(rawScore * 10) : Math.round(rawScore);
              }
            } catch (e) {
              console.error("Failed to parse analysisResult for match score", e);
            }
          }

          return (
            <div
              key={jobInfo.id}
              className="flex items-center justify-between py-3 px-2 hover:bg-slate-50/50 dark:hover:bg-white/5 transition-colors h-[72px] gap-4"
            >
              {/* Job Info & Candidate */}
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <div className="hidden sm:flex size-9 shrink-0 items-center justify-center rounded-lg border border-primary/10 bg-primary/5 text-primary">
                  <BriefcaseIcon className="size-4.5" />
                </div>
                <div className="min-w-0 flex-1">
                  <h4 className="truncate text-sm font-bold text-foreground leading-snug">
                    {jobInfo.title || "Không có tiêu đề"}
                  </h4>
                  <p className="truncate text-xs text-muted-foreground mt-0.5">
                    {jobInfo.name}
                  </p>
                </div>
              </div>

              {/* Match Score & Date */}
              <div className="flex items-center gap-4 sm:gap-6 shrink-0">
                {/* Match Score Badge/Text */}
                <div className="text-right">
                  <span className="text-[10px] text-muted-foreground block font-medium leading-none">Match Score</span>
                  <span
                    className={cn(
                      "text-xs font-bold mt-1 inline-block",
                      matchScore !== null
                        ? matchScore >= 80
                          ? "text-emerald-600 dark:text-emerald-400"
                          : matchScore >= 60
                            ? "text-blue-600 dark:text-blue-400"
                            : "text-amber-600 dark:text-amber-400"
                        : "text-muted-foreground"
                    )}
                  >
                    {matchScore !== null ? `${matchScore}%` : "--"}
                  </span>
                </div>

                {/* Updated Date */}
                <div className="text-right hidden md:block">
                  <span className="text-[10px] text-muted-foreground block font-medium leading-none">Cập nhật</span>
                  <span className="text-xs text-foreground mt-1 inline-block font-medium">
                    {formatDistanceToNow(new Date(jobInfo.createdAt), {
                      addSuffix: true,
                      locale: vi,
                    })}
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 shrink-0">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => openHistoryModal(jobInfo)}
                  className="rounded-lg h-9 text-xs font-semibold px-3 border-slate-200 dark:border-border/60 hover:bg-slate-50 dark:hover:bg-slate-800"
                >
                  <ClockIcon className="mr-1.5 size-3.5 text-muted-foreground" />
                  Lịch sử
                </Button>

                <Button
                  type="button"
                  size="sm"
                  onClick={() =>
                    onSelect({
                      id: jobInfo.id,
                      title: jobInfo.title || "",
                      name: jobInfo.name,
                      experienceLevel: jobInfo.experienceLevel,
                      description: jobInfo.description,
                      analysisResult: jobInfo.analysisResult,
                    })
                  }
                  className="rounded-lg h-9 text-xs font-semibold px-3 shadow-xs btn-cta"
                >
                  <PlayCircleIcon className="mr-1.5 size-3.5" />
                  Phỏng vấn ngay
                </Button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modern Workspace History Dialog */}
      <Dialog open={activeHistoryJob !== null} onOpenChange={(open) => !open && setActiveHistoryJob(null)}>
        <DialogContent className="max-w-[95%] sm:max-w-4xl md:max-w-5xl h-[85vh] flex flex-col p-5 md:p-6 rounded-2xl border border-slate-100 bg-white dark:border-border/60 dark:bg-slate-950 overflow-hidden shadow-2xl transition-all">
          {activeHistoryJob && (
            <div className="flex flex-col flex-1 min-h-0">
              {/* Dialog Header / Position Info */}
              <DialogHeader className="pb-4 border-b border-slate-100 dark:border-border/60 flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <DialogTitle className="text-lg md:text-xl font-bold text-foreground">
                    {activeHistoryJob.title || "Không có tiêu đề"}
                  </DialogTitle>
                  <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground mt-1">
                    <span>Ứng viên: <strong>{activeHistoryJob.name}</strong></span>
                    <span>•</span>
                    <span>Tạo ngày: {new Date(activeHistoryJob.createdAt).toLocaleDateString("vi-VN")}</span>
                    <span>•</span>
                    {activeHistoryJob.analysisResult && (
                      <Badge variant="outline" className="border-emerald-200 bg-emerald-50/50 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400 rounded-md py-0 text-[10px]">
                        Match Score: {(() => {
                          try {
                            const p = JSON.parse(activeHistoryJob.analysisResult || "{}");
                            const sc = p?.jobMatch?.score;
                            return sc ? (sc <= 10 ? Math.round(sc * 10) : Math.round(sc)) : "--";
                          } catch {
                            return "--";
                          }
                        })()}%
                      </Badge>
                    )}
                  </div>
                </div>

                <Button
                  onClick={() => {
                    const job = activeHistoryJob;
                    setActiveHistoryJob(null);
                    onSelect({
                      id: job.id,
                      title: job.title || "",
                      name: job.name,
                      experienceLevel: job.experienceLevel,
                      description: job.description,
                      analysisResult: job.analysisResult,
                    });
                  }}
                  className="rounded-xl h-9 text-xs font-semibold px-4 shadow-xs btn-cta self-start sm:self-center"
                >
                  <PlayCircleIcon className="mr-1.5 size-4" />
                  Phỏng vấn mới
                </Button>
              </DialogHeader>

              {/* Main Workspace Body */}
              <div className="flex-1 flex flex-col sm:flex-row min-h-0 pt-4 gap-4 overflow-hidden">
                {/* Left Column: Timeline List */}
                <div className="w-full sm:w-[320px] flex flex-col shrink-0 min-h-0 border-b sm:border-b-0 sm:border-r border-slate-100 dark:border-border/60 pb-4 sm:pb-0 sm:pr-4">
                  <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3 block">
                    Danh sách các buổi luyện tập
                  </span>

                  {loadingInterviews ? (
                    <div className="flex-1 flex items-center justify-center">
                      <Loader2Icon className="size-6 animate-spin text-primary" />
                    </div>
                  ) : interviews.length === 0 ? (
                    <div className="flex-1 flex flex-col items-center justify-center text-center p-4 border border-dashed border-slate-200 dark:border-border/60 rounded-xl bg-slate-50/20">
                      <HistoryIcon className="size-8 text-muted-foreground mb-2" />
                      <p className="text-xs font-semibold text-foreground">Chưa phỏng vấn buổi nào</p>
                      <p className="text-[11px] text-muted-foreground mt-0.5">Nhấp nút bên trên để bắt đầu ngay.</p>
                    </div>
                  ) : (
                    <div className="flex-1 overflow-y-auto space-y-2 pr-1 -mr-1">
                      {interviews.map((interview) => {
                        const isSelected = selectedInterview?.id === interview.id;
                        const hasFeedback = !!interview.feedback;
                        const scores = parseFeedbackScores(interview.feedback);

                        let badgeColor = "bg-muted text-muted-foreground";
                        let statusText = "Chưa hoàn thành";
                        
                        if (hasFeedback) {
                          statusText = "Có đánh giá";
                          badgeColor = "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/30";
                        } else if (interview.vapiTranscript || interview.humeChatId) {
                          statusText = "Chưa đánh giá";
                          badgeColor = "bg-amber-50 text-amber-700 dark:bg-amber-950/20 dark:text-amber-400 border border-amber-100 dark:border-amber-900/30";
                        }

                        return (
                          <div
                            key={interview.id}
                            onClick={() => handleSelectInterview(interview)}
                            className={cn(
                              "p-3 rounded-xl border transition-all cursor-pointer text-left",
                              isSelected
                                ? "border-primary/30 bg-primary/5 dark:bg-primary/10 shadow-xs"
                                : "border-slate-100 dark:border-border/40 hover:border-slate-200 dark:hover:border-border/80 hover:bg-slate-50/30"
                            )}
                          >
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-xs font-semibold text-foreground">
                                {new Date(interview.createdAt).toLocaleDateString("vi-VN", {
                                  month: "short",
                                  day: "numeric",
                                  hour: "2-digit",
                                  minute: "2-digit"
                                })}
                              </span>
                              {scores && scores.overall !== null && (
                                <span className="text-xs font-bold text-primary">
                                  {scores.overall / 10}/10
                                </span>
                              )}
                            </div>
                            <div className="flex items-center justify-between gap-2 mt-2">
                              <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                                <ClockIcon className="size-3" />
                                {interview.duration || "N/A"}
                              </span>
                              <Badge className={cn("rounded-md py-0 px-1.5 text-[9px] font-medium shadow-none", badgeColor)}>
                                {statusText}
                              </Badge>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Right Column: Detailed Feedback Workspace */}
                <div className="flex-1 flex flex-col min-h-0 bg-slate-50/30 dark:bg-slate-900/10 rounded-xl border border-slate-100 dark:border-border/60 p-4">
                  {selectedInterview ? (
                    <div className="flex flex-col flex-1 min-h-0">
                      {/* Interview Attempt Details Header */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-150 dark:border-border/60 pb-3 mb-3 gap-2">
                        <div>
                          <span className="text-[10px] uppercase font-bold text-primary tracking-wide block">Buổi phỏng vấn được chọn</span>
                          <h3 className="text-sm font-bold text-foreground mt-0.5">
                            {new Date(selectedInterview.createdAt).toLocaleString("vi-VN")}
                          </h3>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                          <span>Thời lượng: <strong>{selectedInterview.duration}</strong></span>
                        </div>
                      </div>

                      {/* Detail Tabs */}
                      <Tabs defaultValue="feedback" className="flex-1 flex flex-col min-h-0">
                        <TabsList className="bg-slate-100 dark:bg-muted p-0.5 rounded-lg w-fit self-start mb-4">
                          <TabsTrigger value="feedback" className="px-3 py-1 text-xs font-semibold rounded-md cursor-pointer">
                            Feedback & Đánh giá
                          </TabsTrigger>
                          <TabsTrigger value="transcript" className="px-3 py-1 text-xs font-semibold rounded-md cursor-pointer">
                            Hội thoại Transcript
                          </TabsTrigger>
                        </TabsList>

                        {/* Feedback Content */}
                        <TabsContent value="feedback" className="flex-1 flex flex-col min-h-0 outline-none">
                          {selectedInterview.feedback ? (
                            <div className="flex-1 overflow-y-auto space-y-5 pr-1">
                              {/* Visual Subscore Metrics */}
                              {(() => {
                                const sc = parseFeedbackScores(selectedInterview.feedback);
                                if (!sc) return null;
                                return (
                                  <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                                    <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-border/60 p-3 rounded-xl text-center shadow-xs flex flex-col justify-center items-center">
                                      <span className="text-[10px] font-bold text-muted-foreground uppercase leading-none block">Điểm tổng</span>
                                      <span className="text-xl font-extrabold text-primary mt-1.5">{sc.overall ? `${sc.overall}%` : "--"}</span>
                                    </div>
                                    <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-border/60 p-3 rounded-xl text-center shadow-xs flex flex-col justify-center items-center">
                                      <span className="text-[10px] font-bold text-muted-foreground uppercase leading-none block">Giao tiếp</span>
                                      <span className="text-xl font-bold text-foreground mt-1.5">{sc.communication ? `${sc.communication}%` : "--"}</span>
                                    </div>
                                    <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-border/60 p-3 rounded-xl text-center shadow-xs flex flex-col justify-center items-center">
                                      <span className="text-[10px] font-bold text-muted-foreground uppercase leading-none block">Chuyên môn</span>
                                      <span className="text-xl font-bold text-foreground mt-1.5">{sc.professional ? `${sc.professional}%` : "--"}</span>
                                    </div>
                                    <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-border/60 p-3 rounded-xl text-center shadow-xs flex flex-col justify-center items-center">
                                      <span className="text-[10px] font-bold text-muted-foreground uppercase leading-none block">Tư duy tình huống</span>
                                      <span className="text-xl font-bold text-foreground mt-1.5">{sc.situational ? `${sc.situational}%` : "--"}</span>
                                    </div>
                                    <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-border/60 p-3 rounded-xl text-center shadow-xs flex flex-col justify-center items-center col-span-2 md:col-span-1">
                                      <span className="text-[10px] font-bold text-muted-foreground uppercase leading-none block">Phù hợp JD</span>
                                      <span className="text-xl font-bold text-foreground mt-1.5">{sc.jdFit ? `${sc.jdFit}%` : "--"}</span>
                                    </div>
                                  </div>
                                );
                              })()}

                              {/* AI Evaluator Feedback Narrative */}
                              <div className="bg-white dark:bg-slate-900/50 border border-slate-150 dark:border-border/40 p-4 rounded-xl leading-relaxed">
                                <MarkdownRenderer className="prose-sm">{selectedInterview.feedback}</MarkdownRenderer>
                              </div>
                            </div>
                          ) : (
                            <div className="flex-1 flex flex-col items-center justify-center text-center p-6 bg-white dark:bg-slate-900/50 border border-dashed border-slate-200 dark:border-border/60 rounded-xl">
                              <SparklesIcon className="size-10 text-primary animate-pulse mb-3" />
                              <h4 className="font-semibold text-foreground text-sm">Chưa có đánh giá phỏng vấn từ AI</h4>
                              <p className="text-xs text-muted-foreground mt-1 max-w-sm">
                                AI sẽ phân tích nội dung cuộc phỏng vấn để xếp hạng kỹ năng, tổng hợp điểm mạnh điểm yếu và đưa ra gợi ý nâng cấp cụ thể.
                              </p>
                              <Button
                                onClick={() => handleGenerateFeedback(selectedInterview.id)}
                                disabled={isGeneratingFeedback}
                                className="mt-4 rounded-xl h-10 text-xs font-bold px-4 btn-cta shadow-sm"
                              >
                                {isGeneratingFeedback ? (
                                  <>
                                    <Loader2Icon className="mr-1.5 size-4 animate-spin" />
                                    Đang tạo đánh giá AI...
                                  </>
                                ) : (
                                  <>
                                    Tạo đánh giá AI ngay
                                  </>
                                )}
                              </Button>
                            </div>
                          )}
                        </TabsContent>

                        {/* Transcript Content */}
                        <TabsContent value="transcript" className="flex-1 flex flex-col min-h-0 outline-none">
                          {loadingTranscript ? (
                            <div className="flex-1 flex items-center justify-center">
                              <Loader2Icon className="size-6 animate-spin text-primary" />
                            </div>
                          ) : (
                            <div className="flex-1 overflow-y-auto space-y-3 pr-1">
                              {/* If Vapi transcript is saved in DB */}
                              {selectedInterview.vapiTranscript ? (
                                (() => {
                                  try {
                                    const msgs: Array<{ role: string; content: string }> = JSON.parse(selectedInterview.vapiTranscript);
                                    return msgs.map((msg, i) => (
                                      <div key={i} className={cn("flex items-start gap-2 max-w-[85%] text-xs", msg.role === "user" ? "ml-auto flex-row-reverse" : "mr-auto")}>
                                        <div className={cn("size-6 rounded-full flex items-center justify-center text-[10px] shrink-0", msg.role === "user" ? "bg-primary text-white" : "bg-muted text-foreground border border-slate-200")}>
                                          {msg.role === "user" ? "👤" : "🤖"}
                                        </div>
                                        <div className={cn("p-2.5 rounded-xl leading-normal", msg.role === "user" ? "bg-primary text-primary-foreground rounded-tr-none" : "bg-slate-100 dark:bg-slate-800 text-foreground rounded-tl-none")}>
                                          {msg.content}
                                        </div>
                                      </div>
                                    ));
                                  } catch {
                                    return <p className="text-xs text-muted-foreground text-center">Lỗi định dạng dữ liệu hội thoại.</p>;
                                  }
                                })()
                              ) : selectedInterview.humeChatId && humeTranscripts[selectedInterview.id] ? (
                                humeTranscripts[selectedInterview.id].map((msg, i) => (
                                  <div key={i} className={cn("flex items-start gap-2 max-w-[85%] text-xs", msg.isUser ? "ml-auto flex-row-reverse" : "mr-auto")}>
                                    <div className={cn("size-6 rounded-full flex items-center justify-center text-[10px] shrink-0", msg.isUser ? "bg-primary text-white" : "bg-muted text-foreground border border-slate-200")}>
                                      {msg.isUser ? "👤" : "🤖"}
                                    </div>
                                    <div className="space-y-1">
                                      {msg.content.map((text, idx) => (
                                        <div key={idx} className={cn("p-2.5 rounded-xl leading-normal", msg.isUser ? "bg-primary text-primary-foreground rounded-tr-none" : "bg-slate-100 dark:bg-slate-800 text-foreground rounded-tl-none")}>
                                          {text}
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                ))
                              ) : (
                                <div className="text-center py-12">
                                  <MessageSquareIcon className="size-8 text-muted-foreground mx-auto mb-2 opacity-55" />
                                  <p className="text-xs text-muted-foreground">Không tìm thấy nội dung ghi âm hoặc transcript cho buổi này.</p>
                                </div>
                              )}
                            </div>
                          )}
                        </TabsContent>
                      </Tabs>
                    </div>
                  ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-center text-muted-foreground">
                      <MessageSquareIcon className="size-10 mb-2 opacity-40" />
                      <p className="text-xs font-semibold">Chọn một buổi phỏng vấn ở cột bên trái</p>
                      <p className="text-[11px] mt-0.5">để xem chi tiết feedback và transcript hội thoại.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
