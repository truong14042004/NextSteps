"use client";

import { motion } from "framer-motion";
import { Check, ArrowRight } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

export type FormattedPlan = {
  name: string;
  price: string;
  period: string;
  description: string;
  badge: string;
  highlight: boolean;
  isPremium: boolean;
  cta: string;
  href: string;
  features: string[];
};

export function PricingClient({ plans }: { plans: FormattedPlan[] }) {
  // If dbPlans are missing, provide a fallback for demo
  const fallbackPlans = [
    { name: "Free", price: "0đ", period: "", description: "Dành cho người mới bắt đầu muốn thử sản phẩm trước.", badge: "Miễn phí", highlight: false, cta: "Dùng miễn phí", href: "/app", features: ["Chấm điểm CV 3 ngày/lần", "Feedback CV cơ bản", "Gợi ý keyword đơn giản theo JD", "Phù hợp để trải nghiệm sản phẩm"] },
    { name: "Start", price: "399k", period: "/tháng", description: "Gói phù hợp nhất để tối ưu CV và tăng cơ hội được gọi phỏng vấn.", badge: "Phổ biến nhất", highlight: true, cta: "Chọn gói Start", href: "/checkout?plan=start&billing=monthly&price=399000", features: ["Chấm điểm CV không giới hạn", "Sửa CV bằng AI", "100 lượt sử dụng/tháng", "Feedback chi tiết, actionable", "Tối ưu CV theo JD cụ thể"] },
    { name: "Premium", price: "799k", period: "/tháng", description: "Dành cho người nghiêm túc muốn luyện toàn diện từ CV đến phỏng vấn.", badge: "Nổi bật", highlight: false, cta: "Nâng cấp Premium", href: "/checkout?plan=premium&billing=monthly&price=799000", features: ["Tất cả tính năng của Start", "Mock Interview 10 lần/tháng", "Feedback nâng cao cho câu trả lời", "Lưu lịch sử và theo dõi tiến bộ", "Ưu tiên trải nghiệm tính năng mới"] },
  ];

  const renderedPlans = plans && plans.length > 0 ? plans : fallbackPlans.map(p => ({ ...p, isPremium: p.name === "Premium" }));

  return (
    <section id="pricing" className="relative py-24 bg-slate-950 overflow-hidden border-t border-white/5">
      {/* Background glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-3xl h-full pointer-events-none">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-rose-600/10 rounded-full blur-[120px]" />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <div className="text-center mb-16">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-3xl font-bold tracking-tight md:text-5xl text-white"
          >
            Đầu tư cho{" "}
            <span className="bg-gradient-to-r from-rose-400 via-fuchsia-500 to-indigo-500 bg-clip-text text-transparent">
              sự nghiệp của bạn
            </span>
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="mt-4 text-slate-400 max-w-2xl mx-auto"
          >
            Bắt đầu miễn phí, nâng cấp khi bạn cần tối ưu CV mạnh hơn hoặc luyện phỏng vấn nghiêm túc.
          </motion.p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {renderedPlans.map((plan, i) => {
            const isPremium = plan.isPremium;
            const highlight = plan.highlight;

            return (
              <motion.div
                key={plan.name}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className={`group relative rounded-3xl p-px ${
                  isPremium
                    ? "bg-gradient-to-b from-rose-500 via-fuchsia-500 to-indigo-500 shadow-[0_0_40px_rgba(225,29,72,0.2)] hover:shadow-[0_0_60px_rgba(225,29,72,0.4)]"
                    : "bg-white/10 hover:bg-white/20"
                } transition-all duration-300 hover:-translate-y-2`}
              >
                <div className="relative h-full flex flex-col bg-slate-950 rounded-[calc(1.5rem-1px)] p-8">
                  {(highlight || isPremium) && (
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                      <div className={`px-4 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                        isPremium ? "bg-gradient-to-r from-rose-500 to-indigo-500 text-white" : "bg-white/10 text-white backdrop-blur-md border border-white/20"
                      }`}>
                        {plan.badge}
                      </div>
                    </div>
                  )}

                  <div className="mb-8 mt-4">
                    <h3 className="text-xl font-medium text-white mb-4">{plan.name}</h3>
                    <div className="flex items-baseline gap-1">
                      <span className={`text-4xl font-bold ${isPremium ? "bg-gradient-to-r from-rose-400 to-indigo-400 bg-clip-text text-transparent" : "text-white"}`}>
                        {plan.price}
                      </span>
                      {plan.period && <span className="text-slate-400">{plan.period}</span>}
                    </div>
                    <p className="mt-4 text-sm text-slate-400">{plan.description}</p>
                  </div>

                  <ul className="space-y-4 mb-8 flex-1">
                    {plan.features.map((feature, j) => (
                      <li key={j} className="flex items-start gap-3 text-sm text-slate-300">
                        <Check className={`h-5 w-5 shrink-0 ${isPremium ? "text-rose-400" : "text-slate-500"}`} />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <Link
                    href={plan.href}
                    className={`block w-full py-4 text-center rounded-xl font-semibold transition-colors ${
                      isPremium
                        ? "bg-gradient-to-r from-rose-500 to-indigo-500 text-white hover:opacity-90"
                        : highlight
                        ? "bg-white text-slate-900 hover:bg-slate-200"
                        : "bg-white/10 text-white hover:bg-white/20"
                    }`}
                  >
                    {plan.cta}
                  </Link>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

export function FaqClient() {
  const faqs = [
    { q: "Mình có thể dùng miễn phí không?", a: "Có. Bạn có thể bắt đầu với các trải nghiệm cơ bản và nâng cấp khi cần nhiều lượt luyện/feedback hơn." },
    { q: "NextStep phù hợp ai nhất?", a: "Sinh viên năm cuối, fresher hoặc người đang chuẩn bị apply internship/full-time muốn tăng tỷ lệ được gọi phỏng vấn và tự tin hơn khi phỏng vấn thật." },
    { q: "Feedback CV dựa trên gì?", a: "Dựa trên job description bạn upload, keyword ATS, độ rõ ràng của bullet points, impact/metrics và mức độ phù hợp với role." },
    { q: "Có hỗ trợ ngành ngoài IT không?", a: "Có thể. Nhưng hiện tối ưu nhất cho các role công nghệ và các vị trí có JD rõ ràng theo kỹ năng." },
  ];

  return (
    <section id="faq" className="py-24 bg-slate-950 relative border-t border-white/5">
      <div className="container mx-auto px-4 relative z-10">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold tracking-tight md:text-4xl text-white">
            Câu hỏi thường gặp
          </h2>
        </div>
        <div className="max-w-3xl mx-auto space-y-4">
          {faqs.map((faq, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="p-6 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors"
            >
              <h3 className="text-lg font-medium text-white mb-2">{faq.q}</h3>
              <p className="text-slate-400">{faq.a}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function FooterClient() {
  return (
    <footer className="bg-slate-950 border-t border-white/10 relative overflow-hidden">
      {/* Small CTA Banner above Footer */}
      <div className="relative border-b border-white/10">
        <div className="absolute inset-0 bg-gradient-to-r from-rose-500/10 via-fuchsia-500/10 to-indigo-500/10" />
        <div className="container mx-auto px-4 py-16 relative z-10 text-center">
          <h2 className="text-2xl md:text-4xl font-bold text-white mb-6">Ready to land your dream job?</h2>
          <Link
            href="/app"
            className="inline-flex h-14 items-center justify-center rounded-full bg-white px-8 text-sm font-semibold text-slate-900 transition-transform hover:scale-105"
          >
            Start Interview <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12 relative z-10">
        <div className="flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-3">
            <Image src="/logo.png" alt="NextStep" width={32} height={32} className="rounded-md" />
            <div>
              <div className="font-bold text-white text-lg">NextStep</div>
              <div className="text-sm text-slate-400">AI-powered job prep</div>
            </div>
          </div>
          <div className="flex gap-6 text-sm text-slate-400">
            <Link href="#pricing" className="hover:text-white transition-colors">Pricing</Link>
            <Link href="#features" className="hover:text-white transition-colors">Features</Link>
            <Link href="#faq" className="hover:text-white transition-colors">FAQ</Link>
          </div>
        </div>
        <div className="mt-12 text-center text-sm text-slate-500">
          © {new Date().getFullYear()} NextStep. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
