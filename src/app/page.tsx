import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getCurrentUser } from "@/services/clerk/lib/getCurrentUser";
import {
  BookOpenCheckIcon,
  Brain,
  ArrowRight,
  FileSlidersIcon,
  FileSearch,
  Sparkles,
  SpeechIcon,
  Star,
  ShieldCheck,
  Zap,
  Check,
  Crown,
  Rocket,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { Suspense } from "react";
import { UserAvatar } from "@/features/users/components/UserAvatar";
import { PricingTable } from "@/services/clerk/components/PricingTable";

export default function LandingPage() {
  return (
    <div className="h-full bg-background">
      {/* Premium subtle background */}
      <div className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute -top-40 left-1/2 h-[28rem] w-[52rem] -translate-x-1/2 rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute top-24 right-[-6rem] h-72 w-72 rounded-full bg-muted/70 blur-3xl" />
        <div className="absolute bottom-0 left-[-6rem] h-80 w-80 rounded-full bg-muted/70 blur-3xl" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,hsl(var(--border))_1px,transparent_0)] [background-size:26px_26px] opacity-[0.25]" />
      </div>

      <Navbar />

      <main>
        <Hero />
        <Features />
        <DetailedFeatures />
        <Stats />
        <Testimonials />
        <Pricing />
        <FAQ />
      </main>

      <Footer />
    </div>
  );
}

function Navbar() {
  return (
    <header className="sticky top-0 z-50 border-b bg-background/70 backdrop-blur-md">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Left: brand */}
          <Link href="/" className="flex items-center gap-2">
            <Image
              src="/logo.png"
              alt="NextStep logo"
              width={36}
              height={36}
              className="rounded-md object-contain"
              priority
            />
            <span className="text-lg font-semibold tracking-tight ">
              NextStep
            </span>
          </Link>

          {/* Middle: nav */}
          <nav className="hidden items-center gap-6 md:flex">
            <a
              href="#features"
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              Tính năng
            </a>
            <a
              href="#reviews"
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              Đánh giá
            </a>
            <a
              href="#pricing"
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              Bảng giá
            </a>
            <a
              href="#faq"
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              FAQ
            </a>
          </nav>

          {/* Right: auth */}
          <Suspense
            fallback={
              <div className="flex items-center gap-2">
                <Button variant="outline" className="rounded-xl">
                  Đăng nhập
                </Button>
                <Button className="rounded-xl">Đăng ký</Button>
              </div>
            }
          >
            <NavButton />
          </Suspense>
        </div>
      </div>
    </header>
  );
}

async function NavButton() {
  const { userId } = await getCurrentUser();

  if (!userId) {
    return (
      <div className="flex items-center gap-2">
        <Link href="/sign-in">
          <Button variant="outline" className="rounded-xl">
            Đăng nhập
          </Button>
        </Link>
        <Link href="/sign-up">
          <Button className="rounded-xl bg-primary">Đăng ký</Button>
        </Link>
      </div>
    );
  }

  return (
    <Button asChild className="rounded-xl">
      <Link href="/app">
        Dashboard <ArrowRight className="ml-2 h-4 w-4" />
      </Link>
    </Button>
  );
}

function Hero() {
  return (
    <section className="relative overflow-hidden">
      <div className="container mx-auto px-4">
        <div className="py-14 md:py-20">
          <div className="mx-auto max-w-3xl text-center">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 rounded-full border bg-background/60 px-3 py-1 md:text-1xl  bg-gradient-to-r from-pink-500 via-indigo-500 to-amber-400 bg-clip-text text-transparent">
              <Sparkles className="h-3.5 w-3.5 text-primary" />
              AI Career Mentor cho sinh viên & fresher
            </div>

            {/* Brand + title (centered, balanced) */}
            <div className="mt-6">
              {/* <div className="flex items-center justify-center gap-3">
                <h2 className="">
                  NextStep
                </h2>
                <span className="text-sm text-muted-foreground">
                  — AI job prep
                </span>
              </div> */}

              <h1 className="mt-4 text-3xl font-semibold tracking-tight md:text-5xl leading-tight">
                <span className="block bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 via-rose-500 to-amber-400">
                  Luyện phỏng vấn với AI,
                </span>
                <span className="block bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 via-rose-500 to-amber-400">
                  nhận feedback CV tức thì
                </span>
              </h1>
            </div>

            {/* Description */}
            <p className="mt-5 max-w-2xl mx-auto text-base leading-relaxed text-muted-foreground md:text-lg">
              NextStep mô phỏng phỏng vấn thật, chấm điểm chuẩn theo ATS, gợi ý
              cải thiện cụ thể và tối ưu CV theo đúng công việc bạn mong ước.
            </p>

            {/* CTAs */}
            <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
              <Button
                size="lg"
                className="h-12 px-6 rounded-2xl 
              bg-gradient-to-r from-red-500 via-rose-500 to-pink-500 
              text-white font-medium
              shadow-lg shadow-red-500/25
              transition-all duration-300
              hover:shadow-xl hover:shadow-red-500/40 hover:-translate-y-0.5
              active:scale-[0.98]"
                asChild
              >
                <Link href="/app">
                  Phỏng vấn thử với AI miễn phí
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>

              <Button
                size="lg"
                variant="outline"
                className="h-12 rounded-2xl px-6 transition-transform hover:-translate-y-0.5"
                asChild
              >
                <Link href="/app">Nhận feedback CV ngay</Link>
              </Button>
            </div>

            {/* Mini pills (equal height + aligned) */}
            <div className="mt-8 grid gap-3 sm:grid-cols-3">
              <MiniPill
                icon={ShieldCheck}
                title="Phỏng vấn với AI"
                desc="Bắt đầu miễn phí"
              />
              <MiniPill
                icon={Zap}
                title="Phản hồi nhanh"
                desc="Trả kết quả trong vài phút"
              />
              <MiniPill
                icon={Star}
                title="Chuẩn tuyển dụng"
                desc="Theo JD & rubric"
              />
            </div>
          </div>

          {/* Divider */}
          <div className="mx-auto mt-10 max-w-5xl">
            <div className="h-px w-full bg-border/60" />
          </div>
        </div>
      </div>
    </section>
  );
}

function MiniPill({
  icon: Icon,
  title,
  desc,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  desc: string;
}) {
  return (
    <div className="flex h-full items-center gap-3 rounded-2xl border bg-background/60 p-3 shadow-sm">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl border bg-background">
        <Icon className="h-4 w-4 text-primary" />
      </div>

      <div className="min-w-0 text-left leading-tight">
        <div className="text-sm font-medium truncate">{title}</div>
        <div className="text-xs text-muted-foreground truncate">{desc}</div>
      </div>
    </div>
  );
}

function Features() {
  const features = [
    {
      title: "AI Mock Interview Practice",
      Icon: SpeechIcon,
      // Tailwind classes for color + subtle background
      colorClass: "text-rose-500 bg-rose-500/10",
      description:
        "Mô phỏng phỏng vấn hành vi & kỹ thuật với phản hồi chi tiết.",
      bullets: [
        "AI hỏi follow-up theo ngữ cảnh và kiểm tra depth của câu trả lời",
        "Chấm điểm theo rubric: cấu trúc, impact, ngôn ngữ",
        "Gợi ý sửa ngay phần mở đầu, kết luận và metrics",
      ],
    },
    {
      title: "CV Matching & Scoring",
      Icon: FileSlidersIcon,
      colorClass: "text-indigo-500 bg-indigo-500/10",
      description: "So khớp CV với JD để tối ưu ATS và tăng tỉ lệ callback.",
      bullets: [
        "Phân tích keyword match & đề xuất từ khóa liên quan",
        "Rewrite bullet points theo impact + metrics",
        "Score tổng quan và checklist hành động cụ thể",
      ],
    },
    {
      title: "Job Description Deep Dive",
      Icon: FileSearch,
      colorClass: "text-emerald-500 bg-emerald-500/10",
      description:
        "Bóc tách JD thành các kỹ năng & câu hỏi thực tế để luyện đúng trọng tâm.",
      bullets: [
        "Tự động trích xuất kỹ năng, trách nhiệm và mức độ ưu tiên",
        "Sinh checklist luyện tập + câu hỏi khả dĩ gặp",
        "Map kỹ năng từ JD sang phần CV để tối ưu độ phù hợp",
      ],
    },
  ];

  return (
    <section id="features" className="py-14 md:py-16">
      <div className="container mx-auto px-4">
        <div className="mx-auto mb-10 max-w-2xl text-center">
          <h2 className="text-2xl font-semibold tracking-tight md:text-3xl bg-gradient-to-r from-rose-500 via-purple-500 to-sky-400 bg-clip-text text-transparent">
            3 công cụ cốt lõi — tập trung vào kết quả
          </h2>
          <p className="mt-3 text-muted-foreground">
            Không rườm rà. Chỉ những thứ trực tiếp tăng callback và tỷ lệ pass
            interview.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {features.map((f) => (
            <Card
              key={f.title}
              className="group rounded-3xl border bg-card/60 shadow-sm transition-transform duration-400 hover:-translate-y-2 hover:shadow-2xl hover:bg-card/80"
            >
              <CardHeader className="pb-3">
                <div
                  className={`flex h-12 w-12 items-center justify-center rounded-2xl border shadow-sm transition-colors duration-300 ${f.colorClass}`}
                >
                  <f.Icon className="h-6 w-6" />
                </div>
                <CardTitle className="mt-4 text-xl">{f.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {f.description}
                </p>

                <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
                  {f.bullets.map((b) => (
                    <li key={b} className="flex items-start gap-2">
                      <span className="mt-1 inline-flex h-3 w-3 shrink-0 items-center justify-center rounded-full bg-muted/60 text-muted-foreground text-[10px]">
                        ✓
                      </span>
                      <span>{b}</span>
                    </li>
                  ))}
                </ul>

                <div className="mt-5 inline-flex items-center text-sm font-medium text-foreground/80 transition-transform duration-300 group-hover:translate-x-2">
                  Xem chi tiết <ArrowRight className="ml-2 h-4 w-4" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}

function DetailedFeatures() {
  return (
    <section className="py-16 md:py-20">
      <div className="container mx-auto px-4">
        <div className="mb-12 flex flex-col items-center text-center">
          <h3 className="text-3xl font-semibold tracking-tight md:text-4xl">
            Trải nghiệm “xịn” như một{" "}
            <span className="bg-gradient-to-r from-emerald-400 via-sky-500 to-indigo-600 bg-clip-text text-transparent">
              mentor thật
            </span>
          </h3>
          <p className="mt-3 max-w-2xl text-muted-foreground">
            Từ luyện phỏng vấn, tối ưu CV đến phân tích JD — mọi thứ được đóng
            gói thành workflow rõ ràng để bạn tiến bộ nhanh.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-12">
          {/* AI Mock Interview (balanced) */}
          <Card className="rounded-3xl border bg-card/60 shadow-sm lg:col-span-6 transition-all duration-300 hover:-translate-y-1 hover:bg-card/80 hover:shadow-xl overflow-hidden">
            <CardContent className="p-6 md:p-7">
              <div className="relative">
                {/* subtle accent stripe */}
                <div className="absolute -left-6 top-6 h-20 w-1 rounded-full bg-gradient-to-b from-rose-400 via-pink-500 to-indigo-600 opacity-90" />

                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="inline-flex items-center gap-2 rounded-full border bg-background/70 px-3 py-1 text-xs font-medium text-rose-600">
                      <SpeechIcon className="h-3.5 w-3.5" />
                      AI Mock Interview
                    </div>

                    <h4 className="mt-4 text-xl font-semibold md:text-2xl bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 via-rose-500 to-amber-400">
                      Luyện như thật — feedback rõ & dùng được ngay
                    </h4>

                    <p className="mt-3 text-sm leading-relaxed text-muted-foreground md:text-base">
                      Mô phỏng theo format interview thật: hỏi follow-up, chấm
                      theo rubric, và gợi ý sửa câu trả lời để bạn tiến bộ sau
                      mỗi vòng luyện.
                    </p>

                    {/* score */}
                    <div className="mt-5 rounded-2xl border bg-background/70 p-4">
                      {" "}
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">
                          Rubric score
                        </span>
                        <span className="font-medium text-foreground">
                          78 / 100
                        </span>
                      </div>
                      <div className="mt-2 h-2.5 w-full overflow-hidden rounded-full bg-muted">
                        <div
                          className="h-2.5 rounded-full"
                          style={{
                            width: "78%",
                            background:
                              "linear-gradient(90deg, #fb7185 0%, #f97316 45%, #60a5fa 100%)",
                          }}
                        />
                      </div>
                      {/* pills (consistent colors & spacing) */}
                      <div className="mt-3 flex flex-wrap gap-2 text-xs">
                        <span className="rounded-full bg-rose-50 px-2.5 py-1 text-rose-700">
                          Structure: Good
                        </span>
                        <span className="rounded-full bg-amber-50 px-2.5 py-1 text-amber-700">
                          Clarity: Strong
                        </span>
                        <span className="rounded-full bg-sky-50 px-2.5 py-1 text-sky-700">
                          Impact: Add metrics
                        </span>
                      </div>
                    </div>

                    {/* feedback lines (NO boxes, no overflow) */}
                    <div className="mt-4 rounded-xl bg-primary/5 p-3">
                      <div className="text-sm font-medium text-foreground">
                        Nhận xét nhanh
                      </div>
                      <ul className="mt-2 space-y-2 text-sm text-muted-foreground">
                        <li className="flex items-start gap-2">
                          <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-rose-500" />
                          Câu trả lời có cấu trúc tốt nhưng thiếu “hook” mở đầu.
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-500" />
                          Thêm 1–2 số liệu (metrics) để tăng độ thuyết phục.
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-sky-500" />
                          Kết thúc bằng “result/impact” rõ ràng theo STAR.
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* CV Matching (balanced) */}
          <Card className="rounded-3xl border bg-card/60 shadow-sm lg:col-span-6 transition-all duration-300 hover:-translate-y-1 hover:bg-card/80 hover:shadow-xl">
            <CardContent className="p-6 md:p-7">
              <div className="inline-flex items-center gap-2 rounded-full border bg-background/70 px-3 py-1 text-xs font-medium text-violet-700">
                <FileSlidersIcon className="h-3.5 w-3.5 text-primary" />
                CV Matching & Scoring
              </div>

              <h4 className="mt-4 text-xl font-semibold md:text-2xl bg-clip-text text-transparent bg-gradient-to-r from-indigo-500 via-violet-500 to-pink-500">
                ATS-ready, recruiter-friendly
              </h4>

              <p className="mt-3 text-sm leading-relaxed text-muted-foreground md:text-base">
                Chấm điểm CV theo JD, gợi ý keyword và rewrite bullet points để
                tăng tỷ lệ được gọi.
              </p>

              <div className="mt-5 rounded-2xl border bg-background/70 p-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-foreground">
                    Resume Score
                  </span>
                  <span className="text-sm text-muted-foreground">87%</span>
                </div>

                <div className="mt-3 h-2.5 w-full rounded-full bg-muted overflow-hidden">
                  <div className="h-2.5 w-[87%] rounded-full bg-gradient-to-r from-emerald-400 to-sky-500" />
                </div>

                <div className="mt-4 space-y-2">
                  {[
                    ["ATS Compatibility", "Excellent", "emerald"],
                    ["Keyword Match", "92%", "sky"],
                    ["Impact Statements", "Good", "violet"],
                  ].map(([k, v, tone]) => (
                    <div
                      key={k}
                      className="flex items-center justify-between rounded-xl bg-muted/60 px-3 py-2 text-xs"
                    >
                      <span className="text-muted-foreground">{k}</span>
                      <span
                        className={[
                          "font-medium",
                          tone === "emerald" && "text-emerald-700",
                          tone === "sky" && "text-sky-700",
                          tone === "violet" && "text-violet-700",
                        ]
                          .filter(Boolean)
                          .join(" ")}
                      >
                        {v}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="mt-4 rounded-xl bg-primary/5 p-3">
                  <div className="text-xs font-medium text-primary">
                    Gợi ý nhanh
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Thêm 2 bullet có số liệu + đưa keyword “must-have” lên phần
                    đầu mô tả kinh nghiệm.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Technical Prep (full width) */}
          {/* <Card className="rounded-3xl border bg-card/60 shadow-sm lg:col-span-12 transition-all duration-300 hover:-translate-y-1 hover:bg-card/80 hover:shadow-xl">
            <CardContent className="p-6 md:p-7">
              <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
                <div className="max-w-2xl">
                  <div className="inline-flex items-center gap-2 rounded-full border bg-background/70 px-3 py-1 text-xs font-medium text-muted-foreground">
                    <BookOpenCheckIcon className="h-3.5 w-3.5 text-primary" />
                    Technical Interview Prep
                  </div>

                  <h4 className="mt-4 text-xl font-semibold md:text-2xl">
                    Luyện technical đúng pattern công ty hỏi
                  </h4>

                  <p className="mt-3 text-sm leading-relaxed text-muted-foreground md:text-base">
                    Practice bài tập + giải thích rõ ràng, gợi ý khi bí và chỉ
                    ra lỗi tư duy để bạn cải thiện nhanh.
                  </p>
                </div>

                <div className="grid gap-3 sm:grid-cols-3">
                  {[
                    {
                      t: "1000+ bài curated",
                      d: "Bài tập theo topic & level.",
                      badge: "bg-emerald-50 text-emerald-700",
                    },
                    {
                      t: "Hints thông minh",
                      d: "Gợi ý đúng lúc, không spoil.",
                      badge: "bg-sky-50 text-sky-700",
                    },
                    {
                      t: "Step-by-step",
                      d: "Giải thích rõ tư duy & độ phức tạp.",
                      badge: "bg-violet-50 text-violet-700",
                    },
                  ].map((x) => (
                    <div
                      key={x.t}
                      className="rounded-2xl border bg-background/70 p-4"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="text-sm font-medium">{x.t}</div>
                        <span
                          className={[
                            "rounded-full px-2 py-1 text-[11px] font-medium",
                            x.badge,
                          ].join(" ")}
                        >
                          ✓
                        </span>
                      </div>
                      <div className="mt-2 text-xs text-muted-foreground">
                        {x.d}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card> */}
        </div>

        <div className="mt-10 flex justify-center">
          <Button
            size="lg"
            className="
  h-12 px-6 rounded-2xl
  text-white font-medium
  bg-gradient-to-r from-red-600 via-red-500 to-rose-500
  shadow-lg shadow-red-500/30
  transition-all duration-300
  hover:shadow-xl hover:shadow-red-500/50
  hover:-translate-y-0.5
  active:scale-[0.97]
  "
            asChild
          >
            <Link href="/app">
              Bắt đầu luyện miễn phí ngay
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}

function Stats() {
  const stats = [
    {
      value: "2.3x",
      colorClass: "text-rose-500",
      label: "Tăng tốc đạt offer",
      description:
        "Người dùng NextStep tìm được offer nhanh hơn trung bình ngành (4–6 tuần so với 12+ tuần).",
    },
    {
      value: "65%",
      colorClass: "text-amber-500",
      label: "Giảm số vòng phỏng vấn",
      description:
        "Trung bình cần ít vòng phỏng vấn hơn để nhận offer — tiết kiệm thời gian và công sức.",
    },
    {
      value: "89%",
      colorClass: "text-emerald-500",
      label: "Tỷ lệ thành công phỏng vấn",
      description:
        "Tỷ lệ người dùng hoàn thành chương trình và nhận offer cao.",
    },
    {
      value: "₫15M+",
      colorClass: "text-sky-500",
      label: "Tăng lương khởi điểm",
      description:
        "Người dùng báo cáo mức lương khởi điểm cao hơn nhờ tối ưu CV và kỹ năng thương lượng.",
    },
  ];

  return (
    <section className="py-20 bg-muted/30">
      <div className="container">
        <div className="mx-auto mb-12 max-w-2xl text-center">
          <h3 className="text-3xl font-semibold tracking-tight md:text-4xl">
            Kết quả thực tế —{" "}
            <span className="bg-gradient-to-r from-yellow-400 via-pink-500 to-indigo-500 bg-clip-text text-transparent">
              không chỉ lời hứa
            </span>
          </h3>
          <p className="mt-3 text-muted-foreground">
            Dưới đây là một vài con số nổi bật từ cộng đồng NextStep sau khi sử
            dụng sản phẩm.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {stats.map((stat, index) => (
            <div
              key={index}
              className="relative text-center p-6 rounded-2xl bg-card/60 backdrop-blur-sm border border-border/50 hover:bg-card/80 transition-transform duration-300 hover:-translate-y-2 overflow-hidden"
            >
              {/* colored accent */}
              <div
                className={`absolute -top-3 left-1/2 -translate-x-1/2 h-1.5 w-24 rounded-full bg-gradient-to-r ${stat.colorClass} from-current/80 to-current/40 opacity-90`}
                style={{ filter: "saturate(1.2)" }}
              />
              <div
                className={`text-4xl sm:text-5xl font-bold mb-2 ${stat.colorClass}`}
              >
                {stat.value}
              </div>
              <div className="text-lg font-semibold text-foreground mb-3">
                {stat.label}
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {stat.description}
              </p>
            </div>
          ))}
        </div>

        <div className="mt-10 flex justify-center">
          <Button
            size="lg"
            className=" h-12 px-6 rounded-2xl
  text-white font-medium
  bg-gradient-to-r from-red-600 via-red-500 to-rose-500
  shadow-lg shadow-red-500/30
  transition-all duration-300
  hover:shadow-xl hover:shadow-red-500/50
  hover:-translate-y-0.5
  active:scale-[0.97]
  "
            asChild
          >
            <Link href="/app">
              Tham gia cùng mọi người <span className="ml-2">→</span>
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}

function Testimonials() {
  const testimonials = [
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
  ];

  return (
    <section id="reviews" className="py-16 md:py-20">
      <div className="container mx-auto px-4">
        <div className="mx-auto mb-12 max-w-2xl text-center">
          <h3 className="text-3xl font-semibold tracking-tight md:text-4xl ">
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

        <div className="grid gap-6 md:grid-cols-3">
          {testimonials.map((t, i) => (
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
                    <Star key={idx} className="h-4 w-4 text-primary" />
                  ))}
                  <span className="ml-2 text-xs text-muted-foreground">
                    Hired in {t.timeToOffer}
                  </span>
                </div>

                <blockquote className="mt-4 text-sm leading-relaxed text-muted-foreground">
                  “{t.content}”
                </blockquote>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="mt-10 text-center">
          <Button
            size="lg"
            className="h-12 rounded-2xl px-8 transform transition-all duration-300 hover:scale-105"
            asChild
          >
            <Link href="/app">
              Viết câu chuyện của bạn <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}

function Pricing() {
  const plans = [
    {
      name: "Free",
      price: "0đ",
      period: "",
      description: "Dành cho người mới bắt đầu muốn thử sản phẩm trước.",
      badge: "Miễn phí",
      icon: Sparkles,
      highlight: false,
      cta: "Dùng miễn phí",
      href: "/app",
      features: [
        "Chấm điểm CV 3 ngày/lần",
        "Feedback CV cơ bản",
        "Gợi ý keyword đơn giản theo JD",
        "Phù hợp để trải nghiệm sản phẩm",
      ],
    },
    {
      name: "Start",
      price: "399k",
      period: "/tháng",
      description:
        "Gói phù hợp nhất để tối ưu CV và tăng cơ hội được gọi phỏng vấn.",
      badge: "Phổ biến nhất",
      icon: Rocket,
      highlight: true,
      cta: "Chọn gói Start",
      href: "/checkout?plan=start&billing=monthly&price=399000",
      features: [
        "Chấm điểm CV không giới hạn",
        "Sửa CV bằng AI",
        "100 lượt sử dụng/tháng",
        "Feedback chi tiết, actionable",
        "Tối ưu CV theo JD cụ thể",
      ],
    },
    {
      name: "Premium",
      price: "799k",
      period: "/tháng",
      description:
        "Dành cho người nghiêm túc muốn luyện toàn diện từ CV đến phỏng vấn.",
      badge: "Nổi bật",
      icon: Crown,
      highlight: false,
      cta: "Nâng cấp Premium",
      href: "/checkout?plan=premium&billing=monthly&price=799000",
      features: [
        "Tất cả tính năng của Start",
        "Mock Interview 10 lần/tháng",
        "Feedback nâng cao cho câu trả lời",
        "Lưu lịch sử và theo dõi tiến bộ",
        "Ưu tiên trải nghiệm tính năng mới",
      ],
    },
  ];

  return (
    <section
      id="pricing"
      className="relative overflow-hidden bg-muted/20 py-16 md:py-20"
    >
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute left-1/2 top-0 h-72 w-72 -translate-x-1/2 rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute bottom-0 right-0 h-64 w-64 rounded-full bg-fuchsia-500/10 blur-3xl" />
      </div>

      <div className="container mx-auto px-4">
        <div className="mx-auto max-w-3xl text-center">
          <h3 className="mt-4 text-3xl font-semibold tracking-tight md:text-4xl">
            Chọn gói giúp bạn{" "}
            <span className="bg-gradient-to-r from-red-600 via-rose-500 to-fuchsia-500 bg-clip-text text-transparent">
              tăng cơ hội được gọi phỏng vấn
            </span>
          </h3>

          <p className="mt-3 text-muted-foreground md:text-base">
            Bắt đầu miễn phí, nâng cấp khi bạn cần tối ưu CV mạnh hơn hoặc luyện
            phỏng vấn nghiêm túc hơn.
          </p>
        </div>

        <div className="mx-auto mt-12 grid max-w-6xl items-stretch gap-6 md:grid-cols-3">
          {plans.map((plan) => {
            const Icon = plan.icon;
            const isPremium = plan.name === "Premium";

            return (
              <Card
                key={plan.name}
                className={[
                  "relative flex h-full flex-col overflow-hidden rounded-3xl transition-all duration-300",
                  isPremium
                    ? "border-0 bg-gradient-to-br from-rose-500/30 via-fuchsia-500/25 to-amber-400/30 p-[1px] shadow-xl shadow-rose-500/10"
                    : plan.highlight
                      ? "border-primary bg-background/85 shadow-lg shadow-primary/10 ring-1 ring-primary/15 md:scale-[1.03]"
                      : "border-border/70 bg-background/80 shadow-sm",
                  "hover:-translate-y-1 hover:shadow-xl",
                ].join(" ")}
              >
                <div className="flex h-full flex-col rounded-[calc(1.5rem-1px)] bg-background/90 backdrop-blur-xl">
                  {plan.highlight && !isPremium && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <div className="rounded-full bg-primary px-3 py-1 text-xs font-medium text-primary-foreground shadow-md">
                        {plan.badge}
                      </div>
                    </div>
                  )}

                  {isPremium && (
                    <div className="absolute right-4 top-4">
                      <div className="rounded-full bg-gradient-to-r from-pink-500 to-amber-400 px-3 py-1 text-xs font-medium text-white shadow-md">
                        {plan.badge}
                      </div>
                    </div>
                  )}

                  <CardHeader className="pb-4 pt-6">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div
                          className={[
                            "flex h-11 w-11 items-center justify-center rounded-2xl border",
                            isPremium
                              ? "border-pink-500/20 bg-gradient-to-br from-pink-500/15 to-amber-400/15 text-pink-500"
                              : plan.highlight
                                ? "border-primary/20 bg-primary/10 text-primary"
                                : "border-border bg-muted text-foreground",
                          ].join(" ")}
                        >
                          <Icon className="h-5 w-5" />
                        </div>

                        <div>
                          <CardTitle className="text-xl">{plan.name}</CardTitle>
                          {!plan.highlight && !isPremium && (
                            <p className="mt-1 text-xs text-muted-foreground">
                              {plan.badge}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="mt-6">
                      <div className="flex items-end gap-1">
                        <span
                          className={[
                            "text-4xl font-extrabold tracking-tight",
                            isPremium
                              ? "bg-gradient-to-r from-pink-500 via-purple-500 to-amber-400 bg-clip-text text-transparent"
                              : "",
                          ].join(" ")}
                        >
                          {plan.price}
                        </span>

                        {plan.period && (
                          <span className="pb-1 text-sm text-muted-foreground">
                            {plan.period}
                          </span>
                        )}
                      </div>

                      <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                        {plan.description}
                      </p>
                    </div>
                  </CardHeader>

                  <CardContent className="flex flex-1 flex-col">
                    <div>
                      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                        Bao gồm
                      </p>

                      <ul className="mt-4 space-y-3">
                        {plan.features.map((feature) => (
                          <FeatureItem key={feature} highlight={isPremium}>
                            {feature}
                          </FeatureItem>
                        ))}
                      </ul>
                    </div>

                    <div className="mt-6 flex-1" />

                    <Button
                      asChild
                      className={[
                        "h-12 w-full rounded-2xl text-sm font-medium transition-all",
                        isPremium
                          ? "bg-gradient-to-r from-pink-500 via-purple-500 to-amber-400 text-white shadow-lg shadow-pink-500/25 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-pink-500/35 mb-6"
                          : plan.highlight
                            ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20 hover:bg-primary/90"
                            : "bg-foreground text-background hover:opacity-90",
                      ].join(" ")}
                    >
                      <Link href={plan.href}>{plan.cta}</Link>
                    </Button>
                  </CardContent>
                </div>
              </Card>
            );
          })}
        </div>

        <div className="mx-auto mt-8 max-w-3xl text-center">
          <p className="text-sm text-muted-foreground">
            Start phù hợp để tối ưu CV và tăng callback. Premium phù hợp khi bạn
            muốn vừa tối ưu CV vừa luyện mock interview một cách nghiêm túc.
          </p>
        </div>
      </div>
    </section>
  );
}

function FeatureItem({
  children,
  highlight = false,
}: {
  children: React.ReactNode;
  highlight?: boolean;
}) {
  return (
    <li className="flex items-start gap-3">
      <span
        className={[
          "mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full",
          highlight
            ? "bg-gradient-to-r from-pink-500 to-amber-400 text-white"
            : "bg-primary/10 text-primary",
        ].join(" ")}
      >
        <Check className="h-3.5 w-3.5" />
      </span>

      <span className="text-sm leading-relaxed text-foreground/85">
        {children}
      </span>
    </li>
  );
}

function FAQ() {
  const faqs = [
    {
      q: "Mình có thể dùng miễn phí không?",
      a: "Có. Bạn có thể bắt đầu với các trải nghiệm cơ bản và nâng cấp khi cần nhiều lượt luyện/feedback hơn.",
    },
    {
      q: "NextStep phù hợp ai nhất?",
      a: "Sinh viên năm cuối, fresher hoặc người đang chuẩn bị apply internship/full-time muốn tăng tỷ lệ được gọi phỏng vấn và tự tin hơn khi phỏng vấn thật.",
    },
    {
      q: "Feedback CV dựa trên gì?",
      a: "Dựa trên job description bạn upload, keyword ATS, độ rõ ràng của bullet points, impact/metrics và mức độ phù hợp với role.",
    },
    {
      q: "Có hỗ trợ ngành ngoài IT không?",
      a: "Có thể. Nhưng hiện tối ưu nhất cho các role công nghệ và các vị trí có JD rõ ràng theo kỹ năng.",
    },
  ];

  return (
    <section id="faq" className="py-16 md:py-20">
      <div className="container mx-auto px-4">
        <div className="mx-auto mb-10 max-w-2xl text-center">
          <h3 className="text-3xl font-semibold tracking-tight md:text-4xl bg-gradient-to-r from-teal-400 via-cyan-500 to-sky-600 bg-clip-text text-transparent">
            FAQ
          </h3>
          <p className="mt-3 text-muted-foreground">
            Một vài câu hỏi thường gặp trước khi bạn bắt đầu.
          </p>
        </div>

        <div className="mx-auto grid max-w-4xl gap-4 md:grid-cols-2">
          {faqs.map((f) => (
            <Card
              key={f.q}
              className="rounded-3xl border bg-card/60 shadow-sm transition-transform duration-300 hover:-translate-y-2"
            >
              <CardContent className="p-6">
                <div className="text-base font-semibold">{f.q}</div>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {f.a}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="mt-10 flex justify-center">
          <Button
            variant="outline"
            className="h-11 rounded-2xl px-6 transform transition-all duration-300 hover:scale-105"
            asChild
          >
            <Link href="/app">
              Vào dashboard để bắt đầu <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="border-t bg-background/60">
      <div className="container mx-auto px-4">
        <div className="flex flex-col gap-6 py-10 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-2">
            <Image
              src="/logo.png"
              alt="NextStep logo"
              width={28}
              height={28}
              className="rounded-md object-contain"
            />
            <div>
              <div className="font-semibold">NextStep</div>
              <div className="text-sm text-muted-foreground">
                AI-powered job prep for students & freshers
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-5 text-sm">
            <a
              href="#pricing"
              className="text-muted-foreground hover:text-foreground"
            >
              Bảng giá
            </a>
            <a
              href="#reviews"
              className="text-muted-foreground hover:text-foreground"
            >
              Đánh giá
            </a>
            <a
              href="#faq"
              className="text-muted-foreground hover:text-foreground"
            >
              FAQ
            </a>
            <Link
              href="/app"
              className="text-muted-foreground hover:text-foreground"
            >
              Dashboard
            </Link>
          </div>
        </div>

        <div className="pb-10 text-xs text-muted-foreground">
          © {new Date().getFullYear()} NextStep. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
