import { Button } from "@/components/ui/button";
import { HomeAccountMenu } from "@/components/home/home-account-menu";
import { getCurrentUser } from "@/services/clerk/lib/getCurrentUser";
import { getPlanSummaryForUser } from "@/features/plans/entitlements";
import { Compass } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import {
  listPublicPlanConfigs,
  type AdminPlanConfig,
  formatCompactPlanPrice,
  formatUsageLimit,
} from "@/features/admin/plans";
import { listPublishedReviews } from "@/features/serviceReviews";

import { HeroClient } from "@/components/home/hero-client";
import { FeaturesClient } from "@/components/home/features-client";
import { HowItWorksClient } from "@/components/home/how-it-works-client";
import {
  StatsClient,
  TestimonialsMarquee,
} from "@/components/home/stats-testimonials-client";
import {
  PricingClient,
  FaqClient,
  FooterClient,
} from "@/components/home/pricing-faq-footer-client";

export const dynamic = "force-dynamic";

export default async function LandingPage() {
  const { userId, user } = await getCurrentUser({ allData: true });

  if (user?.role === "recruiter") {
    redirect("/explore");
  }

  const isAdmin = user?.role === "admin";

  const [pricingPlans, publishedReviews] = await Promise.all([
    listPublicPlanConfigs(),
    listPublishedReviews(),
  ]);

  const formattedPlans = pricingPlans.map((plan: AdminPlanConfig) => {
    const isPremium = plan.key === "premium";

    return {
      name: plan.name,
      price: formatCompactPlanPrice(plan.monthlyPrice),
      period: plan.monthlyPrice > 0 ? "/tháng" : "",
      description: plan.description,
      badge:
        isPremium
          ? "Nổi bật"
          : plan.key === "start"
            ? "Phổ biến nhất"
            : "Miễn phí",
      highlight: plan.key === "start",
      isPremium,
      cta:
        plan.monthlyPrice === 0
          ? "Dùng miễn phí"
          : isPremium
            ? "Nâng cấp Premium"
            : `Chọn gói ${plan.name}`,
      href:
        plan.monthlyPrice === 0
          ? "/app"
          : `/checkout?plan=${plan.key}&billing=monthly&price=${plan.monthlyPrice}`,
      features: [
        `Phân tích CV: ${formatUsageLimit(plan.resumeAnalysisLimit)}`,
        `Câu hỏi AI: ${formatUsageLimit(plan.aiQuestionLimit)}`,
        `Mock Interview: ${formatUsageLimit(plan.mockInterviewLimit)}`,
        ...plan.features.filter((f) => f.isEnabled).map((f) => f.label),
      ],
    };
  });

  return (
    <div className="h-full bg-slate-950 text-slate-50 selection:bg-rose-500/30">
      <Navbar isAdmin={isAdmin} />

      <main>
        <HeroClient />
        <HowItWorksClient />
        <FeaturesClient />
        <StatsClient />
        <TestimonialsMarquee reviews={publishedReviews} />
        <PricingClient plans={formattedPlans} />
        <FaqClient />
      </main>

      <FooterClient />
    </div>
  );
}

function Navbar({ isAdmin = false }: { isAdmin?: boolean }) {
  const navLinkClass =
    "inline-flex h-10 items-center gap-1.5 rounded-full px-4 text-sm font-semibold text-slate-300 transition-all duration-200 hover:bg-white/10 hover:text-white";

  return (
    <header className="pointer-events-none fixed left-0 right-0 top-4 z-50">
      <div className="container mx-auto px-4">
        <div className="relative flex h-14 items-center justify-between">
          {/* Left: logo */}
          <Link
            href="/"
            className="pointer-events-auto inline-flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-slate-950/35 shadow-lg shadow-black/20 backdrop-blur-xl transition-all hover:bg-white/10"
          >
            <Image
              src="/logo.png"
              alt="NextStep logo"
              width={34}
              height={34}
              className="object-contain"
              priority
            />
          </Link>

          {/* Middle: floating nav */}
          <nav className="pointer-events-auto hidden items-center gap-1 rounded-full border border-white/10 bg-slate-950/55 px-2 py-1.5 shadow-2xl shadow-black/25 backdrop-blur-2xl md:flex absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
            <Link href="/explore" className={navLinkClass}>
              <Compass className="size-4" />
              Khám phá
            </Link>

            <Link href="/" className={navLinkClass}>
              Trang chủ
            </Link>

            <a href="#features" className={navLinkClass}>
              Tính năng
            </a>

            <a href="#pricing" className={navLinkClass}>
              Bảng giá
            </a>

            <a href="#faq" className={navLinkClass}>
              FAQ
            </a>
          </nav>

          {/* Right: account */}
          <div className="pointer-events-auto flex items-center gap-3 rounded-full border border-white/10 bg-slate-950/35 px-2 py-1.5 shadow-lg shadow-black/20 backdrop-blur-xl">
            <Suspense
              fallback={
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    className="h-10 rounded-full border-white/15 bg-white/5 px-5 text-white hover:bg-white/10"
                  >
                    Đăng nhập
                  </Button>

                  <Button className="h-10 rounded-full bg-rose-600 px-5 text-white hover:bg-rose-500">
                    Đăng ký
                  </Button>
                </div>
              }
            >
              <NavButton />
            </Suspense>
          </div>
        </div>
      </div>
    </header>
  );
}

async function NavButton() {
  const { userId, user } = await getCurrentUser({ allData: true });

  if (!userId || !user) {
    return (
      <div className="flex items-center gap-2">
        <Link href="/sign-in">
          <Button
            variant="outline"
            className="h-10 rounded-full border-white/15 bg-white/5 px-5 text-white hover:bg-white/10"
          >
            Đăng nhập
          </Button>
        </Link>

        <Link href="/sign-up">
          <Button className="h-10 rounded-full bg-rose-600 px-5 text-white hover:bg-rose-500">
            Đăng ký
          </Button>
        </Link>
      </div>
    );
  }

  const plan = await getPlanSummaryForUser(userId);

  return (
    <HomeAccountMenu
      user={{
        name: user.name,
        imageUrl: user.imageUrl,
        role: user.role,
      }}
      plan={plan}
    />
  );
}