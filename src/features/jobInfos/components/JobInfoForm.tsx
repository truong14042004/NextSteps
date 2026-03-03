"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { experienceLevels, JobInfoTable } from "@/drizzle/schema/jobInfo"
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
import { jobInfoSchema } from "../schemas"
import { formatExperienceLevel } from "../lib/formatters"
import { LoadingSwap } from "@/components/ui/loading-swap"
import { createJobInfo, updateJobInfo } from "../actions"
import { toast } from "sonner"
import { UploadIcon } from "lucide-react"
import { useState } from "react"
import { cn } from "@/lib/utils"

type JobInfoFormData = z.infer<typeof jobInfoSchema>

export function JobInfoForm({
  jobInfo,
}: {
  jobInfo?: Pick<
    typeof JobInfoTable.$inferSelect,
    "id" | "name" | "title" | "description" | "experienceLevel" | "resumeUrl"
  >
}) {
  const [resumeFile, setResumeFile] = useState<File | null>(null)
  const [isDragOver, setIsDragOver] = useState(false)
  
  const form = useForm<JobInfoFormData>({
    resolver: zodResolver(jobInfoSchema),
    defaultValues: jobInfo ?? {
      name: "",
      title: null,
      description: "",
      experienceLevel: "intern",
    },
  })

  async function onSubmit(values: JobInfoFormData) {
    const action = jobInfo
      ? updateJobInfo.bind(null, jobInfo.id)
      : createJobInfo
    const res = await action(values)

    if (res.error) {
      toast.error(res.message)
    }
    // TODO: Handle resume file upload separately
    // if (resumeFile) { upload to storage }
  }

  function handleFileUpload(file: File | null) {
    if (file == null) return

    if (file.size > 10 * 1024 * 1024) {
      toast.error("File size exceeds 10MB limit")
      return
    }

    const allowedTypes = [
      "application/pdf",
      "image/png",
      "image/jpeg",
    ]

    if (!allowedTypes.includes(file.type)) {
      toast.error("Please upload PDF, PNG, or JPG file")
      return
    }

    setResumeFile(file)
    toast.success(`Resume "${file.name}" selected`)
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Candidate Name</FormLabel>
              <FormControl>
                <Input placeholder="Adrian Hajdin" {...field} />
              </FormControl>
              <FormDescription>
                This name is displayed in the UI for easy identification.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-start">
          <FormField
            control={form.control}
            name="title"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Select Job</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Frontend Developer"
                    {...field}
                    value={field.value ?? ""}
                    onChange={e => field.onChange(e.target.value || null)}
                  />
                </FormControl>
                <FormDescription>
                  Optional. Only enter if there is a specific job title you are
                  applying for.
                </FormDescription>
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

        <FormField
          control={form.control}
          name="description"
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
                the better the interviews will be.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Upload Resume Field */}
        <div className="space-y-2">
          <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
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
                accept=".pdf,.png,.jpg,.jpeg"
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
                    <span className="text-muted-foreground">or drag and drop</span>
                  </p>
                  <p className="text-xs text-muted-foreground">
                    PDF, PNG or JPG (max. 10MB)
                  </p>
                </div>
              </div>
            </label>
          </div>
        </div>

        <Button
          disabled={form.formState.isSubmitting}
          type="submit"
          className="w-full"
        >
          <LoadingSwap isLoading={form.formState.isSubmitting}>
            Save Job Information
          </LoadingSwap>
        </Button>
      </form>
    </Form>
  )
}
