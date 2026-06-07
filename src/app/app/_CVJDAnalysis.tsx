"use client";

import ResumeAnalysisPage from "@/components/resume-analysis/ResumeAnalysisPage";

export default function CVJDAnalysisPage({
  exploreDraft = null,
  jobDraft = null,
}: {
  exploreDraft?: {
    postId: string;
    jobTitle: string;
    companyName: string | null;
    jobDescription: string;
  } | null;
  jobDraft?: {
    id: string;
    jobTitle: string;
    experienceLevel: string;
    companyName?: string | null;
    jobDescription: string;
  } | null;
}) {
  return <ResumeAnalysisPage exploreDraft={exploreDraft} />;
}
