"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useSearchParams } from "next/navigation";
import { ResumeHeader } from "@/components/resume-analysis/ResumeHeader";
import { ResumeUploadCard } from "@/components/resume-analysis/ResumeUploadCard";
import { ResumeAnalysisContainer } from "@/components/resume-analysis/ResumeAnalysisContainer";
import { ResumeHistoryPanel } from "@/components/resume-analysis/ResumeHistoryPanel";
import { ResumeKeywordsCard } from "@/components/resume-analysis/ResumeKeywordsCard";
import { ResumeTipsCard } from "@/components/resume-analysis/ResumeTipsCard";
import { ResumeLoadingState } from "@/components/resume-analysis/ResumeLoadingState";
import { useResumeAnalysis } from "@/hooks/useResumeAnalysis";
import { useResumeUpload } from "@/hooks/useResumeUpload";
import type { ExploreDraft } from "@/components/resume-analysis/types";
import {
  INDUSTRY_KEYWORDS,
  INDUSTRIES,
} from "@/components/resume-analysis/constants";

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

  const industryLabel =
    INDUSTRIES.find((item) => item.value === analysis.industry)?.label ?? null;
  const industryKeywords =
    INDUSTRY_KEYWORDS[analysis.industry] ?? INDUSTRY_KEYWORDS.other;

  return (
    <div className="min-h-screen bg-background bg-[radial-gradient(circle_at_top_right,rgba(179,0,0,0.05),transparent_45%),radial-gradient(circle_at_bottom_left,rgba(244,63,94,0.03),transparent_40%)]">
      <main className="container max-w-7xl px-4 py-8 md:px-6">
        <div className="space-y-8">
          <ResumeHeader usage={analysis.usage} />

          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className="space-y-6"
          >
            <div className="flex justify-center">
              <TabsList className="flex w-fit gap-1 rounded-full border border-border bg-muted p-1">
                <TabsTrigger
                  value="new"
                  className="cursor-pointer rounded-full px-6 py-2 text-sm font-semibold text-muted-foreground data-[state=active]:bg-card data-[state=active]:text-primary data-[state=active]:shadow-sm"
                >
                  Tạo phân tích mới
                </TabsTrigger>
                <TabsTrigger
                  value="history"
                  className="cursor-pointer rounded-full px-6 py-2 text-sm font-semibold text-muted-foreground data-[state=active]:bg-card data-[state=active]:text-primary data-[state=active]:shadow-sm"
                >
                  Lịch sử phân tích
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="new" className="outline-none">
              <div className="space-y-6">
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                  {/* Left Column: Form & Upload */}
                  <div className="lg:col-span-2">
                    <ResumeUploadCard
                      analysis={analysis}
                      upload={upload}
                      exploreDraft={exploreDraft}
                      industryLabel={industryLabel}
                      industryKeywords={industryKeywords}
                    />
                  </div>

                  {/* Right Column: Sidebar AI */}
                  <div className="space-y-6">
                    {analysis.isLoading && (
                      <ResumeLoadingState loadingStep={analysis.loadingStep} />
                    )}
                    <ResumeKeywordsCard
                      industry={analysis.industry}
                      industryLabel={industryLabel}
                      industryKeywords={industryKeywords}
                    />
                    <ResumeTipsCard />
                  </div>
                </div>

                {!analysis.isLoading && (
                  <ResumeAnalysisContainer
                    aiAnalysis={analysis.aiAnalysis}
                    jobInfoId={analysis.jobInfoIdRef.current}
                  />
                )}
              </div>
            </TabsContent>

            <TabsContent value="history" className="outline-none">
              <ResumeHistoryPanel
                isActive={activeTab === "history"}
                usageUsed={analysis.usage.used}
              />
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
}
