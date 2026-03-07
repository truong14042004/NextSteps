"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { experienceLevels } from "@/drizzle/schema/jobInfo";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { LoadingSwap } from "@/components/ui/loading-swap";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { experimental_useObject as useObject } from "@ai-sdk/react";
import { aiAnalyzeSchema } from "@/services/ai/resumes/schemas";
import { AnalysisResults } from "@/app/app/AnalysisResults";
import {
  createJobInfoForAnalysis,
  getUserJobInfos,
  updateJobInfoDirect,
} from "@/features/jobInfos/actions";
import { formatExperienceLevel } from "@/features/jobInfos/lib/formatters";
import { formatDistanceToNow } from "date-fns";
import { vi } from "date-fns/locale";
import {
  UploadCloudIcon,
  ClockIcon,
  ChevronRightIcon,
  FileTextIcon,
  RefreshCwIcon,
  PencilIcon,
  CheckIcon,
  XIcon,
  SparklesIcon,
  AlertTriangleIcon,
  ZapIcon,
  CreditCardIcon,
  ShieldCheckIcon,
  BriefcaseIcon,
} from "lucide-react";

const analysisSchema = z.object({
  candidateName: z.string().min(1, "Vui lòng nhập họ tên ứng viên"),
  jobTitle: z.string().min(1, "Vui lòng nhập vị trí tuyển dụng"),
  experienceLevel: z.enum(experienceLevels),
  jobDescription: z.string().min(1, "Vui lòng nhập mô tả công việc"),
});

type AnalysisFormData = z.infer<typeof analysisSchema>;
type JobInfoHistory = Awaited<ReturnType<typeof getUserJobInfos>>;

type UsageInfo = {
  used: number;
  total: number;
  remaining: number;
  planName: string;
  resetText: string;
  billingMode: "subscription" | "pay_per_use";
};

function UsageBanner({ usage }: { usage: UsageInfo }) {
  const percent =
    usage.total > 0 ? Math.min((usage.used / usage.total) * 100, 100) : 0;
  const isLow = usage.remaining <= 2 && usage.remaining > 0;
  const isExhausted = usage.remaining <= 0;

  return (
    <div className="relative overflow-hidden rounded-[28px] border border-violet-200/60 bg-gradient-to-r from-violet-50 via-fuchsia-50 to-amber-50 p-5 shadow-sm dark:border-violet-900/40 dark:from-violet-950/40 dark:via-fuchsia-950/20 dark:to-amber-950/10">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(139,92,246,0.18),transparent_28%),radial-gradient(circle_at_bottom_left,rgba(236,72,153,0.12),transparent_26%)]" />

      <div className="relative flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-start gap-4">
          <div className="rounded-2xl bg-white/70 p-3 shadow-sm dark:bg-white/10">
            <ZapIcon className="size-5 text-violet-600" />
          </div>

          <div>
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-base font-semibold text-foreground">
                {usage.remaining}/{usage.total} lượt phân tích còn lại
              </p>
              <Badge className="rounded-full bg-violet-600 hover:bg-violet-600">
                {usage.planName}
              </Badge>
            </div>

            <p className="mt-1 text-sm text-muted-foreground">
              {isExhausted
                ? "Bạn đã dùng hết lượt hiện tại."
                : isLow
                  ? "Bạn sắp hết lượt. Nên mua thêm để không bị gián đoạn."
                  : `Đã dùng ${usage.used}/${usage.total} lượt • ${usage.resetText}`}
            </p>

            <div className="mt-3 h-2.5 w-full max-w-md overflow-hidden rounded-full bg-white/60 dark:bg-white/10">
              <div
                className={cn(
                  "h-full rounded-full transition-all",
                  isExhausted
                    ? "bg-rose-500"
                    : isLow
                      ? "bg-amber-500"
                      : "bg-gradient-to-r from-violet-600 via-fuchsia-500 to-amber-400",
                )}
                style={{ width: `${percent}%` }}
              />
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button
            asChild
            className="rounded-xl bg-violet-600 hover:bg-violet-700"
          >
            <Link href="/#pricing">Mua thêm lượt</Link>
          </Button>
          <Button
            asChild
            variant="outline"
            className="rounded-xl border-violet-200 bg-white/70 dark:bg-background/40"
          >
            <Link href="/#pricing">
              <CreditCardIcon className="mr-2 size-4" />
              Xem bảng giá
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}

function UploadCard({
  resumeFile,
  isDragOver,
  setIsDragOver,
  handleFileUpload,
}: {
  resumeFile: File | null;
  isDragOver: boolean;
  setIsDragOver: (value: boolean) => void;
  handleFileUpload: (file: File | null) => void;
}) {
  return (
    <div className="space-y-3">
      <label className="text-sm font-medium">Tải lên CV</label>

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
          htmlFor="resume-upload"
          className="flex cursor-pointer flex-col items-center justify-center text-center"
        >
          <input
            id="resume-upload"
            type="file"
            accept=".pdf,.doc,.docx,.txt"
            className="sr-only"
            onChange={(e) => {
              handleFileUpload(e.target.files?.[0] ?? null);
            }}
          />

          <div className="mb-4 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-violet-100 dark:bg-background dark:ring-violet-900/40">
            <UploadCloudIcon className="size-7 text-violet-600" />
          </div>

          <div className="space-y-2">
            <p className="text-sm font-semibold text-foreground">
              {resumeFile ? resumeFile.name : "Nhấn để tải CV lên"}
            </p>
            <p className="text-sm text-muted-foreground">
              hoặc kéo thả tệp vào khu vực này
            </p>
            <p className="text-xs text-muted-foreground">
              Hỗ trợ PDF, Word, TXT • Tối đa 10MB
            </p>
          </div>
        </label>
      </div>
    </div>
  );
}

export default function CVJDAnalysisPage() {
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [history, setHistory] = useState<JobInfoHistory | null>(null);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<{
    title: string;
    experienceLevel: string;
    description: string;
  } | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const jobInfoIdRef = useRef<string | null>(null);
  const searchParams = useSearchParams();
  const defaultTab = searchParams.get("tab") === "history" ? "history" : "new";

  // Mock data - khi nào có db thì gọi API để lấy thông tin này
  const usage: UsageInfo = {
    used: 7,
    total: 10,
    remaining: 3,
    planName: "Gói lượt",
    resetText: "Không tự làm mới",
    billingMode: "pay_per_use",
  };

  const hasRemainingUsage = usage.remaining > 0;

  const form = useForm<AnalysisFormData>({
    resolver: zodResolver(analysisSchema),
    defaultValues: {
      candidateName: "",
      jobTitle: "",
      experienceLevel: "intern",
      jobDescription: "",
    },
  });

  const {
    object: aiAnalysis,
    isLoading,
    submit: generateAnalysis,
  } = useObject({
    api: "/api/ai/resumes/analyze",
    schema: aiAnalyzeSchema,
    fetch: (url, options) => {
      const headers = new Headers(options?.headers);
      headers.delete("Content-Type");

      const formData = new FormData();

      if (resumeFile) {
        formData.append("resumeFile", resumeFile);
      }

      const values = form.getValues();
      formData.append("jobTitle", values.jobTitle);
      formData.append("experienceLevel", values.experienceLevel);
      formData.append("description", values.jobDescription);

      if (jobInfoIdRef.current) {
        formData.append("jobInfoId", jobInfoIdRef.current);
      }

      return fetch(url, { ...options, headers, body: formData });
    },
  });

  function handleFileUpload(file: File | null) {
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      toast.error("Kích thước tệp vượt quá giới hạn 10MB");
      return;
    }

    const allowedTypes = [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "text/plain",
    ];

    if (!allowedTypes.includes(file.type)) {
      toast.error("Vui lòng tải lên tệp PDF, Word hoặc tệp văn bản");
      return;
    }

    setResumeFile(file);
    toast.success(`Đã chọn CV "${file.name}"`);
  }

  async function onSubmit(values: AnalysisFormData) {
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
    setHistory(null);
    generateAnalysis(null);
  }

  useEffect(() => {
    if (defaultTab === "history") loadHistory();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function loadHistory() {
    if (history != null) return;
    setHistoryLoading(true);
    try {
      const items = await getUserJobInfos(20);
      setHistory(items);
    } catch {
      toast.error("Không thể tải lịch sử phân tích");
    } finally {
      setHistoryLoading(false);
    }
  }

  return (
    <div className="h-full bg-[radial-gradient(circle_at_top,rgba(179,0,0,0.10),transparent_28%),radial-gradient(circle_at_top_right,rgba(124,58,237,0.06),transparent_24%),linear-gradient(to_bottom,var(--background),var(--background))]">
      <main className="container py-8 md:py-10">
        <section className="mb-8">
          <div className="rounded-[32px] border border-primary/10 bg-white/85 p-6 shadow-sm backdrop-blur dark:bg-card/80 md:p-8">
            <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
              <div className="max-w-3xl">
                <div className="inline-flex items-center gap-2 rounded-full border border-primary/15 bg-primary/5 px-3 py-1 text-xs font-medium text-primary">
                  <SparklesIcon className="size-3.5" />
                  AI phân tích CV theo Job Description
                </div>

                <h1 className="mt-4 text-3xl font-bold tracking-tight text-foreground md:text-5xl">
                  Phân tích CV / JD
                </h1>

                <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground md:text-base">
                  Tải CV, nhập mô tả công việc và nhận đánh giá mức độ phù hợp,
                  kỹ năng còn thiếu và gợi ý tối ưu hồ sơ trước khi ứng tuyển.
                </p>
              </div>

              <div className="flex flex-wrap gap-3">
                <div className="rounded-2xl border border-primary/10 bg-primary/5 px-4 py-3">
                  <div className="flex items-center gap-2 text-sm font-medium text-primary">
                    <ShieldCheckIcon className="size-4" />
                    Phân tích bằng AI
                  </div>
                </div>
                <div className="rounded-2xl border border-secondary/20 bg-secondary px-4 py-3">
                  <div className="flex items-center gap-2 text-sm font-medium text-secondary-foreground">
                    <BriefcaseIcon className="size-4" />
                    Phù hợp cho sinh viên & fresher
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6">
              <div className="relative overflow-hidden rounded-[28px] border border-primary/10 bg-gradient-to-r from-primary/5 via-white to-secondary/10 p-5 shadow-sm dark:from-primary/10 dark:via-card dark:to-secondary/10">
                <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(179,0,0,0.10),transparent_30%),radial-gradient(circle_at_bottom_left,rgba(109,40,217,0.08),transparent_28%)]" />

                <div className="relative flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  <div className="flex items-start gap-4">
                    <div className="rounded-2xl bg-white/90 p-3 shadow-sm ring-1 ring-primary/10 dark:bg-background/80">
                      <ZapIcon className="size-5 text-primary" />
                    </div>

                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-base font-semibold text-foreground">
                          {usage.remaining}/{usage.total} lượt phân tích còn lại
                        </p>
                        <Badge className="rounded-full bg-primary text-primary-foreground hover:bg-primary">
                          {usage.planName}
                        </Badge>
                      </div>

                      <p className="mt-1 text-sm text-muted-foreground">
                        {!hasRemainingUsage
                          ? "Bạn đã dùng hết lượt hiện tại."
                          : usage.remaining <= 2
                            ? "Bạn sắp hết lượt. Nên mua thêm để không bị gián đoạn."
                            : `Đã dùng ${usage.used}/${usage.total} lượt • ${usage.resetText}`}
                      </p>

                      <div className="mt-3 h-2.5 w-full max-w-md overflow-hidden rounded-full bg-primary/10">
                        <div
                          className={cn(
                            "h-full rounded-full transition-all",
                            !hasRemainingUsage
                              ? "bg-destructive"
                              : usage.remaining <= 2
                                ? "bg-warning"
                                : "bg-gradient-to-r from-primary via-[#c83a3a] to-secondary",
                          )}
                          style={{
                            width: `${
                              usage.total > 0
                                ? Math.min(
                                    (usage.used / usage.total) * 100,
                                    100,
                                  )
                                : 0
                            }%`,
                          }}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <Button asChild className="btn-cta rounded-xl">
                      <Link href="/#pricing">Mua thêm lượt</Link>
                    </Button>
                    <Button
                      asChild
                      variant="outline"
                      className="rounded-xl border-primary/15 bg-white/80 hover:bg-primary/5 dark:bg-background/40"
                    >
                      <Link href="/#pricing">
                        <CreditCardIcon className="mr-2 size-4" />
                        Xem bảng giá
                      </Link>
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <Tabs
          defaultValue={defaultTab}
          onValueChange={(v) => {
            if (v === "history") loadHistory();
          }}
          className="space-y-6"
        >
          <div className="flex justify-center">
            <TabsList className="grid w-full max-w-md grid-cols-2 rounded-2xl border border-border bg-white/85 p-1 shadow-sm dark:bg-card/70">
              <TabsTrigger
                value="new"
                className="rounded-xl data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              >
                Tạo phân tích mới
              </TabsTrigger>
              <TabsTrigger
                value="history"
                className="rounded-xl data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              >
                Lịch sử phân tích
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="new" className="space-y-8">
            <div className="grid gap-8 xl:grid-cols-[1.15fr_0.85fr]">
              <div className="rounded-[32px] border border-primary/10 bg-white/90 p-6 shadow-sm dark:bg-card/80 md:p-7">
                <div className="mb-6 flex items-start gap-3">
                  <div className="rounded-2xl bg-gradient-to-br from-primary to-[#d14b4b] p-2.5 text-white shadow-sm">
                    <FileTextIcon className="size-5" />
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold">Tạo phân tích mới</h2>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Điền thông tin JD và tải CV để AI bắt đầu phân tích.
                    </p>
                  </div>
                </div>

                {!hasRemainingUsage && (
                  <div className="mb-6 rounded-2xl border border-destructive/20 bg-destructive/5 p-4 text-sm text-destructive">
                    <div className="flex items-start gap-3">
                      <AlertTriangleIcon className="mt-0.5 size-4 shrink-0" />
                      <div>
                        <p className="font-medium">Bạn đã hết lượt phân tích</p>
                        <p className="mt-1 opacity-90">
                          Vui lòng mua thêm lượt hoặc nâng cấp gói để tiếp tục
                          sử dụng.
                        </p>
                        <div className="mt-3 flex flex-wrap gap-2">
                          <Button
                            asChild
                            size="sm"
                            className="btn-cta rounded-xl"
                          >
                            <Link href="/#pricing">Mua thêm lượt</Link>
                          </Button>
                          <Button
                            asChild
                            size="sm"
                            variant="outline"
                            className="rounded-xl border-primary/15"
                          >
                            <Link href="/#pricing">Nâng cấp gói</Link>
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                <Form {...form}>
                  <form
                    onSubmit={form.handleSubmit(onSubmit)}
                    className="space-y-6"
                  >
                    <FormField
                      control={form.control}
                      name="candidateName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Họ tên ứng viên</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Nguyễn Văn A"
                              className="h-12 rounded-2xl border-violet-200/70 bg-white/90 dark:border-violet-900/30"
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
                            <FormLabel>Vị trí tuyển dụng</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="Frontend Developer"
                                className="h-12 rounded-2xl border-violet-200/70 bg-white/90 dark:border-violet-900/30"
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
                            <FormLabel>Cấp độ</FormLabel>
                            <Select
                              onValueChange={field.onChange}
                              value={field.value}
                            >
                              <FormControl>
                                <SelectTrigger className="h-12 w-full rounded-2xl border-violet-200/70 bg-white/90 dark:border-violet-900/30">
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
                          <FormLabel>Mô tả công việc</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Nhập mô tả công việc, trách nhiệm, yêu cầu kỹ năng, kinh nghiệm và kỳ vọng của nhà tuyển dụng..."
                              className="min-h-[180px] rounded-[24px] border-violet-200/70 bg-white/90 dark:border-violet-900/30"
                              {...field}
                            />
                          </FormControl>
                          <FormDescription>
                            Mô tả càng cụ thể thì kết quả phân tích càng sát với
                            nhu cầu tuyển dụng.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <UploadCard
                      resumeFile={resumeFile}
                      isDragOver={isDragOver}
                      setIsDragOver={setIsDragOver}
                      handleFileUpload={handleFileUpload}
                    />

                    <Button
                      type="submit"
                      disabled={isLoading || !hasRemainingUsage}
                      size="lg"
                      className="h-12 w-full rounded-2xl bg-gradient-to-r from-primary via-[#c83a3a] to-secondary text-sm font-semibold text-white shadow-md hover:opacity-95"
                    >
                      <LoadingSwap isLoading={isLoading}>
                        {hasRemainingUsage
                          ? "Phân tích CV với AI"
                          : "Đã hết lượt phân tích"}
                      </LoadingSwap>
                    </Button>
                  </form>
                </Form>
              </div>

              <div className="space-y-6">
                <div className="rounded-[32px] border border-fuchsia-200/60 bg-gradient-to-br from-violet-50 via-white to-fuchsia-50 p-6 shadow-sm dark:border-fuchsia-900/30 dark:from-violet-950/10 dark:via-background dark:to-fuchsia-950/10">
                  <div className="flex items-start gap-3">
                    <div className="rounded-2xl bg-gradient-to-br from-fuchsia-500 to-amber-400 p-2.5 text-white shadow-sm">
                      <SparklesIcon className="size-5" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold">
                        Sau khi phân tích bạn nhận được gì?
                      </h3>
                      <p className="mt-1 text-sm text-muted-foreground">
                        Kết quả rõ ràng, gọn và hữu ích để tối ưu CV trước khi
                        ứng tuyển.
                      </p>
                    </div>
                  </div>

                  <div className="mt-5 space-y-3">
                    <div className="rounded-2xl border bg-white/80 p-4 dark:bg-background/50">
                      <p className="font-medium">Đánh giá độ phù hợp với JD</p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        Biết CV hiện tại của bạn khớp tới đâu với vị trí đang
                        nhắm tới.
                      </p>
                    </div>

                    <div className="rounded-2xl border bg-white/80 p-4 dark:bg-background/50">
                      <p className="font-medium">
                        Kỹ năng và điểm thiếu cần bổ sung
                      </p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        Nhận ra các keyword, kỹ năng và kinh nghiệm còn thiếu.
                      </p>
                    </div>

                    <div className="rounded-2xl border bg-white/80 p-4 dark:bg-background/50">
                      <p className="font-medium">Gợi ý cải thiện CV cụ thể</p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        Có hướng chỉnh sửa rõ ràng thay vì feedback chung chung.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="rounded-[32px] border border-amber-200/60 bg-gradient-to-r from-amber-50 via-rose-50 to-violet-50 p-6 shadow-sm dark:border-amber-900/30 dark:from-amber-950/10 dark:via-rose-950/10 dark:to-violet-950/10">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <h3 className="text-lg font-semibold">
                        Cần thêm lượt phân tích?
                      </h3>
                      <p className="mt-1 text-sm text-muted-foreground">
                        Mua lẻ theo nhu cầu hoặc nâng cấp gói tháng để dùng
                        nhiều hơn.
                      </p>
                    </div>
                    <Badge className="rounded-full bg-gradient-to-r from-fuchsia-500 to-amber-400 text-white hover:from-fuchsia-500 hover:to-amber-400">
                      15.000đ/lượt
                    </Badge>
                  </div>

                  <div className="mt-4 grid gap-2 sm:grid-cols-2">
                    <Button
                      asChild
                      className="rounded-2xl bg-violet-600 hover:bg-violet-700"
                    >
                      <Link href="/#pricing">Mua thêm lượt</Link>
                    </Button>
                    <Button
                      asChild
                      variant="outline"
                      className="rounded-2xl bg-white/70 dark:bg-background/40"
                    >
                      <Link href="/#pricing">Xem bảng giá</Link>
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            {(aiAnalysis || isLoading) && (
              <div className="rounded-[32px] border border-violet-200/50 bg-white/85 p-4 shadow-sm dark:border-violet-900/30 dark:bg-background/70 md:p-5">
                <AnalysisResults
                  aiAnalysis={aiAnalysis}
                  isLoading={isLoading}
                />
              </div>
            )}
          </TabsContent>

          <TabsContent value="history">
            <div className="rounded-[32px] border border-violet-200/50 bg-white/85 p-6 shadow-sm dark:border-violet-900/30 dark:bg-background/70">
              <div className="mb-6 flex items-center justify-between gap-3">
                <div>
                  <h2 className="text-xl font-semibold">Lịch sử phân tích</h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Xem lại các lần phân tích CV/JD trước đây của bạn.
                  </p>
                </div>

                <Badge className="rounded-full bg-violet-100 text-violet-700 hover:bg-violet-100 dark:bg-violet-950/30 dark:text-violet-300">
                  Đã dùng {usage.used} lượt
                </Badge>
              </div>

              {historyLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div
                      key={i}
                      className="h-24 rounded-2xl bg-muted/10 animate-pulse"
                    />
                  ))}
                </div>
              ) : history == null || history.length === 0 ? (
                <div className="flex flex-col items-center justify-center gap-3 py-20 text-center text-muted-foreground">
                  <div className="rounded-full bg-muted/10 p-4">
                    <ClockIcon className="size-8 opacity-50" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground">
                      Chưa có lịch sử phân tích
                    </p>
                    <p className="mt-1 text-sm">
                      Hãy tạo phân tích đầu tiên tại tab “Tạo phân tích mới”.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {history.map((item) => {
                    const parsed = item.analysisResult
                      ? (() => {
                          try {
                            return JSON.parse(item.analysisResult!);
                          } catch {
                            return null;
                          }
                        })()
                      : null;

                    const isExpanded = expandedId === item.id;

                    return (
                      <div
                        key={item.id}
                        className="overflow-hidden rounded-2xl border bg-background/90 shadow-sm"
                      >
                        <button
                          type="button"
                          onClick={() =>
                            setExpandedId(isExpanded ? null : item.id)
                          }
                          className="group flex w-full items-center gap-4 p-5 text-left transition-colors hover:bg-violet-50/60 dark:hover:bg-violet-950/10"
                        >
                          <div className="rounded-xl bg-violet-100 p-3 dark:bg-violet-950/30">
                            <FileTextIcon className="size-5 text-violet-600 dark:text-violet-300" />
                          </div>

                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <p className="truncate font-medium">
                                {item.name}
                              </p>

                              {item.title && (
                                <Badge
                                  variant="secondary"
                                  className="rounded-md"
                                >
                                  {item.title}
                                </Badge>
                              )}

                              <Badge variant="outline" className="rounded-md">
                                {formatExperienceLevel(item.experienceLevel)}
                              </Badge>

                              {parsed ? (
                                <Badge className="rounded-md bg-emerald-600">
                                  Có kết quả
                                </Badge>
                              ) : (
                                <Badge
                                  variant="outline"
                                  className="rounded-md text-muted-foreground"
                                >
                                  Chưa có kết quả
                                </Badge>
                              )}
                            </div>

                            <p className="mt-1 text-xs text-muted-foreground">
                              {formatDistanceToNow(new Date(item.createdAt), {
                                addSuffix: true,
                                locale: vi,
                              })}
                            </p>
                          </div>

                          <ChevronRightIcon
                            className={cn(
                              "size-4 flex-shrink-0 text-muted-foreground transition-transform",
                              isExpanded && "rotate-90",
                            )}
                          />
                        </button>

                        {isExpanded && (
                          <div className="border-t">
                            {editingId === item.id && editValues ? (
                              <div className="space-y-4 p-5">
                                <div className="space-y-2">
                                  <label className="text-sm font-medium">
                                    Vị trí
                                  </label>
                                  <Input
                                    placeholder="Vị trí ứng tuyển"
                                    value={editValues.title}
                                    onChange={(e) =>
                                      setEditValues((v) =>
                                        v
                                          ? { ...v, title: e.target.value }
                                          : null,
                                      )
                                    }
                                    className="rounded-xl"
                                  />
                                </div>

                                <div className="space-y-2">
                                  <label className="text-sm font-medium">
                                    Cấp độ
                                  </label>
                                  <select
                                    className="h-11 w-full rounded-xl border bg-background px-3 text-sm"
                                    value={editValues.experienceLevel}
                                    onChange={(e) =>
                                      setEditValues((v) =>
                                        v
                                          ? {
                                              ...v,
                                              experienceLevel: e.target.value,
                                            }
                                          : null,
                                      )
                                    }
                                  >
                                    {experienceLevels.map((l) => (
                                      <option key={l} value={l}>
                                        {formatExperienceLevel(l)}
                                      </option>
                                    ))}
                                  </select>
                                </div>

                                <div className="space-y-2">
                                  <label className="text-sm font-medium">
                                    Mô tả công việc
                                  </label>
                                  <textarea
                                    className="min-h-[160px] w-full resize-y rounded-xl border bg-background px-3 py-2 text-sm"
                                    placeholder="Nhập mô tả công việc..."
                                    value={editValues.description}
                                    onChange={(e) =>
                                      setEditValues((v) =>
                                        v
                                          ? {
                                              ...v,
                                              description: e.target.value,
                                            }
                                          : null,
                                      )
                                    }
                                  />
                                </div>

                                <div className="flex justify-end gap-2">
                                  <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    className="rounded-lg"
                                    onClick={() => {
                                      setEditingId(null);
                                      setEditValues(null);
                                    }}
                                  >
                                    <XIcon className="mr-1 size-3" />
                                    Hủy
                                  </Button>

                                  <Button
                                    type="button"
                                    size="sm"
                                    className="rounded-lg"
                                    disabled={isSaving}
                                    onClick={async () => {
                                      if (!editValues) return;
                                      setIsSaving(true);
                                      const result = await updateJobInfoDirect(
                                        item.id,
                                        editValues,
                                      );
                                      setIsSaving(false);

                                      if (result.error) {
                                        toast.error(result.message);
                                      } else {
                                        toast.success("Đã cập nhật JD");
                                        setHistory(
                                          (prev) =>
                                            prev?.map((h) =>
                                              h.id === item.id
                                                ? {
                                                    ...h,
                                                    title: editValues.title,
                                                    experienceLevel:
                                                      editValues.experienceLevel as any,
                                                    description:
                                                      editValues.description,
                                                  }
                                                : h,
                                            ) ?? null,
                                        );
                                        setEditingId(null);
                                        setEditValues(null);
                                      }
                                    }}
                                  >
                                    {isSaving ? (
                                      <RefreshCwIcon className="mr-1 size-3 animate-spin" />
                                    ) : (
                                      <CheckIcon className="mr-1 size-3" />
                                    )}
                                    Lưu
                                  </Button>
                                </div>
                              </div>
                            ) : (
                              <Tabs
                                defaultValue={parsed ? "result" : "jd"}
                                className="w-full"
                              >
                                <div className="flex flex-col gap-3 px-5 pt-4 md:flex-row md:items-center md:justify-between">
                                  <TabsList className="w-fit rounded-xl bg-secondary/20">
                                    <TabsTrigger value="jd">
                                      Mô tả JD
                                    </TabsTrigger>
                                    {parsed && (
                                      <TabsTrigger value="result">
                                        Kết quả phân tích
                                      </TabsTrigger>
                                    )}
                                  </TabsList>

                                  <div className="flex items-center gap-4">
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setEditingId(item.id);
                                        setEditValues({
                                          title: item.title ?? "",
                                          experienceLevel: item.experienceLevel,
                                          description: item.description,
                                        });
                                      }}
                                      className="flex items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-foreground"
                                    >
                                      <PencilIcon className="size-3" />
                                      Sửa JD
                                    </button>

                                    <Link
                                      href={`/app/job-infos/${item.id}/resume`}
                                      onClick={(e) => e.stopPropagation()}
                                      className="flex items-center gap-1 text-xs text-violet-600 hover:underline"
                                    >
                                      <RefreshCwIcon className="size-3" />
                                      Phân tích lại
                                    </Link>
                                  </div>
                                </div>

                                <TabsContent
                                  value="jd"
                                  className="px-5 pb-5 pt-4"
                                >
                                  <div className="space-y-4 text-sm">
                                    <div>
                                      <p className="mb-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                                        Ứng viên
                                      </p>
                                      <p>{item.name}</p>
                                    </div>

                                    {item.title && (
                                      <div>
                                        <p className="mb-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                                          Vị trí
                                        </p>
                                        <p>{item.title}</p>
                                      </div>
                                    )}

                                    <div>
                                      <p className="mb-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                                        Cấp độ
                                      </p>
                                      <p>
                                        {formatExperienceLevel(
                                          item.experienceLevel,
                                        )}
                                      </p>
                                    </div>

                                    <div>
                                      <p className="mb-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                                        Mô tả công việc
                                      </p>
                                      <p className="whitespace-pre-wrap leading-7 text-muted-foreground">
                                        {item.description}
                                      </p>
                                    </div>
                                  </div>
                                </TabsContent>

                                {parsed && (
                                  <TabsContent
                                    value="result"
                                    className="px-5 pb-5 pt-2"
                                  >
                                    <AnalysisResults
                                      aiAnalysis={parsed}
                                      isLoading={false}
                                    />
                                  </TabsContent>
                                )}
                              </Tabs>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
