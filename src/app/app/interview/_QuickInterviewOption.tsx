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
  UserIcon,
  BriefcaseIcon,
  Layers3Icon,
  ClipboardListIcon,
  ArrowRightIcon,
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
}: {
  onSelect: (jobInfo: InterviewJobInfo) => void;
}) {
  const [isSubmitting, setIsSubmitting] = useState(false);
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
      toast.error("File size exceeds 10MB limit");
      return;
    }

    const allowedTypes = [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "text/plain",
    ];

    if (!allowedTypes.includes(file.type)) {
      toast.error("Please upload a PDF, Word document, or text file");
      return;
    }

    setResumeFile(file);
  }

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
    <div className="min-w-0">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <FormField
              control={form.control}
              name="candidateName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
                    <UserIcon className="size-3.5 text-primary" />
                    Họ tên ứng viên
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Nguyễn Văn A"
                      className="h-10 rounded-xl border-slate-200 dark:border-border/60 bg-background shadow-none text-sm focus-visible:ring-1"
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
                  <FormLabel className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
                    <BriefcaseIcon className="size-3.5 text-primary" />
                    Vị trí tuyển dụng
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Frontend Developer"
                      className="h-10 rounded-xl border-slate-200 dark:border-border/60 bg-background shadow-none text-sm focus-visible:ring-1"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="experienceLevel"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
                    <Layers3Icon className="size-3.5 text-primary" />
                    Cấp độ
                  </FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger className="h-10 rounded-xl border-slate-200 dark:border-border/60 bg-background shadow-none text-sm focus-visible:ring-1">
                        <SelectValue placeholder="Chọn cấp độ" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent className="rounded-xl">
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
          </div>

          <FormField
            control={form.control}
            name="jobDescription"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
                  <ClipboardListIcon className="size-3.5 text-primary" />
                  Mô tả công việc (JD)
                </FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Nhập mô tả công việc, yêu cầu tuyển dụng..."
                    className="min-h-[110px] max-h-[220px] rounded-xl border-slate-200 dark:border-border/60 bg-background shadow-none text-sm leading-relaxed focus-visible:ring-1"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
            {/* Upload Zone */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground block">
                Tải CV lên{" "}
                <span className="font-normal text-muted-foreground">
                  (tuỳ chọn)
                </span>
              </label>

              {resumeFile ? (
                <div className="flex items-center gap-3 rounded-xl border border-primary/10 bg-primary/5 p-2.5 h-[58px]">
                  <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-white text-primary shadow-xs dark:bg-background">
                    <FileTextIcon className="size-4" />
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-semibold text-foreground">
                      {resumeFile.name}
                    </p>
                    <p className="mt-0.5 text-[10px] text-muted-foreground truncate">
                      Đã chọn CV để cá nhân hoá câu hỏi
                    </p>
                  </div>

                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="size-7 shrink-0 rounded-full p-0 hover:bg-slate-200 dark:hover:bg-slate-800"
                    onClick={() => setResumeFile(null)}
                  >
                    <XIcon className="size-3.5" />
                  </Button>
                </div>
              ) : (
                <div
                  className={cn(
                    "group relative overflow-hidden rounded-xl border border-dashed p-3 transition-all h-[58px] flex items-center justify-center cursor-pointer",
                    isDragOver
                      ? "border-violet-500 bg-violet-50 dark:bg-violet-950/20"
                      : "border-slate-200 hover:border-violet-400 dark:border-border/60 bg-slate-50/30 dark:bg-background/40",
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
                    htmlFor="cv-upload-interview"
                    className="flex cursor-pointer items-center gap-2 text-center w-full justify-center"
                  >
                    <input
                      id="cv-upload-interview"
                      type="file"
                      accept=".pdf,.doc,.docx,.txt"
                      className="sr-only"
                      onChange={(e) => {
                        handleFileUpload(e.target.files?.[0] ?? null);
                      }}
                    />

                    <UploadIcon className="size-4 text-violet-500 group-hover:scale-110 transition-transform" />
                    <span className="text-xs font-medium text-muted-foreground group-hover:text-foreground transition-colors">
                      Chọn file hoặc kéo thả CV vào đây (PDF, Word, TXT)
                    </span>
                  </label>
                </div>
              )}
            </div>

            {/* Action Button */}
            <div className="self-end pt-1">
              <Button
                type="submit"
                size="lg"
                className="h-10 w-full rounded-xl bg-gradient-to-r from-primary via-[#c83a3a] to-secondary text-xs font-bold text-white shadow-xs hover:opacity-95 cursor-pointer"
                disabled={isSubmitting}
              >
                <LoadingSwap isLoading={isSubmitting}>
                  <span className="inline-flex items-center gap-1.5">
                    {isSubmitting && resumeFile
                      ? "Đang phân tích CV..."
                      : "Bắt đầu phỏng vấn ngay"}
                    {!isSubmitting && <ArrowRightIcon className="size-3.5" />}
                  </span>
                </LoadingSwap>
              </Button>
            </div>
          </div>
        </form>
      </Form>
    </div>
  );
}
