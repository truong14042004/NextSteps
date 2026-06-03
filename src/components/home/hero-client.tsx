"use client";

import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Sparkles, ArrowRight, ShieldCheck, Zap, Star } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

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
    <div className="flex h-full items-center gap-3 rounded-2xl border border-white/10 bg-black/20 p-3 shadow-sm backdrop-blur-md">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-white/5">
        <Icon className="h-4 w-4 text-rose-500" />
      </div>
      <div className="min-w-0 text-left leading-tight">
        <div className="text-sm font-medium truncate text-white">{title}</div>
        <div className="text-xs text-white/60 truncate">{desc}</div>
      </div>
    </div>
  );
}

export function HeroClient() {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  return (
    <section className="relative overflow-hidden min-h-screen flex items-center pt-20">
      {/* Spotlight Effect */}
      <div
        className="pointer-events-none fixed inset-0 z-30 transition-opacity duration-300"
        style={{
          background: `radial-gradient(600px circle at ${mousePosition.x}px ${mousePosition.y}px, rgba(255,255,255,0.06), transparent 40%)`,
        }}
      />

      {/* Premium Background */}
      <div className="pointer-events-none absolute inset-0 -z-10 bg-slate-950">
        {/* Animated red gradient mesh */}
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -top-40 left-1/4 h-[40rem] w-[40rem] rounded-full bg-rose-600/20 blur-[100px]"
        />
        <motion.div
          animate={{
            scale: [1, 1.5, 1],
            opacity: [0.2, 0.4, 0.2],
          }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 1 }}
          className="absolute top-40 right-[-10rem] h-[30rem] w-[30rem] rounded-full bg-indigo-600/20 blur-[100px]"
        />
        {/* Neural network lines grid */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]" />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left Column: Text & CTA */}
          <div className="max-w-2xl">
            {/* <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="inline-flex items-center gap-2 rounded-full border border-rose-500/30 bg-rose-500/10 px-4 py-1.5 text-sm font-medium text-rose-300 backdrop-blur-md"
            >
              <Sparkles className="h-4 w-4" />
              AI Career Mentor cho sinh viên & fresher
            </motion.div> */}

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="mt-6 text-4xl font-bold tracking-tight md:text-6xl lg:text-7xl leading-[1.1] text-white"
            >
              Luyện phỏng vấn với AI, <br />
              <span className="bg-gradient-to-r from-rose-400 via-fuchsia-500 to-indigo-500 bg-clip-text text-transparent">
                nhận feedback tức thì
              </span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="mt-6 text-lg md:text-xl text-slate-300 leading-relaxed max-w-lg"
            >
              NextStep mô phỏng phỏng vấn thật, chấm điểm chuẩn theo ATS, gợi ý cải thiện cụ thể và tối ưu CV theo đúng công việc bạn mong ước.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="mt-8 flex flex-col sm:flex-row gap-4"
            >
              <Button
                size="lg"
                className="group relative h-14 overflow-hidden rounded-full bg-rose-600 px-8 text-base font-semibold text-white transition-all hover:bg-rose-500 hover:scale-105 hover:shadow-[0_0_40px_8px_rgba(225,29,72,0.3)]"
                asChild
              >
                <Link href="/app">
                  <span className="relative z-10 flex items-center gap-2">
                    Phỏng vấn thử với AI miễn phí
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </span>
                </Link>
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="h-14 rounded-full border-white/20 bg-white/5 px-8 text-base font-semibold text-white backdrop-blur-md transition-all hover:bg-white/10 hover:scale-105"
                asChild
              >
                <Link href="/app">Nhận feedback CV</Link>
              </Button>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="mt-12 grid grid-cols-2 sm:grid-cols-3 gap-4"
            >
              <MiniPill icon={ShieldCheck} title="Phỏng vấn AI" desc="Miễn phí" />
              <MiniPill icon={Zap} title="Phản hồi nhanh" desc="Trong vài phút" />
              <MiniPill icon={Star} title="Chuẩn ATS" desc="Theo JD & rubric" />
            </motion.div>
          </div>

          {/* Right Column: Dashboard Mockup */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="relative lg:h-[600px] flex items-center justify-center"
          >
            {/* Floating Elements */}
            <div className="absolute inset-0 w-full h-full">
              {/* Central Dashboard Panel */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[340px] md:w-[400px] rounded-3xl border border-white/10 bg-slate-900/60 p-6 shadow-2xl backdrop-blur-2xl">
                <div className="flex items-center gap-4 mb-6">
                  <div className="h-12 w-12 rounded-full bg-rose-500/20 flex items-center justify-center border border-rose-500/30">
                    <div className="h-3 w-3 rounded-full bg-rose-500 animate-pulse" />
                  </div>
                  <div>
                    <div className="text-sm font-medium text-white">AI Interviewer</div>
                    <div className="text-xs text-rose-400 flex items-center gap-1">
                      <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
                      </span>
                      Listening...
                    </div>
                  </div>
                </div>

                {/* Animated Waveform */}
                <div className="flex items-center justify-center gap-1 h-16 mb-6">
                  {[...Array(20)].map((_, i) => (
                    <motion.div
                      key={i}
                      animate={{
                        height: [16, Math.random() * 40 + 16, 16],
                      }}
                      transition={{
                        duration: 0.5 + Math.random() * 0.5,
                        repeat: Infinity,
                        ease: "easeInOut",
                        delay: Math.random() * 0.2,
                      }}
                      className="w-1.5 rounded-full bg-rose-500/80"
                    />
                  ))}
                </div>

                <div className="space-y-4">
                  <div className="rounded-2xl bg-white/5 p-4 border border-white/5">
                    <div className="text-xs text-white/60 mb-1">AI Feedback</div>
                    <div className="text-sm text-white">"That's a great example. Could you add more measurable achievements regarding the user growth?"</div>
                  </div>
                </div>
              </div>

              {/* Floating Cards */}
              <motion.div
                animate={{ y: [-10, 10, -10] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                className="absolute top-[10%] -left-4 md:-left-12 rounded-2xl border border-white/10 bg-white/10 p-4 shadow-xl backdrop-blur-md"
              >
                <div className="text-xs text-white/60">CV Match Score</div>
                <div className="text-3xl font-bold text-emerald-400">87%</div>
              </motion.div>

              <motion.div
                animate={{ y: [10, -10, 10] }}
                transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                className="absolute bottom-[20%] -right-4 md:-right-8 rounded-2xl border border-white/10 bg-white/10 p-4 shadow-xl backdrop-blur-md"
              >
                <div className="text-xs text-white/60">Interview Score</div>
                <div className="text-3xl font-bold text-indigo-400">92%</div>
              </motion.div>

              <motion.div
                animate={{ y: [-5, 5, -5], rotate: [-2, 2, -2] }}
                transition={{ duration: 6, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
                className="absolute top-[20%] -right-2 md:-right-6 rounded-xl border border-white/10 bg-indigo-500/20 px-4 py-2 shadow-xl backdrop-blur-md"
              >
                <div className="text-sm font-medium text-indigo-300">Confidence: High</div>
              </motion.div>

              <motion.div
                animate={{ y: [5, -5, 5], rotate: [2, -2, 2] }}
                transition={{ duration: 4.5, repeat: Infinity, ease: "easeInOut", delay: 1.5 }}
                className="absolute bottom-[10%] -left-2 md:-left-6 rounded-xl border border-white/10 bg-rose-500/20 px-4 py-2 shadow-xl backdrop-blur-md"
              >
                <div className="text-sm font-medium text-rose-300">ATS Optimized</div>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
