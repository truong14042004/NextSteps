"use client"

import { FormEvent, useState } from "react"
import { MessageSquareText, Send, Star } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  SERVICE_REVIEW_SERVICE_KEYS,
  getServiceReviewServiceLabel,
} from "@/features/serviceReviews/serviceReviewRules.mjs"

export function ServiceReviewButton() {
  const [open, setOpen] = useState(false)
  const [serviceKey, setServiceKey] = useState("system")
  const [rating, setRating] = useState(5)
  const [comment, setComment] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setIsSubmitting(true)

    try {
      const response = await fetch("/api/service-reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          serviceKey,
          rating,
          comment,
        }),
      })

      if (!response.ok) {
        throw new Error(await response.text())
      }

      toast.success("Đã gửi đánh giá. Cảm ơn bạn đã phản hồi.")
      setComment("")
      setRating(5)
      setServiceKey("system")
      setOpen(false)
    } catch (error) {
      console.error("Failed to submit service review", error)
      toast.error("Không gửi được đánh giá. Vui lòng thử lại.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed bottom-24 right-5 z-40 sm:bottom-6 sm:right-24">
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button
            type="button"
            variant="outline"
            className="gap-2 rounded-full border-primary/30 bg-background/95 shadow-lg backdrop-blur"
          >
            <MessageSquareText className="size-4" />
            <span className="hidden sm:inline">Đánh giá dịch vụ</span>
          </Button>
        </DialogTrigger>

        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Đánh giá dịch vụ hệ thống</DialogTitle>
            <DialogDescription>
              Phản hồi của bạn giúp admin biết dịch vụ nào cần cải thiện.
            </DialogDescription>
          </DialogHeader>

          <form className="space-y-4" onSubmit={submit}>
            <label className="grid gap-2 text-sm">
              <span className="font-medium">Dịch vụ</span>
              <select
                value={serviceKey}
                onChange={event => setServiceKey(event.target.value)}
                className="h-10 rounded-md border border-input bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
              >
                {SERVICE_REVIEW_SERVICE_KEYS.map(key => (
                  <option key={key} value={key}>
                    {getServiceReviewServiceLabel(key)}
                  </option>
                ))}
              </select>
            </label>

            <div className="grid gap-2">
              <Label>Điểm đánh giá</Label>
              <div className="flex gap-1">
                {Array.from({ length: 5 }, (_, index) => {
                  const value = index + 1

                  return (
                    <button
                      key={value}
                      type="button"
                      className="rounded-md p-1 text-amber-500 transition hover:bg-amber-500/10"
                      onClick={() => setRating(value)}
                      aria-label={`Chọn ${value} sao`}
                    >
                      <Star
                        className="size-6"
                        fill={value <= rating ? "currentColor" : "none"}
                      />
                    </button>
                  )
                })}
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="service-review-comment">Góp ý</Label>
              <Textarea
                id="service-review-comment"
                value={comment}
                onChange={event => setComment(event.target.value)}
                placeholder="Điều gì đang tốt hoặc cần cải thiện?"
                maxLength={2000}
                rows={5}
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setOpen(false)}
                disabled={isSubmitting}
              >
                Hủy
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                <Send className="mr-2 size-4" />
                Gửi đánh giá
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
