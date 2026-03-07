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
  FormDescription,
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
  CheckCircle2Icon,
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
    <div className="min-w-0 space-y-6">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <FormField
            control={form.control}
            name="candidateName"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="flex items-center gap-2">
                  <UserIcon className="size-4 text-primary" />
                  Họ tên ứng viên
                </FormLabel>
                <FormControl>
                  <Input
                    placeholder="Nguyễn Văn A"
                    className="h-12 rounded-2xl border-primary/10 bg-background/80 shadow-none"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <FormField
              control={form.control}
              name="jobTitle"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    <BriefcaseIcon className="size-4 text-primary" />
                    Vị trí tuyển dụng
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Frontend Developer"
                      className="h-12 rounded-2xl border-primary/10 bg-background/80 shadow-none"
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
                  <FormLabel className="flex items-center gap-2">
                    <Layers3Icon className="size-4 text-primary" />
                    Cấp độ
                  </FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger className="h-12 w-full rounded-2xl border-primary/10 bg-background/80 shadow-none">
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
          </div>

          <FormField
            control={form.control}
            name="jobDescription"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="flex items-center gap-2">
                  <ClipboardListIcon className="size-4 text-primary" />
                  Mô tả công việc
                </FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Nhập mô tả công việc, trách nhiệm, yêu cầu kỹ năng, kinh nghiệm và kỳ vọng của nhà tuyển dụng..."
                    className="min-h-[180px] rounded-[24px] border-primary/10 bg-background/80 shadow-none"
                    {...field}
                  />
                </FormControl>
                <FormDescription>
                  Mô tả càng cụ thể thì kết quả phân tích càng sát với nhu cầu
                  tuyển dụng.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="space-y-3">
            <label className="text-sm font-medium leading-none">
              Tải CV lên{" "}
              <span className="font-normal text-muted-foreground">
                (tuỳ chọn)
              </span>
            </label>

            {resumeFile ? (
              <div className="flex items-center gap-3 rounded-[24px] border border-primary/10 bg-primary/5 p-4">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-white text-primary shadow-sm dark:bg-background">
                  <FileTextIcon className="size-5" />
                </div>

                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-foreground">
                    {resumeFile.name}
                  </p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    CV sẽ được dùng để tạo câu hỏi phù hợp hơn
                  </p>
                </div>

                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="size-8 shrink-0 rounded-full p-0"
                  onClick={() => setResumeFile(null)}
                >
                  <XIcon className="size-4" />
                </Button>
              </div>
            ) : (
              <div
                className={cn(
                  "group relative overflow-hidden rounded-[28px] border-2 border-dashed p-8 transition-all",
                  isDragOver
                    ? "border-violet-500 bg-violet-50 shadow-sm dark:bg-violet-950/20"
                    : "border-violet-200/70 bg-gradient-to-br from-violet-50/70 via-background to-fuchsia-50/60 hover:border-violet-400 dark:border-violet-900/40 dark:from-violet-950/10 dark:to-fuchsia-950/10",
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
                  className="flex cursor-pointer flex-col items-center justify-center gap-3 text-center"
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

                  <div className="mb-4 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-violet-100 dark:bg-background dark:ring-violet-900/40">
                    <UploadIcon className="size-7 text-violet-600" />
                  </div>

                  <div className="space-y-1">
                    <p className="text-sm font-semibold text-foreground">
                      Click để tải CV lên hoặc kéo thả vào đây
                    </p>
                    <p className="text-sm leading-6 text-muted-foreground">
                      Hỗ trợ PDF, Word, TXT • Tối đa 10MB
                    </p>
                  </div>
                </label>
              </div>
            )}
          </div>

          <div className="rounded-[24px] border border-border bg-muted/30 p-4">
            <div className="flex items-start gap-3">
              <CheckCircle2Icon className="mt-0.5 size-5 shrink-0 text-primary" />
              <div>
                <p className="text-sm font-medium text-foreground">
                  Mẹo để buổi phỏng vấn sát thực tế hơn
                </p>
                <p className="mt-1 text-sm leading-6 text-muted-foreground">
                  Hãy nhập job title rõ ràng, mô tả JD cụ thể và thêm CV nếu có.
                  AI sẽ dùng các thông tin này để tạo câu hỏi phù hợp hơn với
                  mục tiêu ứng tuyển của bạn.
                </p>
              </div>
            </div>
          </div>

          <Button
            type="submit"
            size="lg"
            className="h-12 w-full rounded-2xl bg-gradient-to-r from-primary via-[#c83a3a] to-secondary text-sm font-semibold text-white shadow-md hover:opacity-95"
            disabled={isSubmitting}
          >
            <LoadingSwap isLoading={isSubmitting}>
              <span className="inline-flex items-center gap-2">
                {isSubmitting && resumeFile
                  ? "Đang phân tích CV..."
                  : "Bắt đầu phỏng vấn"}
                {!isSubmitting && <ArrowRightIcon className="size-4" />}
              </span>
            </LoadingSwap>
          </Button>
        </form>
      </Form>
    </div>
  );
}
