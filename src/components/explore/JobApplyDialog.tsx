"use client"

import { useState, useTransition } from "react"
import { CheckCircle2, Send, UploadCloud } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { applyToJobAction } from "@/features/explore/actions"
import { validateResumeFile } from "@/lib/resume-validation"

const fieldClass =
  "rounded-xl border-primary/10 bg-background/80 shadow-none focus-visible:ring-primary/20"
const ctaClass =
  "rounded-xl bg-gradient-to-r from-red-500 via-rose-500 to-pink-500 text-white shadow-md shadow-red-500/10 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-red-500/20"

type JobApplyDialogProps = {
  postId: string
  positionTitle: string
  companyName?: string | null
  defaultFullName?: string
  alreadyApplied: boolean
  /** "default" = nút gradient lớn, "compact" = nút nhỏ trong card feed */
  size?: "default" | "compact"
  className?: string
}

export function JobApplyDialog({
  postId,
  positionTitle,
  companyName,
  defaultFullName = "",
  alreadyApplied,
  size = "default",
  className,
}: JobApplyDialogProps) {
  const [open, setOpen] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [uploading, setUploading] = useState(false)
  const [cvFile, setCvFile] = useState<{ url: string; fileName: string } | null>(null)

  const applied = alreadyApplied || submitted
  const compact = size === "compact"

  // Reset trạng thái form khi đóng dialog để lần mở sau không dính CV/file cũ.
  function handleOpenChange(next: boolean) {
    setOpen(next)
    if (!next) {
      setCvFile(null)
      setUploading(false)
    }
  }

  async function handleFileChange(file: File | null) {
    if (!file) return

    // Kiểm tra loại/kích thước phía client trước khi upload (cùng luật với server).
    const validation = validateResumeFile(file)
    if (!validation.valid) {
      toast.error(validation.message)
      return
    }

    const formData = new FormData()
    formData.append("file", file)
    setUploading(true)

    try {
      const response = await fetch("/api/uploads/cv", {
        method: "POST",
        body: formData,
      })
      const data = await response.json()

      if (!response.ok) {
        toast.error(data.error ?? "Không thể tải CV")
        return
      }

      setCvFile({ url: data.url, fileName: data.fileName ?? file.name })
      toast.success("Đã tải CV thành công")
    } catch {
      // Lỗi mạng khi upload CV — báo cho user thay vì nuốt im lặng.
      toast.error("Không thể tải CV. Vui lòng kiểm tra kết nối và thử lại.")
    } finally {
      setUploading(false)
    }
  }

  function handleSubmit(formData: FormData) {
    if (!cvFile) {
      toast.error("Vui lòng tải CV lên trước")
      return
    }

    startTransition(async () => {
      const result = await applyToJobAction(postId, {
        fullName: String(formData.get("fullName") ?? ""),
        email: String(formData.get("email") ?? ""),
        phone: String(formData.get("phone") ?? ""),
        coverLetter: String(formData.get("coverLetter") ?? ""),
        cvUrl: cvFile.url,
        cvFileName: cvFile.fileName,
      })

      if (result.error) toast.error(result.message)
      else {
        toast.success(result.message)
        setSubmitted(true)
        setOpen(false)
      }
    })
  }

  if (applied) {
    return (
      <Button
        variant="outline"
        disabled
        className={
          compact
            ? "rounded-xl text-xs font-bold border-emerald-200 text-emerald-600 dark:border-emerald-900 py-1.5 px-3"
            : `rounded-xl font-bold border-emerald-200 text-emerald-600 dark:border-emerald-900 ${className ?? ""}`
        }
      >
        <CheckCircle2 className={compact ? "mr-1.5 size-3.5" : "mr-1.5 size-4"} />
        Đã nộp hồ sơ
      </Button>
    )
  }

  return (
    <>
      <Button
        onClick={() => setOpen(true)}
        className={
          compact
            ? "rounded-xl text-xs font-bold bg-gradient-to-r from-red-500 via-rose-500 to-pink-500 hover:opacity-90 shadow-md shadow-red-500/10 py-1.5 px-3"
            : `rounded-xl font-bold bg-gradient-to-r from-red-500 via-rose-500 to-pink-500 hover:opacity-90 shadow-md shadow-red-500/10 ${className ?? ""}`
        }
      >
        <Send className={compact ? "mr-1.5 size-3.5" : "mr-1.5 size-4"} />
        Nộp hồ sơ
      </Button>

      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Nộp hồ sơ ứng tuyển</DialogTitle>
            <DialogDescription>
              Ứng tuyển vào vị trí “{positionTitle}”
              {companyName ? ` tại ${companyName}` : ""}.
            </DialogDescription>
          </DialogHeader>

          <form action={handleSubmit} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label className="text-sm font-medium">Họ và tên</Label>
                <Input name="fullName" maxLength={160} required defaultValue={defaultFullName} placeholder="Nguyễn Văn A" className={fieldClass} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm font-medium">Email liên hệ</Label>
                <Input name="email" type="email" maxLength={255} placeholder="you@email.com" className={fieldClass} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm font-medium">Số điện thoại</Label>
              <Input name="phone" maxLength={40} placeholder="09xxxxxxxx" className={fieldClass} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm font-medium">Thư giới thiệu</Label>
              <Textarea name="coverLetter" maxLength={3000} placeholder="Giới thiệu ngắn gọn về bạn và lý do phù hợp với vị trí này..." className={`min-h-24 ${fieldClass}`} />
            </div>
            <div className="rounded-xl border border-dashed border-primary/20 bg-gradient-to-br from-primary/5 via-background to-rose-50/60 p-4 dark:to-rose-950/10">
              <Label htmlFor={`apply-cv-${postId}`} className="flex cursor-pointer items-center gap-2 text-sm font-medium">
                <UploadCloud className="size-4 text-primary" />
                {uploading ? "Đang tải CV..." : cvFile?.fileName ?? "Tải CV PDF/DOC/DOCX/TXT"}
              </Label>
              <Input
                id={`apply-cv-${postId}`}
                type="file"
                accept=".pdf,.doc,.docx,.txt"
                className={`mt-3 ${fieldClass}`}
                disabled={uploading}
                onChange={event => handleFileChange(event.target.files?.[0] ?? null)}
              />
            </div>
            <div className="flex justify-end gap-2 pt-2 border-t">
              <Button type="button" variant="outline" className="rounded-xl" onClick={() => handleOpenChange(false)}>
                Hủy
              </Button>
              <Button type="submit" disabled={isPending || uploading} className={ctaClass}>
                <Send className="mr-2 size-4" />
                Gửi hồ sơ
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}
