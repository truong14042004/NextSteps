"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Eye, EyeOff, Pencil, Send, Trash2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
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
  deleteOwnExplorePostAction,
  hideOwnExplorePostAction,
  unhideOwnExplorePostAction,
  updateOwnExplorePostAction,
} from "@/features/explore/actions"

export type RecruiterPost = {
  id: string
  status: string
  title: string
  content: string
  companyName: string | null
  positionTitle: string | null
  location: string | null
  salaryRange: string | null
  skills: string | null
}

const fieldClass =
  "rounded-xl border-primary/10 bg-background/80 shadow-none focus-visible:ring-primary/20"

export function RecruiterPostActions({ post }: { post: RecruiterPost }) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [editOpen, setEditOpen] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)

  function runAction(action: () => Promise<{ error: boolean; message: string }>) {
    startTransition(async () => {
      const result = await action()
      if (result.error) toast.error(result.message)
      else {
        toast.success(result.message)
        setEditOpen(false)
        setConfirmDelete(false)
        router.refresh()
      }
    })
  }

  function handleEdit(formData: FormData) {
    runAction(() =>
      updateOwnExplorePostAction(post.id, {
        title: String(formData.get("title") ?? ""),
        content: String(formData.get("content") ?? ""),
        companyName: String(formData.get("companyName") ?? ""),
        positionTitle: String(formData.get("positionTitle") ?? ""),
        location: String(formData.get("location") ?? ""),
        salaryRange: String(formData.get("salaryRange") ?? ""),
        skills: String(formData.get("skills") ?? ""),
      }),
    )
  }

  return (
    <div className="flex items-center justify-end gap-2">
      <Button
        variant="outline"
        size="sm"
        className="rounded-lg h-8"
        disabled={isPending}
        onClick={() => setEditOpen(true)}
      >
        <Pencil className="size-3.5 mr-1.5" />
        Sửa
      </Button>

      {post.status === "published" && (
        <Button
          variant="outline"
          size="sm"
          className="rounded-lg h-8 text-muted-foreground"
          disabled={isPending}
          onClick={() => runAction(() => hideOwnExplorePostAction(post.id))}
        >
          <EyeOff className="size-3.5 mr-1.5" />
          Ẩn
        </Button>
      )}

      {post.status === "hidden" && (
        <Button
          variant="outline"
          size="sm"
          className="rounded-lg h-8 text-emerald-600"
          disabled={isPending}
          onClick={() => runAction(() => unhideOwnExplorePostAction(post.id))}
        >
          <Eye className="size-3.5 mr-1.5" />
          Hiện lại
        </Button>
      )}

      <Button
        variant="outline"
        size="sm"
        className="rounded-lg h-8 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/20"
        disabled={isPending}
        onClick={() => setConfirmDelete(true)}
      >
        <Trash2 className="size-3.5 mr-1.5" />
        Xóa
      </Button>

      {/* Dialog sửa bài */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Sửa bài tuyển dụng</DialogTitle>
            <DialogDescription>
              Cập nhật nội dung tin tuyển dụng. Nếu bài đang chờ duyệt hoặc bị từ
              chối, bài sẽ được gửi lại để admin duyệt.
            </DialogDescription>
          </DialogHeader>

          <form action={handleEdit} className="space-y-4">
            <div className="space-y-1.5">
              <Label>Tiêu đề</Label>
              <Input
                name="title"
                defaultValue={post.title}
                minLength={5}
                maxLength={180}
                required
                className={fieldClass}
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label>Tên công ty</Label>
                <Input
                  name="companyName"
                  defaultValue={post.companyName ?? ""}
                  minLength={2}
                  maxLength={160}
                  required
                  className={fieldClass}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Vị trí tuyển dụng</Label>
                <Input
                  name="positionTitle"
                  defaultValue={post.positionTitle ?? ""}
                  minLength={2}
                  maxLength={160}
                  required
                  className={fieldClass}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Địa điểm</Label>
                <Input
                  name="location"
                  defaultValue={post.location ?? ""}
                  maxLength={160}
                  className={fieldClass}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Mức lương</Label>
                <Input
                  name="salaryRange"
                  defaultValue={post.salaryRange ?? ""}
                  maxLength={120}
                  className={fieldClass}
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Nội dung mô tả</Label>
              <Textarea
                name="content"
                defaultValue={post.content}
                minLength={30}
                maxLength={6000}
                required
                className={`min-h-32 ${fieldClass}`}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Kỹ năng (cách nhau bằng dấu phẩy)</Label>
              <Input
                name="skills"
                defaultValue={post.skills ?? ""}
                maxLength={1000}
                className={fieldClass}
              />
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                className="rounded-xl"
                onClick={() => setEditOpen(false)}
                disabled={isPending}
              >
                Hủy
              </Button>
              <Button type="submit" className="rounded-xl" disabled={isPending}>
                <Send className="mr-2 size-4" />
                Lưu thay đổi
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dialog xác nhận xóa */}
      <Dialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Xóa bài tuyển dụng?</DialogTitle>
            <DialogDescription>
              Bài viết sẽ bị gỡ khỏi trang Khám phá và không thể khôi phục. Hồ sơ
              ứng viên đã nộp vẫn được giữ lại.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              className="rounded-xl"
              onClick={() => setConfirmDelete(false)}
              disabled={isPending}
            >
              Hủy
            </Button>
            <Button
              type="button"
              variant="destructive"
              className="rounded-xl"
              disabled={isPending}
              onClick={() => runAction(() => deleteOwnExplorePostAction(post.id))}
            >
              <Trash2 className="mr-2 size-4" />
              Xóa bài
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
