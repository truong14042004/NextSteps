"use client"

import { useState, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { experienceLevels } from "@/drizzle/schema/jobInfo"
import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
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
import { toast } from "sonner"
import { UploadIcon, ClockIcon, ChevronRightIcon, FileTextIcon, RefreshCwIcon, PencilIcon, CheckIcon, XIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { experimental_useObject as useObject } from "@ai-sdk/react"
import { aiAnalyzeSchema } from "@/services/ai/resumes/schemas"
import { AnalysisResults } from "@/app/app/AnalysisResults"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { createJobInfoForAnalysis, getUserJobInfos, updateJobInfoDirect } from "@/features/jobInfos/actions"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { formatDistanceToNow } from "date-fns"
import { vi } from "date-fns/locale"
import { useRef } from "react"

const analysisSchema = z.object({
  candidateName: z.string().min(1, "Required"),
  jobTitle: z.string().min(1, "Required"),
  experienceLevel: z.enum(experienceLevels),
  jobDescription: z.string().min(1, "Required"),
})

type AnalysisFormData = z.infer<typeof analysisSchema>

type JobInfoHistory = Awaited<ReturnType<typeof getUserJobInfos>>

export default function CVJDAnalysisPage() {
  const [resumeFile, setResumeFile] = useState<File | null>(null)
  const [isDragOver, setIsDragOver] = useState(false)
  const [history, setHistory] = useState<JobInfoHistory | null>(null)
  const [historyLoading, setHistoryLoading] = useState(false)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const searchParams = useSearchParams()
  const defaultTab = searchParams.get("tab") === "history" ? "history" : "new"

  const [editingId, setEditingId] = useState<string | null>(null)
  const [editValues, setEditValues] = useState<{ title: string; experienceLevel: string; description: string } | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const jobInfoIdRef = useRef<string | null>(null)

  const form = useForm<AnalysisFormData>({
    resolver: zodResolver(analysisSchema),
    defaultValues: {
      candidateName: "",
      jobTitle: "",
      experienceLevel: "intern",
      jobDescription: "",
    },
  })

  const {
    object: aiAnalysis,
    isLoading,
    submit: generateAnalysis,
  } = useObject({
    api: "/api/ai/resumes/analyze",
    schema: aiAnalyzeSchema,
    fetch: (url, options) => {
      const headers = new Headers(options?.headers)
      headers.delete("Content-Type")

      const formData = new FormData()
      if (resumeFile) {
        formData.append("resumeFile", resumeFile)
      }
      
      const values = form.getValues()
      formData.append("jobTitle", values.jobTitle)
      formData.append("experienceLevel", values.experienceLevel)
      formData.append("description", values.jobDescription)
      if (jobInfoIdRef.current) {
        formData.append("jobInfoId", jobInfoIdRef.current)
      }

      return fetch(url, { ...options, headers, body: formData })
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
    toast.success(`Resume "${file.name}" selected`)
  }

  async function onSubmit(values: AnalysisFormData) {
    if (!resumeFile) {
      toast.error("Vui lòng upload CV của bạn")
      return
    }

    // Create JobInfo first so we can save the result
    const result = await createJobInfoForAnalysis({
      candidateName: values.candidateName,
      jobTitle: values.jobTitle,
      experienceLevel: values.experienceLevel,
      jobDescription: values.jobDescription,
    })

    if (result.error) {
      toast.error(result.message)
      return
    }

    jobInfoIdRef.current = result.id
    // Clear history cache so it refreshes on next visit
    setHistory(null)
    generateAnalysis(null)
  }

  useEffect(() => {
    if (defaultTab === "history") loadHistory()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function loadHistory() {
    if (history != null) return
    setHistoryLoading(true)
    try {
      const items = await getUserJobInfos(20)
      setHistory(items)
    } catch {
      toast.error("Không thể tải lịch sử phân tích")
    } finally {
      setHistoryLoading(false)
    }
  }

  return (
    <div className="container py-6 space-y-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">Phân tích CV/JD</h1>
        <p className="text-muted-foreground">
          Upload CV và nhập thông tin Job Description để nhận phân tích chi tiết
        </p>
      </div>

      <Tabs defaultValue={defaultTab} onValueChange={v => { if (v === "history") loadHistory() }}>
        <TabsList className="w-full">
          <TabsTrigger value="new" className="flex-1">Tạo phân tích mới</TabsTrigger>
          <TabsTrigger value="history" className="flex-1">Lịch sử phân tích</TabsTrigger>
        </TabsList>

        <TabsContent value="new" className="mt-6 space-y-8">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Candidate Name */}
          <FormField
            control={form.control}
            name="candidateName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Candidate Name</FormLabel>
                <FormControl>
                  <Input placeholder="Adrian Hajdin" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Job Title & Level */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="jobTitle"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Select Job</FormLabel>
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
                  <FormLabel>Level</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue />
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
          </div>

          {/* Job Description */}
          <FormField
            control={form.control}
            name="jobDescription"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Job Description</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Write a clear & concise job description with responsibilities & expectations..."
                    className="min-h-[120px]"
                    {...field}
                  />
                </FormControl>
                <FormDescription>
                  Be as specific as possible. The more information you provide,
                  the better the analysis will be.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Upload Resume */}
          <div className="space-y-2">
            <label className="text-sm font-medium leading-none">
              Upload Resume
            </label>
            <div
              className={cn(
                "border-2 border-dashed rounded-lg p-6 transition-colors cursor-pointer",
                isDragOver
                  ? "border-primary bg-primary/5"
                  : "border-muted-foreground/50 bg-muted/10 hover:border-primary/50"
              )}
              onDragOver={e => {
                e.preventDefault()
                setIsDragOver(true)
              }}
              onDragLeave={e => {
                e.preventDefault()
                setIsDragOver(false)
              }}
              onDrop={e => {
                e.preventDefault()
                setIsDragOver(false)
                handleFileUpload(e.dataTransfer.files[0] ?? null)
              }}
            >
              <label htmlFor="resume-upload" className="cursor-pointer">
                <input
                  id="resume-upload"
                  type="file"
                  accept=".pdf,.doc,.docx,.txt"
                  className="sr-only"
                  onChange={e => {
                    handleFileUpload(e.target.files?.[0] ?? null)
                  }}
                />
                <div className="flex flex-col items-center justify-center text-center gap-2">
                  <div className="rounded-lg bg-muted p-3">
                    <UploadIcon className="size-6 text-muted-foreground" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium">
                      {resumeFile ? resumeFile.name : "Click to upload"}{" "}
                      <span className="text-muted-foreground">
                        or drag and drop
                      </span>
                    </p>
                    <p className="text-xs text-muted-foreground">
                      PDF, Word docs, or text files (max. 10MB)
                    </p>
                  </div>
                </div>
              </label>
            </div>
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            disabled={isLoading}
            size="lg"
            className="w-full"
          >
            <LoadingSwap isLoading={isLoading}>
              Phân tích CV & JD
            </LoadingSwap>
          </Button>
        </form>
      </Form>

      {/* Analysis Results */}
      {(aiAnalysis || isLoading) && (
        <AnalysisResults aiAnalysis={aiAnalysis} isLoading={isLoading} />
      )}
        </TabsContent>

        <TabsContent value="history" className="mt-6">
          {historyLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-20 rounded-lg bg-muted animate-pulse" />
              ))}
            </div>
          ) : history == null || history.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center text-muted-foreground gap-3">
              <ClockIcon className="size-10 opacity-40" />
              <div>
                <p className="font-medium">Chưa có lịch sử phân tích</p>
                <p className="text-sm mt-1">Tạo phân tích đầu tiên ở tab &quot;Tạo phân tích mới&quot;</p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {history.map(item => {
                const parsed = item.analysisResult
                  ? (() => { try { return JSON.parse(item.analysisResult!) } catch { return null } })()
                  : null
                const isExpanded = expandedId === item.id

                return (
                  <div key={item.id} className="rounded-lg border bg-card overflow-hidden">
                    <button
                      type="button"
                      onClick={() => setExpandedId(isExpanded ? null : item.id)}
                      className="w-full flex items-center gap-4 p-4 text-left hover:bg-accent/50 transition-colors group"
                    >
                      <div className="rounded-lg bg-muted p-2.5 flex-shrink-0">
                        <FileTextIcon className="size-5 text-muted-foreground" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-medium text-sm truncate">{item.name}</p>
                          {item.title && (
                            <Badge variant="secondary" className="text-xs flex-shrink-0">
                              {item.title}
                            </Badge>
                          )}
                          <Badge variant="outline" className="text-xs flex-shrink-0">
                            {formatExperienceLevel(item.experienceLevel)}
                          </Badge>
                          {parsed ? (
                            <Badge variant="default" className="text-xs flex-shrink-0 bg-green-600">
                              Có kết quả
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-xs flex-shrink-0 text-muted-foreground">
                              Chưa có kết quả
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          {formatDistanceToNow(new Date(item.createdAt), { addSuffix: true, locale: vi })}
                        </p>
                      </div>
                      <ChevronRightIcon
                        className={cn(
                          "size-4 text-muted-foreground flex-shrink-0 transition-transform",
                          isExpanded && "rotate-90"
                        )}
                      />
                    </button>

                    {isExpanded && (
                      <div className="border-t">
                        {editingId === item.id && editValues ? (
                          <div className="px-4 py-4 space-y-3">
                            <div className="space-y-1">
                              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Vị trí</label>
                              <input
                                className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                                title="Vị trí"
                                placeholder="Vị trí ứng tuyển"
                                value={editValues.title}
                                onChange={e => setEditValues(v => v && ({ ...v, title: e.target.value }))}
                              />
                            </div>
                            <div className="space-y-1">
                              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Level</label>
                              <select
                                className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                                title="Level"
                                value={editValues.experienceLevel}
                                onChange={e => setEditValues(v => v && ({ ...v, experienceLevel: e.target.value }))}
                              >
                                {experienceLevels.map(l => (
                                  <option key={l} value={l}>{formatExperienceLevel(l)}</option>
                                ))}
                              </select>
                            </div>
                            <div className="space-y-1">
                              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Mô tả công việc</label>
                              <textarea
                                className="w-full rounded-md border bg-background px-3 py-2 text-sm min-h-[140px] resize-y"
                                title="Mô tả công việc"
                                placeholder="Nhập mô tả công việc..."
                                value={editValues.description}
                                onChange={e => setEditValues(v => v && ({ ...v, description: e.target.value }))}
                              />
                            </div>
                            <div className="flex gap-2 justify-end">
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => { setEditingId(null); setEditValues(null) }}
                              >
                                <XIcon className="size-3 mr-1" />
                                Hủy
                              </Button>
                              <Button
                                type="button"
                                size="sm"
                                disabled={isSaving}
                                onClick={async () => {
                                  if (!editValues) return
                                  setIsSaving(true)
                                  const result = await updateJobInfoDirect(item.id, editValues)
                                  setIsSaving(false)
                                  if (result.error) {
                                    toast.error(result.message)
                                  } else {
                                    toast.success("Đã cập nhật JD")
                                    // Update local history
                                    setHistory(prev => prev?.map(h =>
                                      h.id === item.id
                                        ? { ...h, title: editValues.title, experienceLevel: editValues.experienceLevel as any, description: editValues.description }
                                        : h
                                    ) ?? null)
                                    setEditingId(null)
                                    setEditValues(null)
                                  }
                                }}
                              >
                                {isSaving ? (
                                  <RefreshCwIcon className="size-3 mr-1 animate-spin" />
                                ) : (
                                  <CheckIcon className="size-3 mr-1" />
                                )}
                                Lưu
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <Tabs defaultValue={parsed ? "result" : "jd"} className="w-full">
                            <div className="flex items-center justify-between px-4 pt-3 gap-2">
                              <TabsList>
                                <TabsTrigger value="jd">Mô tả JD</TabsTrigger>
                                {parsed && <TabsTrigger value="result">Kết quả phân tích</TabsTrigger>}
                              </TabsList>
                              <div className="flex items-center gap-2">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setEditingId(item.id)
                                    setEditValues({ title: item.title ?? "", experienceLevel: item.experienceLevel, description: item.description })
                                  }}
                                  className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
                                >
                                  <PencilIcon className="size-3" />
                                  Sửa JD
                                </button>
                                <Link
                                  href={`/app/job-infos/${item.id}/resume`}
                                  onClick={e => e.stopPropagation()}
                                  className="flex items-center gap-1 text-xs text-primary hover:underline"
                                >
                                  <RefreshCwIcon className="size-3" />
                                  Phân tích lại
                                </Link>
                              </div>
                            </div>

                            <TabsContent value="jd" className="px-4 pb-4 mt-3">
                              <div className="space-y-3 text-sm">
                                <div>
                                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">Ứng viên</p>
                                  <p>{item.name}</p>
                                </div>
                                {item.title && (
                                  <div>
                                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">Vị trí</p>
                                    <p>{item.title}</p>
                                  </div>
                                )}
                                <div>
                                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">Level</p>
                                  <p>{formatExperienceLevel(item.experienceLevel)}</p>
                                </div>
                                <div>
                                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">Mô tả công việc</p>
                                  <p className="whitespace-pre-wrap text-muted-foreground leading-relaxed">{item.description}</p>
                                </div>
                              </div>
                            </TabsContent>

                            {parsed && (
                              <TabsContent value="result" className="px-4 pb-4 mt-0">
                                <AnalysisResults aiAnalysis={parsed} isLoading={false} />
                              </TabsContent>
                            )}
                          </Tabs>
                        )}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
