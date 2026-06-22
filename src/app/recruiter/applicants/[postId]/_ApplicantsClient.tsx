"use client"

import { useMemo, useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { CheckCircle2, Download, Eye, FileText, Mail, Phone, Send, XCircle } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { updateApplicationStatusAction } from "@/features/explore/actions"
import { getJobApplicationStatusLabel } from "@/features/explore/exploreRules.mjs"

type Applicant = {
  name: string
  email: string
  imageUrl: string
} | null

type Application = {
  id: string
  status: "pending" | "reviewing" | "accepted" | "rejected" | "withdrawn"
  fullName: string
  email: string | null
  phone: string | null
  coverLetter: string | null
  cvUrl: string
  cvFileName: string
  recruiterNote: string | null
  createdAt: string
  applicant: Applicant
}

const STATUS_FILTERS = [
  { value: "all", label: "Tất cả" },
  { value: "pending", label: "Mới nộp" },
  { value: "reviewing", label: "Đang xem xét" },
  { value: "accepted", label: "Đã nhận" },
  { value: "rejected", label: "Từ chối" },
  { value: "withdrawn", label: "Đã rút" },
] as const

const REVIEW_STATUSES = [
  { value: "pending", label: "Mới nộp" },
  { value: "reviewing", label: "Đang xem xét" },
  { value: "accepted", label: "Đã nhận" },
  { value: "rejected", label: "Từ chối" },
] as const

const statusBadgeClass: Record<string, string> = {
  pending: "bg-amber-500/15 text-amber-600 border-amber-500/30",
  reviewing: "bg-blue-500/15 text-blue-600 border-blue-500/30",
  accepted: "bg-emerald-500/15 text-emerald-600 border-emerald-500/30",
  rejected: "bg-rose-500/15 text-rose-600 border-rose-500/30",
  withdrawn: "bg-slate-500/15 text-slate-500 border-slate-500/30",
}

export function ApplicantsClient({ applications }: { applications: Application[] }) {
  const router = useRouter()
  const [filter, setFilter] = useState<string>("all")
  const [isPending, startTransition] = useTransition()
  const [previewCv, setPreviewCv] = useState<{ url: string; name: string } | null>(null)
  const [decision, setDecision] = useState<{
    app: Application
    status: "accepted" | "rejected"
    note: string
  } | null>(null)

  const filtered = useMemo(
    () =>
      filter === "all"
        ? applications
        : applications.filter(app => app.status === filter),
    [applications, filter],
  )

  // Đổi trạng thái trực tiếp (pending / reviewing) — không cần email.
  function changeStatus(
    applicationId: string,
    status: "pending" | "reviewing" | "accepted" | "rejected",
    note?: string,
  ) {
    startTransition(async () => {
      const result = await updateApplicationStatusAction(applicationId, status, note)
      if (result.error) toast.error(result.message)
      else {
        toast.success(result.message)
        setDecision(null)
        router.refresh()
      }
    })
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <span className="text-sm text-muted-foreground">
          {filtered.length} hồ sơ
        </span>
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="w-44 rounded-xl">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {STATUS_FILTERS.map(s => (
              <SelectItem key={s.value} value={s.value}>
                {s.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
          Chưa có hồ sơ nào ở trạng thái này.
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(app => (
            <div
              key={app.id}
              className="rounded-2xl border border-border bg-card p-5"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-foreground">{app.fullName}</span>
                    <Badge
                      variant="outline"
                      className={`rounded-full ${statusBadgeClass[app.status] ?? ""}`}
                    >
                      {getJobApplicationStatusLabel(app.status)}
                    </Badge>
                  </div>
                  <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                    {app.email && (
                      <span className="inline-flex items-center gap-1">
                        <Mail className="size-3" />
                        {app.email}
                      </span>
                    )}
                    {app.phone && (
                      <span className="inline-flex items-center gap-1">
                        <Phone className="size-3" />
                        {app.phone}
                      </span>
                    )}
                    <span>
                      Nộp ngày{" "}
                      {new Date(app.createdAt).toLocaleDateString("vi-VN")}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <Button
                    variant="outline"
                    size="sm"
                    className="rounded-xl h-8 text-xs"
                    onClick={() =>
                      setPreviewCv({
                        url: `/api/recruiter/applications/${app.id}/cv`,
                        name: app.cvFileName,
                      })
                    }
                  >
                    <Eye className="size-3.5 mr-1.5" />
                    Xem CV
                  </Button>
                  <a
                    href={`/api/recruiter/applications/${app.id}/cv?download=1`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-xl border border-border px-3 py-1.5 text-xs font-semibold text-foreground hover:bg-muted transition-colors"
                    title={app.cvFileName}
                  >
                    <Download className="size-3.5" />
                    Tải về
                  </a>
                </div>
              </div>

              {app.coverLetter && (
                <p className="mt-3 whitespace-pre-line rounded-xl bg-muted/40 p-3 text-sm text-muted-foreground">
                  {app.coverLetter}
                </p>
              )}

              {app.status !== "withdrawn" && (
                <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-border pt-3">
                  <span className="text-xs font-semibold text-muted-foreground">
                    Đổi trạng thái:
                  </span>
                  {REVIEW_STATUSES.map(s => (
                    <Button
                      key={s.value}
                      variant={app.status === s.value ? "default" : "outline"}
                      size="sm"
                      className="rounded-lg h-8 text-xs"
                      disabled={isPending || app.status === s.value}
                      onClick={() => {
                        // Nhận / từ chối: mở dialog nhập lời nhắn để gửi email.
                        // Các trạng thái khác đổi trực tiếp.
                        if (s.value === "accepted" || s.value === "rejected") {
                          setDecision({ app, status: s.value, note: "" })
                        } else {
                          changeStatus(app.id, s.value)
                        }
                      }}
                    >
                      {s.label}
                    </Button>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <Dialog open={previewCv != null} onOpenChange={open => !open && setPreviewCv(null)}>
        <DialogContent className="max-w-4xl h-[85vh] flex flex-col p-0 gap-0">
          <DialogHeader className="px-5 py-3 border-b border-border">
            <DialogTitle className="flex items-center gap-2 text-sm">
              <FileText className="size-4 text-primary" />
              {previewCv?.name}
            </DialogTitle>
          </DialogHeader>
          {previewCv && (
            <iframe
              src={previewCv.url}
              title="Xem CV ứng viên"
              className="flex-1 w-full rounded-b-lg"
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Dialog quyết định nhận / từ chối — kèm lời nhắn gửi email cho ứng viên */}
      <Dialog
        open={decision != null}
        onOpenChange={open => !open && !isPending && setDecision(null)}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {decision?.status === "accepted"
                ? "Nhận hồ sơ ứng viên"
                : "Từ chối hồ sơ ứng viên"}
            </DialogTitle>
          </DialogHeader>

          {decision && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                {decision.status === "accepted" ? (
                  <>
                    Xác nhận <strong className="text-foreground">nhận</strong> hồ
                    sơ của <strong className="text-foreground">{decision.app.fullName}</strong>.
                  </>
                ) : (
                  <>
                    Xác nhận <strong className="text-foreground">từ chối</strong>{" "}
                    hồ sơ của{" "}
                    <strong className="text-foreground">{decision.app.fullName}</strong>.
                  </>
                )}
                {decision.app.email ? (
                  <>
                    {" "}
                    Email thông báo sẽ được gửi tới{" "}
                    <span className="font-medium text-foreground">
                      {decision.app.email}
                    </span>
                    .
                  </>
                ) : (
                  <span className="block mt-1 text-amber-600">
                    Ứng viên này không có email nên sẽ không nhận được thông báo.
                  </span>
                )}
              </p>

              <div className="space-y-1.5">
                <Label>Lời nhắn cho ứng viên (tùy chọn)</Label>
                <Textarea
                  value={decision.note}
                  onChange={event =>
                    setDecision(prev =>
                      prev ? { ...prev, note: event.target.value } : prev,
                    )
                  }
                  maxLength={2000}
                  placeholder={
                    decision.status === "accepted"
                      ? "Ví dụ: Chúng tôi sẽ liên hệ bạn qua điện thoại để hẹn lịch phỏng vấn..."
                      : "Ví dụ: Cảm ơn bạn đã ứng tuyển. Hồ sơ rất tốt nhưng hiện chưa phù hợp với..."
                  }
                  className="min-h-28 rounded-xl"
                />
                <p className="text-xs text-muted-foreground">
                  Lời nhắn này sẽ được đưa vào email gửi cho ứng viên.
                </p>
              </div>

              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  className="rounded-xl"
                  disabled={isPending}
                  onClick={() => setDecision(null)}
                >
                  Hủy
                </Button>
                <Button
                  type="button"
                  className={`rounded-xl ${
                    decision.status === "rejected"
                      ? "bg-rose-600 hover:bg-rose-700 text-white"
                      : ""
                  }`}
                  disabled={isPending}
                  onClick={() =>
                    changeStatus(decision.app.id, decision.status, decision.note)
                  }
                >
                  {decision.status === "accepted"
                    ? "Nhận & gửi email"
                    : "Từ chối & gửi email"}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
