"use client";

import { experimental_useObject as useObject } from "@ai-sdk/react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { type DeepPartial } from "ai";
import { z } from "zod";
import { aiAnalyzeSchema } from "@/services/ai/resumes/schemas";
import { createJobInfoForAnalysis } from "@/features/jobInfos/actions";
import { buildResumeAnalysisFormData } from "@/lib/resume-upload";
import { defaultUsage, type AnalysisFormData, type ExploreDraft, type UsageInfo, analysisSchema } from "@/components/resume-analysis/types";
import { INDUSTRIES, LANGUAGES, QUICK_EXAMPLES } from "@/components/resume-analysis/constants";

async function fetchFeatureUsage(feature: string) {
  const response = await fetch(`/api/user/usage?feature=${feature}`, {
    cache: "no-store",
  });

  if (!response.ok) return null;

  const data = (await response.json()) as { usage?: UsageInfo | null };
  return data.usage ?? null;
}

export function useResumeAnalysis({
  exploreDraft = null,
  resumeFile,
}: {
  exploreDraft?: ExploreDraft | null;
  resumeFile: File | null;
}) {
  const [usage, setUsage] = useState<UsageInfo>(defaultUsage);
  const [industry, setIndustry] = useState<string>("it");
  const [language, setLanguage] = useState<string>("vi");
  const [loadingStep, setLoadingStep] = useState(0);
  const loadingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const jobInfoIdRef = useRef<string | null>(null);
  const wasAnalyzingRef = useRef(false);

  const hasRemainingUsage = usage.remaining == null || usage.remaining > 0;

  const form = useForm<AnalysisFormData>({
    resolver: zodResolver(analysisSchema),
    defaultValues: {
      candidateName: "",
      jobTitle: "",
      experienceLevel: "fresh",
      jobDescription: "",
    },
  });

  const refreshUsage = useCallback(async () => {
    const nextUsage = await fetchFeatureUsage("resume_analysis");
    if (nextUsage != null) setUsage(nextUsage);
  }, []);

  useEffect(() => {
    refreshUsage();
  }, [refreshUsage]);

  useEffect(() => {
    if (!exploreDraft) return;

    form.setValue("jobTitle", exploreDraft.jobTitle);
    form.setValue("jobDescription", exploreDraft.jobDescription);
    form.setValue("experienceLevel", "fresh");
  }, [exploreDraft, form]);

  const selectedIndustryLabel = useMemo(
    () => INDUSTRIES.find((item) => item.value === industry)?.label ?? industry,
    [industry],
  );

  const selectedLanguageLabel = useMemo(
    () => LANGUAGES.find((item) => item.value === language)?.label ?? language,
    [language],
  );

  const { object: aiAnalysis, isLoading, submit: submitAnalysisRequest } = useObject({
    api: "/api/ai/resumes/analyze",
    schema: aiAnalyzeSchema,
    fetch: (url, options) => {
      const headers = new Headers(options?.headers);
      headers.delete("Content-Type");

      const formData = buildResumeAnalysisFormData({
        resumeFile,
        values: form.getValues(),
        industryLabel: selectedIndustryLabel,
        languageLabel: selectedLanguageLabel,
        jobInfoId: jobInfoIdRef.current,
      });

      return fetch(url, { ...options, headers, body: formData });
    },
  });

  useEffect(() => {
    if (isLoading) {
      setLoadingStep(0);
      loadingIntervalRef.current = setInterval(() => {
        setLoadingStep((previous) => (previous < 4 ? previous + 1 : previous));
      }, 3000);
    } else if (loadingIntervalRef.current) {
      clearInterval(loadingIntervalRef.current);
      loadingIntervalRef.current = null;
    }

    return () => {
      if (loadingIntervalRef.current) {
        clearInterval(loadingIntervalRef.current);
      }
    };
  }, [isLoading]);

  useEffect(() => {
    if (wasAnalyzingRef.current && !isLoading) {
      refreshUsage();
    }

    wasAnalyzingRef.current = isLoading;
  }, [isLoading, refreshUsage]);

  const handleSubmitAnalysis = useCallback(
    async (values: AnalysisFormData) => {
      if (!hasRemainingUsage) {
        toast.error("Bạn đã hết lượt phân tích. Vui lòng mua thêm lượt.");
        return;
      }

      if (!resumeFile) {
        toast.error("Vui lòng tải lên CV của bạn");
        return;
      }

      const result = await createJobInfoForAnalysis({
        candidateName: values.candidateName,
        jobTitle: values.jobTitle,
        experienceLevel: values.experienceLevel,
        jobDescription: values.jobDescription,
      });

      if (result.error) {
        toast.error(result.message);
        return;
      }

      jobInfoIdRef.current = result.id;
      submitAnalysisRequest(null);
    },
    [hasRemainingUsage, resumeFile, submitAnalysisRequest],
  );

  const fillExample = useCallback(
    (example: typeof QUICK_EXAMPLES[number]) => {
      form.setValue("candidateName", example.candidateName);
      form.setValue("jobTitle", example.jobTitle);
      form.setValue("experienceLevel", example.experienceLevel);
      form.setValue("jobDescription", example.jobDescription);
      setIndustry(example.industry);
      toast.success(`Đã điền thông tin mẫu: ${example.label}`);
    },
    [form],
  );

  const handlePasteJD = useCallback(async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        form.setValue("jobDescription", text);
        toast.success("Đã dán mô tả công việc từ bộ nhớ tạm");
      } else {
        toast.error("Bộ nhớ tạm của bạn đang trống");
      }
    } catch {
      toast.error("Không thể truy cập bộ nhớ tạm. Hãy tự dán (Ctrl+V) vào ô nhập.");
    }
  }, [form]);

  const jobDescText = form.watch("jobDescription") || "";

  return {
    form,
    usage,
    hasRemainingUsage,
    aiAnalysis: aiAnalysis as DeepPartial<z.infer<typeof aiAnalyzeSchema>> | undefined,
    isLoading,
    loadingStep,
    jobInfoIdRef,
    industry,
    language,
    setIndustry,
    setLanguage,
    selectedIndustryLabel,
    selectedLanguageLabel,
    jobDescText,
    fillExample,
    handlePasteJD,
    handleSubmitAnalysis,
    refreshUsage,
  };
}