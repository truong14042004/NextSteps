"use client";

import type { DeepPartial } from "ai";
import { AnalysisResults } from "@/app/app/AnalysisResults";
import { aiAnalyzeSchema } from "@/services/ai/resumes/schemas";
import type { z } from "zod";

export function ResumeAnalysisResult({
  aiAnalysis,
  isLoading,
  jobInfoId,
}: {
  aiAnalysis: DeepPartial<z.infer<typeof aiAnalyzeSchema>> | undefined;
  isLoading: boolean;
  jobInfoId?: string | null;
}) {
  return (
    <AnalysisResults
      aiAnalysis={aiAnalysis}
      isLoading={isLoading}
      jobInfoId={jobInfoId}
    />
  );
}
