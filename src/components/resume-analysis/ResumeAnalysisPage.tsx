"use client";

import { useEffect, useMemo, useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useSearchParams } from "next/navigation";
import { ResumeHeader } from "@/components/resume-analysis/ResumeHeader";
import { ResumeUploadCard } from "@/components/resume-analysis/ResumeUploadCard";
import { ResumeAnalysisContainer } from "@/components/resume-analysis/ResumeAnalysisContainer";
import { ResumeHistoryPanel } from "@/components/resume-analysis/ResumeHistoryPanel";
import { ResumeLoadingState } from "@/components/resume-analysis/ResumeLoadingState";
import { useResumeAnalysis } from "@/hooks/useResumeAnalysis";
import { useResumeUpload } from "@/hooks/useResumeUpload";
import { useResumeHistory } from "@/hooks/useResumeHistory";
import type { ExploreDraft } from "@/components/resume-analysis/types";
import {
  INDUSTRY_KEYWORDS,
  INDUSTRIES,
} from "@/components/resume-analysis/constants";
import {
  FileTextIcon,
  TargetIcon,
  ActivityIcon,
  FlameIcon,
} from "lucide-react";

export default function ResumeAnalysisPage({
  exploreDraft = null,
}: {
  exploreDraft?: ExploreDraft | null;
}) {
  const upload = useResumeUpload();
  const analysis = useResumeAnalysis({
    exploreDraft,
    resumeFile: upload.resumeFile,
  });

  const searchParams = useSearchParams();
  const defaultTab = searchParams.get("tab") === "history" ? "history" : "new";
  const [activeTab, setActiveTab] = useState(defaultTab);

  const historyState = useResumeHistory({ isActive: true });
  const history = historyState.history;

  // Pre-fill form from sessionStorage when navigating back from history "Lại" button
  useEffect(() => {
    const raw = sessionStorage.getItem("analyze_prefill");
    if (!raw) return;
    try {
      const prefill = JSON.parse(raw) as {
        candidateName: string;
        jobTitle: string;
        experienceLevel: string;
        jobDescription: string;
      };
      sessionStorage.removeItem("analyze_prefill");
      analysis.form.setValue("candidateName", prefill.candidateName);
      analysis.form.setValue("jobTitle", prefill.jobTitle);
      analysis.form.setValue(
        "experienceLevel",
        prefill.experienceLevel as
          | "intern"
          | "fresh"
          | "junior"
          | "mid-level"
          | "senior",
      );
      analysis.form.setValue("jobDescription", prefill.jobDescription);
      const jobInfoId = searchParams.get("jobInfoId");
      if (jobInfoId) {
        // Try to fetch the previously uploaded resume for this jobInfo and auto-run analysis
        (async () => {
          try {
            const res = await fetch(`/api/job-infos/${jobInfoId}/resume`);
            if (res.ok) {
              const blob = await res.blob();
              const contentType =
                res.headers.get("content-type") || "application/pdf";
              const disposition = res.headers.get("content-disposition") || "";
              let filename = `${jobInfoId}.pdf`;
              const match = disposition.match(/filename="?([^";]+)"?/);
              if (match) filename = match[1];

              const file = new File([blob], filename, { type: contentType });
              upload.handleSelectFile(file);

              // Give React a tick to propagate the resume file into the analysis hook
              await new Promise((r) => setTimeout(r, 50));

              // Trigger analysis re-run using the existing jobInfo id
              if (
                typeof (analysis as any).reAnalyzeWithJobInfo === "function"
              ) {
                (analysis as any).reAnalyzeWithJobInfo(jobInfoId);
              } else {
                // fallback: set jobInfoRef then submit via form handler
                analysis.jobInfoIdRef.current = jobInfoId;
                analysis.form.handleSubmit(analysis.handleSubmitAnalysis)();
              }
            }
          } catch (e) {
            // ignore fetch errors, user can manually upload and submit
            // console.error(e)
          }
        })();
      }
      setActiveTab("new");
    } catch {
      sessionStorage.removeItem("analyze_prefill");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const industryLabel =
    INDUSTRIES.find((item) => item.value === analysis.industry)?.label ?? null;
  const industryKeywords =
    INDUSTRY_KEYWORDS[analysis.industry] ?? INDUSTRY_KEYWORDS.other;

  // 1. CV đã phân tích
  const completedCount = useMemo(() => {
    if (!history) return 0;
    return history.filter((item) => {
      if (!item.analysisResult) return false;
      try {
        const parsed = JSON.parse(item.analysisResult);
        return !!parsed;
      } catch {
        return false;
      }
    }).length;
  }, [history]);

  const remainingCount = analysis.usage.remaining ?? 0;

  // 2. ATS trung bình & 3. Match Score trung bình
  const { avgAtsScore, avgMatchScore } = useMemo(() => {
    if (!history) return { avgAtsScore: null, avgMatchScore: null };

    let totalAts = 0;
    let totalMatch = 0;
    let count = 0;

    for (const item of history) {
      if (!item.analysisResult) continue;
      try {
        const parsed = JSON.parse(item.analysisResult);
        if (parsed) {
          const atsScore = parsed.ats?.score;
          const matchScore = parsed.jobMatch?.score;

          if (atsScore != null) {
            totalAts += atsScore;
          }
          if (matchScore != null) {
            totalMatch += matchScore;
          }
          if (atsScore != null || matchScore != null) {
            count++;
          }
        }
      } catch {
        // ignore JSON parse errors
      }
    }

    if (count === 0) return { avgAtsScore: null, avgMatchScore: null };

    // ats score is out of 10, to scale to 100 we multiply average by 10
    const avgAts = Math.round((totalAts / count) * 10);
    // match score is out of 10, to scale to 100 we multiply average by 10
    const avgMatch = Math.round((totalMatch / count) * 10);

    return {
      avgAtsScore: avgAts,
      avgMatchScore: avgMatch,
    };
  }, [history]);

  // 4. Vị trí đã lưu
  const uniquePositions = useMemo(() => {
    if (!history) return 0;
    const unique = new Set(
      history
        .map((item) => item.title?.trim().toLowerCase())
        .filter((title): title is string => !!title)
    );
    return unique.size;
  }, [history]);

  return (
    <div className="container my-6 space-y-8 max-w-6xl">
          {/* 1. Hero Section */}
          <ResumeHeader />

          {/* 2. KPI Cards Section */}
          <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {/* Card 1: CV đã phân tích */}
            <div className="bg-white dark:bg-card border border-slate-200 dark:border-slate-800 rounded-[24px] p-4 shadow-xs hover:shadow-md transition-all duration-200">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  CV đã phân tích
                </span>
                <FileTextIcon className="size-4.5 text-rose-500" />
              </div>
              <div className="mt-2">
                <span className="text-xl font-bold text-slate-900 dark:text-foreground">
                  {completedCount}
                </span>
                <span className="text-[10px] text-muted-foreground ml-1">
                  đã phân tích ({remainingCount} còn lại)
                </span>
              </div>
              <div className="mt-2.5 h-1 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-muted">
                <div
                  className="h-full rounded-full bg-rose-500 transition-all duration-500"
                  style={{
                    width: `${Math.min(
                      (completedCount / Math.max(completedCount + remainingCount, 1)) * 100,
                      100
                    )}%`,
                  }}
                />
              </div>
            </div>

            {/* Card 2: ATS trung bình */}
            <div className="bg-white dark:bg-card border border-slate-200 dark:border-slate-800 rounded-[24px] p-4 shadow-xs hover:shadow-md transition-all duration-200">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  ATS trung bình
                </span>
                <TargetIcon className="size-4.5 text-emerald-500" />
              </div>
              <div className="mt-2">
                <span className="text-xl font-bold text-slate-900 dark:text-foreground">
                  {avgAtsScore != null ? `${avgAtsScore}/100` : "--/100"}
                </span>
                <span className="text-[10px] text-muted-foreground ml-1">
                  Mức tối ưu cấu trúc
                </span>
              </div>
              <div className="mt-2.5 h-1 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-muted">
                <div
                  className="h-full rounded-full bg-emerald-500 transition-all duration-500"
                  style={{ width: `${avgAtsScore != null ? avgAtsScore : 0}%` }}
                />
              </div>
            </div>

            {/* Card 3: Match Score trung bình */}
            <div className="bg-white dark:bg-card border border-slate-200 dark:border-slate-800 rounded-[24px] p-4 shadow-xs hover:shadow-md transition-all duration-200">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Match Score trung bình
                </span>
                <ActivityIcon className="size-4.5 text-blue-500" />
              </div>
              <div className="mt-2">
                <span className="text-xl font-bold text-slate-900 dark:text-foreground">
                  {avgMatchScore != null ? `${avgMatchScore}%` : "--%"}
                </span>
                <span className="text-[10px] text-muted-foreground ml-1">
                  Tỷ lệ khớp yêu cầu JD
                </span>
              </div>
              <div className="mt-2.5 h-1 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-muted">
                <div
                  className="h-full rounded-full bg-blue-500 transition-all duration-500"
                  style={{ width: `${avgMatchScore != null ? avgMatchScore : 0}%` }}
                />
              </div>
            </div>

            {/* Card 4: Vị trí đã lưu */}
            <div className="bg-white dark:bg-card border border-slate-200 dark:border-slate-800 rounded-[24px] p-4 shadow-xs hover:shadow-md transition-all duration-200">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Vị trí đã lưu
                </span>
                <FlameIcon className="size-4.5 text-orange-500 fill-orange-400" />
              </div>
              <div className="mt-2">
                <span className="text-xl font-bold text-slate-900 dark:text-foreground">
                  {uniquePositions > 0 ? `${uniquePositions} vị trí` : "0 vị trí"}
                </span>
                <span className="text-[10px] text-muted-foreground ml-1">
                  Lưu trữ trong Workspace
                </span>
              </div>
              <div className="mt-2.5 h-1 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-muted">
                <div
                  className="h-full rounded-full bg-amber-500 transition-all duration-500"
                  style={{
                    width: `${uniquePositions > 0 ? Math.min((uniquePositions / 10) * 100, 100) : 0}%`,
                  }}
                />
              </div>
            </div>
          </section>

          {/* 3. Main Workspace Tabs */}
          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className="space-y-6"
          >
            <div className="flex justify-center">
              <TabsList className="flex w-fit gap-1 rounded-full border border-border/60 bg-muted/65 p-1 backdrop-blur-sm">
                <TabsTrigger
                  value="new"
                  className="cursor-pointer rounded-full px-6 py-2 text-sm font-semibold text-muted-foreground data-[state=active]:bg-white dark:data-[state=active]:bg-card data-[state=active]:text-primary data-[state=active]:shadow-sm"
                >
                  Tạo phân tích mới
                </TabsTrigger>
                <TabsTrigger
                  value="history"
                  className="cursor-pointer rounded-full px-6 py-2 text-sm font-semibold text-muted-foreground data-[state=active]:bg-white dark:data-[state=active]:bg-card data-[state=active]:text-primary data-[state=active]:shadow-sm"
                >
                  Lịch sử phân tích
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="new" className="outline-none">
              <div className="space-y-6">
                {analysis.isLoading ? (
                  <ResumeLoadingState loadingStep={analysis.loadingStep} />
                ) : (
                  <>
                    <ResumeUploadCard
                      analysis={analysis}
                      upload={upload}
                      exploreDraft={exploreDraft}
                      industryLabel={industryLabel}
                      industryKeywords={industryKeywords}
                    />

                    <ResumeAnalysisContainer
                      aiAnalysis={analysis.aiAnalysis}
                      jobInfoId={analysis.jobInfoIdRef.current}
                    />
                  </>
                )}
              </div>
            </TabsContent>

            <TabsContent value="history" className="outline-none">
              <ResumeHistoryPanel
                isActive={activeTab === "history"}
                usageUsed={analysis.usage.used}
                historyState={historyState}
              />
            </TabsContent>
          </Tabs>
    </div>
  );
}
