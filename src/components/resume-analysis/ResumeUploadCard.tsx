"use client";

import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { experienceLevels } from "@/drizzle/schema/jobInfo";
import { formatExperienceLevel } from "@/features/jobInfos/lib/formatters";
import {
  AlertTriangleIcon,
  ArrowRightIcon,
  BriefcaseIcon,
  Building2Icon,
  ClipboardListIcon,
  FileCodeIcon,
  GlobeIcon,
  Layers3Icon,
  UploadCloudIcon,
  UserIcon,
  SparklesIcon,
  CopyIcon,
  CopyCheckIcon,
} from "lucide-react";
import { ResumeActions } from "@/components/resume-analysis/ResumeActions";
import { ResumeDropzone } from "@/components/resume-analysis/ResumeDropzone";
import { ResumeTipsCard } from "@/components/resume-analysis/ResumeTipsCard";
import {
  INDUSTRIES,
  INDUSTRY_KEYWORDS,
  LANGUAGES,
  QUICK_EXAMPLES,
} from "@/components/resume-analysis/constants";
import type { useResumeAnalysis } from "@/hooks/useResumeAnalysis";
import type { useResumeUpload } from "@/hooks/useResumeUpload";
import type { ExploreDraft } from "@/components/resume-analysis/types";

type ResumeAnalysisState = ReturnType<typeof useResumeAnalysis>;
type ResumeUploadState = ReturnType<typeof useResumeUpload>;

export function ResumeUploadCard({
  analysis,
  upload,
  exploreDraft = null,
  industryLabel,
  industryKeywords: industryKeywordsProp,
}: {
  analysis: ResumeAnalysisState;
  upload: ResumeUploadState;
  exploreDraft?: ExploreDraft | null;
  industryLabel?: string | null;
  industryKeywords?: string[];
}) {
  const industryKeywords =
    industryKeywordsProp ??
    INDUSTRY_KEYWORDS[analysis.industry] ??
    INDUSTRY_KEYWORDS.other;

  return (
    <section className="rounded-[24px] border border-slate-200 dark:border-slate-800 bg-white dark:bg-card p-6 shadow-sm md:p-8">
      {/* Title Header */}
      <div className="mb-6 flex items-start gap-4">
        <div className="rounded-2xl bg-gradient-to-br from-[#DC2626] to-[#8B5CF6] p-2.5 text-white shadow-md">
          <ClipboardListIcon className="size-5" />
        </div>
        <div>
          <h2 className="text-xl font-bold tracking-tight text-foreground">
            AI Analysis Workspace
          </h2>
          <p className="mt-1 text-xs text-muted-foreground">
            Điền thông tin và tải lên CV để nhận đánh giá tối ưu chi tiết từ AI Career Coach.
          </p>
        </div>
      </div>

      {/* Warnings & Draft Headers */}
      {!analysis.hasRemainingUsage && (
        <div className="mb-6 rounded-2xl border border-rose-200 bg-rose-50/50 dark:border-rose-900/30 dark:bg-rose-950/10 p-4 text-xs text-rose-700 dark:text-rose-400">
          <div className="flex gap-3">
            <AlertTriangleIcon className="mt-0.5 size-4 shrink-0 text-[#DC2626]" />
            <div>
              <p className="font-bold">Bạn đã hết lượt phân tích</p>
              <p className="mt-1 leading-relaxed text-muted-foreground">
                Vui lòng mua thêm lượt hoặc nâng cấp gói để tiếp tục trải nghiệm dịch vụ.
              </p>
              <div className="mt-3">
                <Button
                  asChild
                  size="sm"
                  className="rounded-xl bg-[#DC2626] text-white hover:bg-[#DC2626]/90 shadow-sm"
                >
                  <Link href="/#pricing">Nâng cấp ngay</Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {exploreDraft && (
        <div className="mb-6 rounded-2xl border border-primary/20 bg-primary/5 p-4 text-xs">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="font-bold text-primary">
                Bản nháp liên kết từ Tin tuyển dụng
              </p>
              <p className="mt-1 text-muted-foreground">
                {exploreDraft.companyName
                  ? `${exploreDraft.companyName} · ${exploreDraft.jobTitle}`
                  : exploreDraft.jobTitle}
              </p>
            </div>
            <Button
              asChild
              variant="outline"
              size="sm"
              className="rounded-xl border-border bg-card text-primary"
            >
              <Link href={`/explore/${exploreDraft.postId}`}>
                Quay lại bài viết
              </Link>
            </Button>
          </div>
        </div>
      )}

      {/* Form Workspace */}
      <Form {...analysis.form}>
        <form
          onSubmit={analysis.form.handleSubmit(analysis.handleSubmitAnalysis)}
          className="space-y-6"
        >
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-5">
            {/* Left Column (60%): CV Upload & Basic Info & JD */}
            <div className="lg:col-span-3 space-y-6">
              {/* Dòng 1: Họ tên & Vị trí tuyển dụng */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <FormField
                  control={analysis.form.control}
                  name="candidateName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-muted-foreground">
                        <UserIcon className="size-4 text-rose-500" />
                        Họ tên ứng viên
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Ví dụ: Nguyễn Văn A"
                          className="h-11 rounded-xl border-slate-200 bg-muted/10 text-foreground placeholder:text-muted-foreground focus:border-[#DC2626] focus:ring-1 focus:ring-[#DC2626]/20 focus:bg-card transition-all"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={analysis.form.control}
                  name="jobTitle"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-muted-foreground">
                        <BriefcaseIcon className="size-4 text-rose-500" />
                        Vị trí tuyển dụng
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Ví dụ: Frontend Developer"
                          className="h-11 rounded-xl border-slate-200 bg-muted/10 text-foreground placeholder:text-muted-foreground focus:border-[#DC2626] focus:ring-1 focus:ring-[#DC2626]/20 focus:bg-card transition-all"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Dòng 2 (phần trái): Cấp độ yêu cầu */}
              <FormField
                control={analysis.form.control}
                name="experienceLevel"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-muted-foreground">
                      <Layers3Icon className="size-4 text-rose-500" />
                      Cấp độ yêu cầu
                    </FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger className="h-11 rounded-xl border-slate-200 bg-muted/10 text-foreground focus:border-[#DC2626] focus:ring-1 focus:ring-[#DC2626]/20 focus:bg-card transition-all">
                          <SelectValue placeholder="Chọn cấp độ" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="rounded-xl">
                        {experienceLevels.map((level) => (
                          <SelectItem
                            key={level}
                            value={level}
                            className="rounded-lg"
                          >
                            {formatExperienceLevel(level)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Mô tả công việc (JD) Textarea */}
              <FormField
                control={analysis.form.control}
                name="jobDescription"
                render={({ field }) => (
                  <FormItem>
                    <div className="flex items-center justify-between gap-3">
                      <FormLabel className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-muted-foreground">
                        <ClipboardListIcon className="size-4 text-rose-500" />
                        Mô tả công việc (JD)
                      </FormLabel>

                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={analysis.handlePasteJD}
                          className="flex cursor-pointer items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-[#DC2626] hover:underline"
                        >
                          <FileCodeIcon className="size-3" />
                          Dán từ Clipboard
                        </button>
                        <span className="text-[10px] font-semibold text-muted-foreground">
                          {analysis.jobDescText.length} ký tự
                        </span>
                      </div>
                    </div>
                    <FormControl>
                      <Textarea
                        placeholder={"Ví dụ:\n- Mô tả công việc\n- Kỹ năng yêu cầu\n- Kinh nghiệm\n- Công nghệ sử dụng"}
                        className="min-h-[190px] rounded-xl border-slate-200 bg-muted/10 text-sm leading-relaxed text-foreground placeholder:text-muted-foreground focus:border-[#DC2626] focus:ring-1 focus:ring-[#DC2626]/20 focus:bg-card transition-all resize-y"
                        {...field}
                      />
                    </FormControl>
                    <p className="text-[11px] text-muted-foreground italic">
                      JD càng chi tiết, AI càng đánh giá chính xác hơn.
                    </p>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* CV Upload */}
              <div className="space-y-2">
                <span className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-muted-foreground">
                  <UploadCloudIcon className="size-4 text-rose-500" />
                  Tải hồ sơ CV
                </span>
                <ResumeDropzone
                  resumeFile={upload.resumeFile}
                  isDragOver={upload.isDragOver}
                  onDragOver={(event) => {
                    event.preventDefault();
                    upload.setIsDragOver(true);
                  }}
                  onDragLeave={(event) => {
                    event.preventDefault();
                    upload.setIsDragOver(false);
                  }}
                  onDrop={upload.handleDrop}
                  onSelectFile={upload.handleSelectFile}
                  onClearFile={upload.clearResumeFile}
                />
              </div>
            </div>

            {/* Right Column (40%): Keywords, Tips, Selectors, Quick Examples, Actions */}
            <div className="lg:col-span-2 space-y-6 flex flex-col justify-between">
              <div className="space-y-6">
                {/* ATS Keywords Suggestion */}
                <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-card/40 p-4">
                  <div className="flex items-center justify-between">
                    <h3 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-foreground">
                      Từ khóa ATS gợi ý
                    </h3>
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(industryKeywords.join(", "));
                        toast.success("Đã sao chép tất cả từ khóa vào clipboard");
                      }}
                      className="text-[10px] font-bold text-[#DC2626] uppercase tracking-wider hover:underline flex items-center gap-1"
                    >
                      <CopyIcon className="size-3" />
                      Sao chép tất cả
                    </button>
                  </div>

                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {industryKeywords.map((keyword) => (
                      <button
                        key={keyword}
                        type="button"
                        onClick={() => {
                          navigator.clipboard.writeText(keyword);
                          toast.success(`Đã sao chép: "${keyword}"`);
                        }}
                        className="inline-flex items-center gap-1 cursor-pointer rounded-full border border-slate-200/80 bg-white dark:bg-card dark:border-slate-800 px-3 py-1 text-[10px] font-bold text-slate-600 dark:text-slate-300 transition-all hover:border-[#DC2626]/40 hover:bg-rose-500/[0.04] hover:text-[#DC2626] hover:scale-[1.03] active:scale-[0.98]"
                      >
                        {keyword}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Collapsible Tips Card */}
                <ResumeTipsCard />

                {/* Dòng 2 (phần phải): Lĩnh vực & Ngôn ngữ phân tích */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <label className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-muted-foreground">
                      <Building2Icon className="size-3.5 text-rose-500" />
                      Ngành nghề
                    </label>
                    <Select
                      onValueChange={analysis.setIndustry}
                      value={analysis.industry}
                    >
                      <SelectTrigger className="h-11 rounded-xl border-slate-200 bg-muted/10 text-foreground focus:border-[#DC2626] focus:ring-1 focus:ring-[#DC2626]/20">
                        <SelectValue placeholder="Chọn ngành nghề" />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl">
                        {INDUSTRIES.map((industry) => (
                          <SelectItem
                            key={industry.value}
                            value={industry.value}
                            className="rounded-lg"
                          >
                            {industry.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <label className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-muted-foreground">
                      <GlobeIcon className="size-3.5 text-rose-500" />
                      Ngôn ngữ
                    </label>
                    <Select
                      onValueChange={analysis.setLanguage}
                      value={analysis.language}
                    >
                      <SelectTrigger className="h-11 rounded-xl border-slate-200 bg-muted/10 text-foreground focus:border-[#DC2626] focus:ring-1 focus:ring-[#DC2626]/20">
                        <SelectValue placeholder="Chọn ngôn ngữ" />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl">
                        {LANGUAGES.map((language) => (
                          <SelectItem
                            key={language.value}
                            value={language.value}
                            className="rounded-lg"
                          >
                            {language.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Mẫu JD nhanh */}
                <div className="space-y-2.5">
                  <span className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-muted-foreground">
                    <SparklesIcon className="size-3.5 text-rose-500" />
                    Mẫu JD nhanh
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {QUICK_EXAMPLES.map((example) => (
                      <button
                        key={example.label}
                        type="button"
                        onClick={() => {
                          analysis.fillExample(example);
                          toast.success(`Đã áp dụng mẫu: ${example.label}`);
                        }}
                        className="flex cursor-pointer items-center gap-1 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-card px-3.5 py-2 text-xs font-bold text-foreground transition-all hover:border-[#DC2626] hover:bg-rose-500/[0.04] hover:-translate-y-0.5 hover:shadow-xs active:translate-y-0"
                      >
                        <span>{example.label}</span>
                        <ArrowRightIcon className="size-3 text-[#DC2626]" />
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Main Submit Action Button at bottom right */}
              <div className="pt-6">
                <ResumeActions
                  isLoading={analysis.isLoading}
                  hasRemainingUsage={analysis.hasRemainingUsage}
                />
              </div>
            </div>
          </div>
        </form>
      </Form>
    </section>
  );
}
