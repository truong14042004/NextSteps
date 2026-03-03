"use client"

import { useState } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { experienceLevels } from "@/drizzle/schema/jobInfo"
import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { formatExperienceLevel } from "@/features/jobInfos/lib/formatters"
import { LoadingSwap } from "@/components/ui/loading-swap"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { InterviewJobInfo } from "./page"
import { createQuickInterview } from "@/features/jobInfos/actions"
import { toast } from "sonner"
import { UploadIcon, XIcon, FileTextIcon } from "lucide-react"
import { cn } from "@/lib/utils"

const quickInterviewSchema = z.object({
  candidateName: z.string().min(1, "Required"),
  jobTitle: z.string().min(1, "Required"),
  experienceLevel: z.enum(experienceLevels),
  jobDescription: z.string().min(1, "Required"),
})

type QuickInterviewData = z.infer<typeof quickInterviewSchema>

export function QuickInterviewOption({
  onSelect,
}: {
  onSelect: (jobInfo: InterviewJobInfo) => void
}) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [resumeFile, setResumeFile] = useState<File | null>(null)
  const [isDragOver, setIsDragOver] = useState(false)

  const form = useForm<QuickInterviewData>({
    resolver: zodResolver(quickInterviewSchema),
    defaultValues: {
      candidateName: "",
      jobTitle: "",
      experienceLevel: undefined as any,
      jobDescription: "",
    },
  })

  function handleFileUpload(file: File | null) {
    if (file == null) return
    if (file.size > 10 * 1024 * 1024) {
      toast.error("File size exceeds 10MB limit")
      return
    }
    const allowedTypes = [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "text/plain",
    ]
    if (!allowedTypes.includes(file.type)) {
      toast.error("Please upload a PDF, Word document, or text file")
      return
    }
    setResumeFile(file)
  }

  const onSubmit = async (data: QuickInterviewData) => {
    setIsSubmitting(true)
    try {
      let cvSummary: string | undefined
      if (resumeFile) {
        const formData = new FormData()
        formData.append("resumeFile", resumeFile)
        const res = await fetch("/api/ai/resumes/extract", {
          method: "POST",
          body: formData,
        })
        if (res.ok) {
          const json = await res.json()
          cvSummary = json.summary
        }
      }

      const result = await createQuickInterview({
        candidateName: data.candidateName,
        jobTitle: data.jobTitle,
        experienceLevel: data.experienceLevel,
        jobDescription: data.jobDescription,
      })

      if (result.error) {
        toast.error(result.message)
        return
      }

      onSelect({ ...result.jobInfo, cvSummary })
    } catch (error) {
      toast.error("Tạo phỏng vấn thất bại")
      console.error(error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Tạo phỏng vấn mới</CardTitle>
        <CardDescription>
          Nhập thông tin cơ bản để bắt đầu phỏng vấn AI ngay lập tức
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="candidateName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tên ứng viên</FormLabel>
                  <FormControl>
                    <Input placeholder="Nguyễn Văn A" {...field} />
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
                  <FormLabel>Vị trí ứng tuyển</FormLabel>
                  <FormControl>
                    <Input placeholder="Frontend Developer" {...field} />
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
                  <Select onValueChange={field.onChange} value={field.value || ""}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Chọn cấp độ kinh nghiệm" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {experienceLevels.map(level => (
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

            <FormField
              control={form.control}
              name="jobDescription"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Mô tả công việc</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Yêu cầu, trách nhiệm, kỹ năng cần có..."
                      className="min-h-[120px]"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Mô tả ngắn gọn về vị trí và yêu cầu công việc
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* CV Upload - optional */}
            <div className="space-y-2">
              <label className="text-sm font-medium leading-none">
                Tải CV{" "}
                <span className="text-muted-foreground font-normal">(tuỳ chọn)</span>
              </label>
              {resumeFile ? (
                <div className="flex items-center gap-3 p-3 rounded-lg border bg-muted/30">
                  <FileTextIcon className="size-5 text-primary flex-shrink-0" />
                  <span className="text-sm flex-1 truncate">{resumeFile.name}</span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="size-7 p-0 flex-shrink-0"
                    onClick={() => setResumeFile(null)}
                  >
                    <XIcon className="size-4" />
                  </Button>
                </div>
              ) : (
                <div
                  className={cn(
                    "border-2 border-dashed rounded-lg p-4 transition-colors",
                    isDragOver
                      ? "border-primary bg-primary/5"
                      : "border-muted-foreground/30 bg-muted/10 hover:border-primary/50"
                  )}
                  onDragOver={e => { e.preventDefault(); setIsDragOver(true) }}
                  onDragLeave={e => { e.preventDefault(); setIsDragOver(false) }}
                  onDrop={e => {
                    e.preventDefault()
                    setIsDragOver(false)
                    handleFileUpload(e.dataTransfer.files[0] ?? null)
                  }}
                >
                  <label htmlFor="cv-upload-interview" className="cursor-pointer flex items-center gap-3 text-muted-foreground">
                    <input
                      id="cv-upload-interview"
                      type="file"
                      accept=".pdf,.doc,.docx,.txt"
                      className="sr-only"
                      onChange={e => handleFileUpload(e.target.files?.[0] ?? null)}
                    />
                    <UploadIcon className="size-5 flex-shrink-0" />
                    <div>
                      <p className="text-sm">Click để upload hoặc kéo thả CV vào đây</p>
                      <p className="text-xs mt-0.5">PDF, Word, TXT (tối đa 10MB) — AI sẽ dùng CV để đặt câu hỏi phù hợp hơn</p>
                    </div>
                  </label>
                </div>
              )}
            </div>

            <Button type="submit" size="lg" className="w-full" disabled={isSubmitting}>
              <LoadingSwap isLoading={isSubmitting}>
                {isSubmitting && resumeFile ? "Đang phân tích CV..." : "Bắt đầu phỏng vấn"}
              </LoadingSwap>
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  )
}