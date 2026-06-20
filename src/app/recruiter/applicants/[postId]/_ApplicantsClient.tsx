"use client"

import { useMemo, useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Download, Eye, FileText, Mail, Phone } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
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

  const filtered = useMemo(
    () =>
      filter === "all"
        ? applications
        : applications.filter(app => app.status === filter),
    [applications, filter],
  )

  function changeStatus(
    applicationId: string,
    status: "pending" | "reviewing" | "accepted" | "rejected",
  ) {
    startTransition(async () => {
      const result = await updateApplicationStatusAction(applicationId, status)
      if (result.error) toast.error(result.message)
      else {
        toast.success(result.message)
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
                    onClick={() => setPreviewCv({ url: app.cvUrl, name: app.cvFileName })}
                  >
                    <Eye className="size-3.5 mr-1.5" />
                    Xem CV
                  </Button>
                  <a
                    href={app.cvUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    download
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
                      onClick={() => changeStatus(app.id, s.value)}
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
    </div>
  )
}
