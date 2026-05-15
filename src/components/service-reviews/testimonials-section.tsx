"use client"

import { FormEvent, useState } from "react"
import Link from "next/link"
import { ArrowRight, MessageSquareText, Send, Star } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
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
import { UserAvatar } from "@/features/users/components/UserAvatar"
import {
  SERVICE_REVIEW_SERVICE_KEYS,
  getServiceReviewServiceLabel,
} from "@/features/serviceReviews/serviceReviewRules.mjs"
import { toast } from "sonner"

export type PublishedReview = {
  id: string
  userName: string
  userImage: string | null
  serviceKey: string
  serviceLabel: string
  rating: number
  comment: string | null
  createdAt: string
}

type FallbackTestimonial = {
  name: string
  role: string
  company: string
  avatar: string
  content: string
  timeToOffer: string
  rating: number
}

const fallbackTestimonials: FallbackTestimonial[] = [
  {
    name: "Sarah Chen",
    role: "Software Engineer",
    company: "Google",
    avatar:
      "https://images.unsplash.com/photo-1494790108755-2616b612b47c?w=64&h=64&fit=crop&crop=face&auto=format&q=80",
    content:
      "NextStep completely transformed my interview preparation. The AI practice sessions felt so realistic that I walked into my Google interview feeling completely confident. Landed the offer on my first try!",
    timeToOffer: "3 weeks",
    rating: 5,
  },
  {
    name: "Marcus Rodriguez",
    role: "Product Manager",
    company: "Stripe",
    avatar:
      "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=64&h=64&fit=crop&crop=face&auto=format&q=80",
    content:
      "I was struggling with behavioral questions until I found NextStep. The AI helped me craft compelling stories and practice my delivery. Got offers from 3 different companies!",
    timeToOffer: "5 weeks",
    rating: 5,
  },
  {
    name: "Emily Park",
    role: "Data Scientist",
    company: "Netflix",
    avatar:
      "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=64&h=64&fit=crop&crop=face&auto=format&q=80",
    content:
      "The resume optimization feature was a game-changer. My callback rate tripled after implementing NextStep's suggestions. Worth every penny and more.",
    timeToOffer: "4 weeks",
    rating: 5,
  },
  {
    name: "Alex Thompson",
    role: "Frontend Developer",
    company: "Airbnb",
    avatar:
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=64&h=64&fit=crop&crop=face&auto=format&q=80",
    content:
      "The technical question practice was incredible. I went from failing coding interviews to acing them. The AI's feedback helped me identify and fix my weak spots immediately.",
    timeToOffer: "2 weeks",
    rating: 5,
  },
  {
    name: "Priya Patel",
    role: "UX Designer",
    company: "Figma",
    avatar:
      "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=64&h=64&fit=crop&crop=face&auto=format&q=80",
    content:
      "I was career-changing into tech and felt overwhelmed. NextStep's personalized guidance gave me the confidence to pursue design roles. Now I'm living my dream at Figma!",
    timeToOffer: "6 weeks",
    rating: 5,
  },
  {
    name: "David Kim",
    role: "DevOps Engineer",
    company: "AWS",
    avatar:
      "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=64&h=64&fit=crop&crop=face&auto=format&q=80",
    content:
      "The salary negotiation tips alone paid for the platform 10x over. I increased my offer by $25K just by following NextStep's guidance. Absolutely worth it!",
    timeToOffer: "4 weeks",
    rating: 5,
  },
]

function RatingStars({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }, (_, index) => {
        const value = index + 1
        return (
          <Star
            key={value}
            className="h-4 w-4 text-amber-500"
            fill={value <= rating ? "currentColor" : "none"}
          />
        )
      })}
    </div>
  )
}

function timeAgo(dateString: string) {
  const now = new Date()
  const date = new Date(dateString)
  const diffMs = now.getTime() - date.getTime()
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
  if (diffDays < 1) return "Hôm nay"
  if (diffDays === 1) return "Hôm qua"
  if (diffDays < 7) return `${diffDays} ngày trước`
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} tuần trước`
  return `${Math.floor(diffDays / 30)} tháng trước`
}

export function TestimonialsSection({
  publishedReviews,
  isLoggedIn,
}: {
  publishedReviews: PublishedReview[]
  isLoggedIn: boolean
}) {
  const [dialogOpen, setDialogOpen] = useState(false)
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
        body: JSON.stringify({ serviceKey, rating, comment }),
      })

      if (!response.ok) throw new Error(await response.text())

      toast.success("Đã gửi đánh giá. Cảm ơn bạn đã chia sẻ câu chuyện!")
      setComment("")
      setRating(5)
      setServiceKey("system")
      setDialogOpen(false)
    } catch {
      toast.error("Không gửi được đánh giá. Vui lòng thử lại.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const hasRealReviews = publishedReviews.length > 0

  return (
    <section id="reviews" className="py-16 md:py-20">
      <div className="container mx-auto px-4">
        <div className="mx-auto mb-12 max-w-2xl text-center">
          <h3 className="text-3xl font-semibold tracking-tight md:text-4xl">
            Đánh giá từ{" "}
            <span className="bg-gradient-to-r from-pink-500 via-red-500 to-orange-400 bg-clip-text text-transparent">
              người dùng thật
            </span>
          </h3>
          <p className="mt-3 text-muted-foreground">
            Những câu chuyện thành công từ cộng đồng đã tăng tốc sự nghiệp với
            NextStep.
          </p>
        </div>

        {/* Real reviews from DB */}
        {hasRealReviews && (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {publishedReviews.map(review => (
              <Card
                key={review.id}
                className="rounded-3xl border bg-card/60 shadow-sm transition-transform duration-400 hover:-translate-y-2 hover:shadow-2xl"
              >
                <CardContent className="p-6">
                  <div className="flex items-center gap-3">
                    <UserAvatar
                      className="size-10 shrink-0"
                      user={{
                        imageUrl: review.userImage ?? "",
                        name: review.userName,
                      }}
                    />
                    <div className="min-w-0">
                      <div className="truncate font-semibold">
                        {review.userName}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {review.serviceLabel} • {timeAgo(review.createdAt)}
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 flex items-center gap-1">
                    <RatingStars rating={review.rating} />
                  </div>

                  {review.comment && (
                    <blockquote className="mt-4 text-sm leading-relaxed text-muted-foreground">
                      &ldquo;{review.comment}&rdquo;
                    </blockquote>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Fallback hardcoded testimonials — only show if no real reviews */}
        {!hasRealReviews && (
          <div className="grid gap-6 md:grid-cols-3">
            {fallbackTestimonials.map((t, i) => (
              <Card
                key={i}
                className="rounded-3xl border bg-card/60 shadow-sm transition-transform duration-400 hover:-translate-y-2 hover:shadow-2xl"
              >
                <CardContent className="p-6">
                  <div className="flex items-center gap-3">
                    <UserAvatar
                      className="size-10 shrink-0"
                      user={{ imageUrl: t.avatar, name: t.name }}
                    />
                    <div className="min-w-0">
                      <div className="truncate font-semibold">{t.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {t.role} • {t.company}
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 flex items-center gap-1">
                    {Array.from({ length: t.rating }).map((_, idx) => (
                      <Star
                        key={idx}
                        className="h-4 w-4 text-amber-500"
                        fill="currentColor"
                      />
                    ))}
                    <span className="ml-2 text-xs text-muted-foreground">
                      Hired in {t.timeToOffer}
                    </span>
                  </div>

                  <blockquote className="mt-4 text-sm leading-relaxed text-muted-foreground">
                    &ldquo;{t.content}&rdquo;
                  </blockquote>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* CTA — "Viết câu chuyện của bạn" opens review dialog */}
        <div className="mt-10 text-center">
          {isLoggedIn ? (
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button
                  size="lg"
                  className="h-12 rounded-2xl px-8 transform transition-all duration-300 hover:scale-105"
                >
                  <MessageSquareText className="mr-2 h-4 w-4" />
                  Viết câu chuyện của bạn
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </DialogTrigger>

              <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                  <DialogTitle>Chia sẻ trải nghiệm của bạn</DialogTitle>
                  <DialogDescription>
                    Đánh giá dịch vụ NextStep để giúp cộng đồng biết sản phẩm
                    hoạt động tốt như thế nào.
                  </DialogDescription>
                </DialogHeader>

                <form className="space-y-4" onSubmit={submit}>
                  <label className="grid gap-2 text-sm">
                    <span className="font-medium">Dịch vụ bạn muốn đánh giá</span>
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
                    <Label htmlFor="landing-review-comment">
                      Câu chuyện của bạn
                    </Label>
                    <Textarea
                      id="landing-review-comment"
                      value={comment}
                      onChange={event => setComment(event.target.value)}
                      placeholder="Chia sẻ trải nghiệm của bạn với NextStep — điều gì giúp ích nhất cho bạn?"
                      maxLength={2000}
                      rows={5}
                    />
                  </div>

                  <div className="flex justify-end gap-2">
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => setDialogOpen(false)}
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
          ) : (
            <Button
              size="lg"
              className="h-12 rounded-2xl px-8 transform transition-all duration-300 hover:scale-105"
              asChild
            >
              <Link href="/sign-in">
                Viết câu chuyện của bạn
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          )}
        </div>
      </div>
    </section>
  )
}
