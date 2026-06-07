import type { AnalysisFormData } from "@/components/resume-analysis/types";

export function buildResumeAnalysisFormData({
  resumeFile,
  values,
  industryLabel,
  languageLabel,
  jobInfoId,
}: {
  resumeFile: File | null;
  values: AnalysisFormData;
  industryLabel: string;
  languageLabel: string;
  jobInfoId: string | null;
}) {
  const formData = new FormData();

  if (resumeFile) {
    formData.append("resumeFile", resumeFile);
  }

  formData.append("jobTitle", values.jobTitle);
  formData.append("experienceLevel", values.experienceLevel);

  const customDescription = `[Ngành nghề: ${industryLabel}] [Ngôn ngữ phân tích: ${languageLabel}]\n\n${values.jobDescription}`;
  formData.append("description", customDescription);

  if (jobInfoId) {
    formData.append("jobInfoId", jobInfoId);
  }

  return formData;
}