"use client";

import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { experienceLevels } from "@/drizzle/schema/jobInfo";
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
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatExperienceLevel } from "@/features/jobInfos/lib/formatters";
import { LoadingSwap } from "@/components/ui/loading-swap";
import { InterviewJobInfo } from "./page";
import { createQuickInterview } from "@/features/jobInfos/actions";
import { toast } from "sonner";
import {
  UploadIcon,
  XIcon,
  FileTextIcon,
  SparklesIcon,
  UserIcon,
  BriefcaseIcon,
  Layers3Icon,
  ClipboardListIcon,
  ArrowRightIcon,
  FileCheckIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

const quickInterviewSchema = z.object({
  candidateName: z.string().min(1, "Vui lòng nhập tên ứng viên"),
  jobTitle: z.string().min(1, "Vui lòng nhập vị trí ứng tuyển"),
  experienceLevel: z.enum(experienceLevels),
  jobDescription: z.string().min(1, "Vui lòng nhập mô tả công việc"),
});

type QuickInterviewData = z.infer<typeof quickInterviewSchema>;

export function QuickInterviewOption({
  onSelect,
  onSaveDraft,
}: {
  onSelect: (jobInfo: InterviewJobInfo) => void;
  onSaveDraft?: () => void;
}) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSavingDraft, setIsSavingDraft] = useState(false);
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  const form = useForm<QuickInterviewData>({
    resolver: zodResolver(quickInterviewSchema),
    defaultValues: {
      candidateName: "",
      jobTitle: "",
      experienceLevel: "intern",
      jobDescription: "",
    },
  });

  function handleFileUpload(file: File | null) {
    if (file == null) return;

    if (file.size > 10 * 1024 * 1024) {
      toast.error("Kích thước file không vượt quá 10MB");
      return;
    }

    const allowedTypes = [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "text/plain",
    ];

    if (!allowedTypes.includes(file.type)) {
      toast.error("Vui lòng tải file định dạng PDF, Word hoặc text");
      return;
    }

    setResumeFile(file);
    toast.success(`Đã đính kèm CV: ${file.name}`);
  }

  const handleSaveDraftClick = async () => {
    const data = form.getValues();
    const candidateName = (data.candidateName || "").trim();
    const jobTitle = (data.jobTitle || "").trim();
    const jobDescription = (data.jobDescription || "").trim();

    if (!candidateName || !jobTitle || !jobDescription) {
      toast.error("Vui lòng nhập Họ tên, Vị trí và Mô tả công việc để lưu nháp.");
      return;
    }

    setIsSavingDraft(true);
    try {
      const result = await createQuickInterview({
        candidateName,
        jobTitle,
        experienceLevel: data.experienceLevel,
        jobDescription,
      });

      if (result.error) {
        toast.error(result.message);
        return;
      }

      toast.success("Đã lưu nháp thông tin phỏng vấn thành công!");
      if (onSaveDraft) {
        onSaveDraft();
      }
    } catch (error) {
      toast.error("Lưu nháp thất bại");
      console.error(error);
    } finally {
      setIsSavingDraft(false);
    }
  };

  const onSubmit = async (data: QuickInterviewData) => {
    setIsSubmitting(true);

    try {
      let cvSummary: string | undefined;

      if (resumeFile) {
        const formData = new FormData();
        formData.append("resumeFile", resumeFile);

        const res = await fetch("/api/ai/resumes/extract", {
          method: "POST",
          body: formData,
        });

        if (res.ok) {
          const json = await res.json();
          cvSummary = json.summary;
        }
      }

      const result = await createQuickInterview({
        candidateName: data.candidateName,
        jobTitle: data.jobTitle,
        experienceLevel: data.experienceLevel,
        jobDescription: data.jobDescription,
      });

      if (result.error) {
        toast.error(result.message);
        return;
      }

      onSelect({ ...result.jobInfo, cvSummary });
    } catch (error) {
      toast.error("Tạo phỏng vấn thất bại");
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-w-0 space-y-6">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
          {/* Section 1: Thông tin ứng viên & vị trí */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FormField
              control={form.control}
              name="candidateName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                    <UserIcon className="size-3.5 text-slate-500" />
                    Họ tên ứng viên
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Nguyễn Văn A"
                      className="h-9 rounded-lg border-border bg-background/80 shadow-none text-xs focus-visible:ring-1"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="jobTitle"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                    <BriefcaseIcon className="size-3.5 text-slate-500" />
                    Vị trí ứng tuyển
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Frontend Developer"
                      className="h-9 rounded-lg border-border bg-background/80 shadow-none text-xs focus-visible:ring-1"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Section 2: Cấp độ */}
          <FormField
            control={form.control}
            name="experienceLevel"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                  <Layers3Icon className="size-3.5 text-slate-500" />
                  Cấp độ kinh nghiệm
                </FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger className="h-9 w-full rounded-lg border-border bg-background/80 shadow-none text-xs focus:ring-1">
                      <SelectValue placeholder="Chọn cấp độ" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {experienceLevels.map((level) => (
                      <SelectItem key={level} value={level}>
                        {formatExperienceLevel(level)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Section 3: Mô tả công việc */}
          <FormField
            control={form.control}
            name="jobDescription"
            render={({ field }) => (
              <FormItem>
                <div className="flex items-center justify-between gap-2">
                  <FormLabel className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                    <ClipboardListIcon className="size-3.5 text-slate-500" />
                    Mô tả công việc (JD)
                  </FormLabel>
                  <span className="text-[10px] text-muted-foreground italic shrink-0">
                    JD chi tiết giúp AI hỏi sát hơn.
                  </span>
                </div>
                <FormControl>
                  <Textarea
                    placeholder="Nhập mô tả công việc, trách nhiệm, kỹ năng yêu cầu và kỳ vọng của vị trí..."
                    className="min-h-[90px] rounded-lg border-border bg-background/80 shadow-none text-xs focus-visible:ring-1 leading-relaxed"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Section 4: Drag & Drop Resume Upload */}
          <div className="space-y-2">
            <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
              <FileTextIcon className="size-3.5 text-slate-500" />
              Tải CV lên (Tùy chọn)
            </label>

            {resumeFile ? (
              <div className="flex items-center gap-3 rounded-xl border border-primary/10 bg-primary/5 p-3.5 transition-all">
                <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-white text-primary shadow-xs dark:bg-background">
                  <FileCheckIcon className="size-5 text-primary" />
                </div>

                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-foreground">
                    {resumeFile.name}
                  </p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    Hệ thống sẽ dùng thông tin CV để cá nhân hóa câu hỏi
                  </p>
                </div>

                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="size-7 shrink-0 rounded-full p-0 hover:bg-slate-100"
                  onClick={() => setResumeFile(null)}
                >
                  <XIcon className="size-4 text-slate-500" />
                </Button>
              </div>
            ) : (
              <div
                className={cn(
                  "group relative overflow-hidden rounded-xl border border-dashed p-6 text-center transition-all duration-200 cursor-pointer",
                  isDragOver
                    ? "border-violet-500 bg-violet-50/50 dark:bg-violet-950/20"
                    : "border-violet-200 bg-violet-50/10 hover:border-violet-400 hover:bg-violet-50/30 dark:border-violet-900/30 dark:bg-violet-950/10"
                )}
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragOver(true);
                }}
                onDragLeave={(e) => {
                  e.preventDefault();
                  setIsDragOver(false);
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  setIsDragOver(false);
                  handleFileUpload(e.dataTransfer.files[0] ?? null);
                }}
              >
                <label
                  htmlFor="cv-upload-interview-redesign"
                  className="flex cursor-pointer flex-col items-center justify-center gap-2"
                >
                  <input
                    id="cv-upload-interview-redesign"
                    type="file"
                    accept=".pdf,.doc,.docx,.txt"
                    className="sr-only"
                    onChange={(e) => {
                      handleFileUpload(e.target.files?.[0] ?? null);
                    }}
                  />

                  <div className="rounded-xl bg-violet-100 p-2.5 text-violet-600 shadow-sm border border-violet-200 transition-all duration-200 group-hover:scale-110 group-hover:bg-violet-600 group-hover:text-white dark:bg-violet-950 dark:border-violet-900">
                    <UploadIcon className="size-5" />
                  </div>

                  <div>
                    <p className="text-xs font-bold text-slate-800 dark:text-slate-200 group-hover:text-violet-700 dark:group-hover:text-violet-300">
                      Click để tải CV lên hoặc kéo thả vào đây
                    </p>
                    <p className="text-[10px] text-slate-500 mt-0.5">
                      Hỗ trợ PDF, Word, TXT • Tối đa 10MB
                    </p>
                  </div>
                </label>
              </div>
            )}
          </div>

          {/* CTA Buttons */}
          <div className="pt-4 flex flex-col gap-2.5 sm:flex-row sm:justify-end">
            <Button
              type="button"
              variant="outline"
              disabled={isSavingDraft || isSubmitting}
              onClick={handleSaveDraftClick}
              className="h-10 rounded-xl px-4.5 text-xs font-semibold border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-border dark:bg-background dark:text-slate-300 sm:w-auto"
            >
              <LoadingSwap isLoading={isSavingDraft}>
                <span>Lưu nháp</span>
              </LoadingSwap>
            </Button>

            <Button
              type="submit"
              disabled={isSubmitting || isSavingDraft}
              className="h-10 rounded-xl px-5.5 text-xs font-bold bg-gradient-to-r from-red-800 via-rose-700 to-indigo-500 hover:from-red-700 hover:via-rose-600 hover:to-indigo-400 text-white transition-all duration-300 shadow-md shadow-indigo-500/10 border-none active:scale-[0.99] transform sm:w-auto"
            >
              <LoadingSwap isLoading={isSubmitting}>
                <span className="inline-flex items-center justify-center gap-1.5 w-full font-bold">
                  {isSubmitting && resumeFile
                    ? "Đang phân tích CV..."
                    : "Bắt đầu phỏng vấn"}
                  {!isSubmitting && <ArrowRightIcon className="size-3.5" />}
                </span>
              </LoadingSwap>
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
