"use client";

import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
  LightbulbIcon,
  TerminalIcon,
  UploadCloudIcon,
  UserIcon,
} from "lucide-react";
import { ResumeActions } from "@/components/resume-analysis/ResumeActions";
import { ResumeDropzone } from "@/components/resume-analysis/ResumeDropzone";
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
    <section className="rounded-2xl border border-border bg-card p-6 shadow-sm md:p-8">
      <div className="mb-6 flex items-start gap-4">
        <div className="rounded-2xl bg-gradient-to-br from-primary to-orange-500 p-2.5 text-primary-foreground shadow-md">
          <ClipboardListIcon className="size-5" />
        </div>
        <div>
          <h2 className="text-xl font-bold tracking-tight text-foreground">
            Không gian làm việc
          </h2>
          <p className="mt-1 text-xs text-muted-foreground">
            Điền thông tin và tải lên CV để nhận đánh giá tối ưu chi tiết từ AI
            Career Coach.
          </p>
        </div>
      </div>

      {!analysis.hasRemainingUsage && (
        <div className="mb-6 rounded-2xl border border-primary/20 bg-primary/5 p-4 text-xs text-primary">
          <div className="flex gap-3">
            <AlertTriangleIcon className="mt-0.5 size-4 shrink-0" />
            <div>
              <p className="font-bold">Bạn đã hết lượt phân tích</p>
              <p className="mt-1 leading-relaxed text-muted-foreground">
                Vui lòng mua thêm lượt hoặc nâng cấp gói để tiếp tục trải nghiệm
                dịch vụ.
              </p>
              <div className="mt-3">
                <Button
                  asChild
                  size="sm"
                  className="rounded-xl bg-primary text-primary-foreground shadow-sm hover:bg-primary/95"
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

      <Form {...analysis.form}>
        <form
          onSubmit={analysis.form.handleSubmit(analysis.handleSubmitAnalysis)}
          className="space-y-6"
        >
          <FormField
            control={analysis.form.control}
            name="candidateName"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-muted-foreground">
                  <UserIcon className="size-4 text-primary" />
                  Họ tên ứng viên
                </FormLabel>
                <FormControl>
                  <Input
                    placeholder="Ví dụ: Nguyễn Văn A"
                    className="h-11 rounded-xl border-border bg-muted/20 text-foreground placeholder:text-muted-foreground focus:border-primary focus:bg-card"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <FormField
              control={analysis.form.control}
              name="jobTitle"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-muted-foreground">
                    <BriefcaseIcon className="size-4 text-primary" />
                    Vị trí tuyển dụng
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Ví dụ: Frontend Developer"
                      className="h-11 rounded-xl border-border bg-muted/20 text-foreground placeholder:text-muted-foreground focus:border-primary focus:bg-card"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={analysis.form.control}
              name="experienceLevel"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-muted-foreground">
                    <Layers3Icon className="size-4 text-primary" />
                    Cấp độ yêu cầu
                  </FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger className="h-11 rounded-xl border-border bg-muted/20 text-foreground focus:border-primary focus:bg-card">
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
          </div>

          <div className="space-y-2">
            <span className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-muted-foreground">
              <UploadCloudIcon className="size-4 text-primary" />
              Tải lên hồ sơ (CV)
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

          <FormField
            control={analysis.form.control}
            name="jobDescription"
            render={({ field }) => (
              <FormItem>
                <div className="flex items-center justify-between gap-3">
                  <FormLabel className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-muted-foreground">
                    <ClipboardListIcon className="size-4 text-primary" />
                    Mô tả công việc (Job Description)
                  </FormLabel>

                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={analysis.handlePasteJD}
                      className="flex cursor-pointer items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-primary hover:underline"
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
                    placeholder="Sao chép và dán đầy đủ mô tả công việc (JD)..."
                    className="min-h-[160px] rounded-xl border-border bg-muted/20 text-sm leading-relaxed text-foreground placeholder:text-muted-foreground focus:border-primary focus:bg-card"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid grid-cols-1 gap-4 rounded-2xl border border-border bg-muted/20 p-4 sm:grid-cols-2">
            <div className="space-y-2">
              <label className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-muted-foreground">
                <Building2Icon className="size-3.5 text-primary" />
                Lĩnh vực / Ngành nghề
              </label>
              <Select
                onValueChange={analysis.setIndustry}
                value={analysis.industry}
              >
                <SelectTrigger className="h-10 rounded-lg border-border bg-card text-foreground">
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
                <GlobeIcon className="size-3.5 text-primary" />
                Ngôn ngữ phân tích
              </label>
              <Select
                onValueChange={analysis.setLanguage}
                value={analysis.language}
              >
                <SelectTrigger className="h-10 rounded-lg border-border bg-card text-foreground">
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

          <div className="grid gap-2 sm:grid-cols-3">
            {QUICK_EXAMPLES.map((example) => (
              <button
                key={example.label}
                type="button"
                onClick={() => analysis.fillExample(example)}
                className="flex cursor-pointer items-center justify-between rounded-xl border border-border bg-card p-3 text-left text-xs font-semibold text-foreground transition-all hover:border-primary/50 hover:bg-primary/5"
              >
                <span>{example.label}</span>
                <ArrowRightIcon className="size-3 text-primary" />
              </button>
            ))}
          </div>

          <ResumeActions
            isLoading={analysis.isLoading}
            hasRemainingUsage={analysis.hasRemainingUsage}
          />
        </form>
      </Form>
    </section>
  );
}
