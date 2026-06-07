"use client";

import { motion, useInView } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import Image from "next/image";

function Counter({ from, to, suffix = "", duration = 2 }: { from: number; to: number; suffix?: string; duration?: number }) {
  const [count, setCount] = useState(from);
  const nodeRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(nodeRef, { once: true, margin: "-100px" });

  useEffect(() => {
    if (!isInView) return;

    let startTime: number | null = null;
    const animate = (currentTime: number) => {
      if (!startTime) startTime = currentTime;
      const progress = Math.min((currentTime - startTime) / (duration * 1000), 1);
      // easeOutExpo
      const easeProgress = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
      setCount(Math.floor(easeProgress * (to - from) + from));

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };
    requestAnimationFrame(animate);
  }, [isInView, from, to, duration]);

  return (
    <div ref={nodeRef} className="text-4xl md:text-5xl font-bold">
      {count}{suffix}
    </div>
  );
}

const stats = [
  { value: 1000, suffix: "+", label: "Practice Interviews", color: "text-rose-400" },
  { value: 100, suffix: "+", label: "Students", color: "text-indigo-400" },
  { value: 50, suffix: "+", label: "Interview Templates", color: "text-emerald-400" },
  { value: 95, suffix: "%", label: "Success Satisfaction", color: "text-amber-400" },
];

export function StatsClient() {
  return (
    <section className="py-20 bg-slate-950 relative border-t border-white/5">
      <div className="container mx-auto px-4 relative z-10">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {stats.map((stat, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className="p-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm"
            >
              <div className={`mb-2 ${stat.color}`}>
                <Counter from={0} to={stat.value} suffix={stat.suffix} />
              </div>
              <div className="text-sm font-medium text-slate-400">{stat.label}</div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

// Minimal Testimonial Type assuming standard review schema
type Testimonial = {
  id: string;
  userName?: string;
  authorName?: string;
  authorRole?: string;
  content?: string;
  comment?: string;
  rating: number;
};

export function TestimonialsMarquee({ reviews = [] }: { reviews: any[] }) {
  // If no reviews, provide some placeholders for the demo
  const displayReviews = reviews.length > 0 ? reviews : [
    { id: "1", userName: "Nguyen Van A", authorRole: "Software Engineer", comment: "NextStep giúp tôi tự tin hơn hẳn khi phỏng vấn. Feedback rất sát với thực tế!", rating: 5 },
    { id: "2", userName: "Tran Thi B", authorRole: "Data Analyst", comment: "CV của tôi đã qua vòng screen của MBB nhờ việc tối ưu ATS trên NextStep.", rating: 5 },
    { id: "3", userName: "Le Van C", authorRole: "Frontend Dev", comment: "AI phỏng vấn như thật, thỉnh thoảng hỏi xoáy đáp xoay làm mình quen với áp lực.", rating: 5 },
    { id: "4", userName: "Pham D", authorRole: "Product Manager", comment: "Tuyệt vời! Tôi đã pass phỏng vấn nhờ luyện tập các câu hỏi behavior ở đây.", rating: 5 },
    { id: "5", userName: "Hoang E", authorRole: "Backend Dev", comment: "Chấm điểm CV siêu nhanh và chính xác. Sẽ giới thiệu cho bạn bè.", rating: 4 },
  ];

  return (
    <section className="py-24 bg-slate-950 overflow-hidden">
      <div className="container mx-auto px-4 mb-12 text-center">
        <h2 className="text-3xl font-bold tracking-tight md:text-5xl bg-gradient-to-r from-amber-200 via-yellow-400 to-amber-500 bg-clip-text text-transparent">
          Cộng đồng nói gì về NextStep
        </h2>
      </div>

      <div className="relative w-full flex flex-col gap-6">
        {/* Mask edges for fading effect */}
        <div className="pointer-events-none absolute inset-y-0 left-0 w-1/6 bg-gradient-to-r from-slate-950 to-transparent z-10" />
        <div className="pointer-events-none absolute inset-y-0 right-0 w-1/6 bg-gradient-to-l from-slate-950 to-transparent z-10" />

        {/* Marquee Row */}
        <div className="group flex overflow-hidden w-full">
          <motion.div
            animate={{ x: ["0%", "-50%"] }}
            transition={{ duration: 30, ease: "linear", repeat: Infinity }}
            className="flex gap-6 w-max group-hover:[animation-play-state:paused]"
          >
            {/* Double the list for seamless loop */}
            {[...displayReviews, ...displayReviews].map((review, i) => (
              <div
                key={`${review.id}-${i}`}
                className="w-[350px] shrink-0 rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-md transition-colors hover:bg-white/10"
              >
                <div className="flex gap-1 mb-4 text-amber-400">
                  {[...Array(review.rating || 5)].map((_, idx) => (
                    <svg key={idx} className="w-4 h-4 fill-current" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
                <p className="text-slate-300 text-sm leading-relaxed mb-6">"{review.comment || review.content}"</p>
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-gradient-to-br from-indigo-500 to-rose-500 flex items-center justify-center text-white font-bold">
                    {(review.userName || review.authorName || "U").charAt(0)}
                  </div>
                  <div>
                    <div className="text-sm font-medium text-white">{review.userName || review.authorName || "Người dùng"}</div>
                    <div className="text-xs text-slate-400">{review.authorRole || "Thành viên"}</div>
                  </div>
                </div>
              </div>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  );
}
