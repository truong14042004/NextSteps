"use client";

import { motion } from "framer-motion";
import { SpeechIcon, FileSlidersIcon, BookOpenCheck, ArrowRight, Clock, CheckCircle2, Circle } from "lucide-react";
import Link from "next/link";

export function FeaturesClient() {
  return (
    <section id="features" className="py-24 bg-slate-950 relative overflow-hidden">
      <div className="container mx-auto px-4 relative z-10">
        <div className="mb-20 text-center">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-3xl font-bold tracking-tight md:text-5xl bg-gradient-to-r from-indigo-400 via-fuchsia-500 to-rose-400 bg-clip-text text-transparent"
          >
            Sản phẩm cốt lõi
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="mt-4 text-slate-400 max-w-2xl mx-auto text-lg"
          >
            Trải nghiệm "xịn" như một mentor thật với workflow rõ ràng giúp bạn tiến bộ nhanh nhất.
          </motion.p>
        </div>

        <div className="space-y-12">
          {/* AI Mock Interview Card */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
            className="group relative rounded-3xl border border-white/10 bg-white/5 p-8 shadow-2xl backdrop-blur-md overflow-hidden hover:bg-white/10 transition-colors"
          >
            {/* Glow effect on hover */}
            <div className="absolute inset-0 bg-gradient-to-r from-rose-500/0 via-rose-500/10 to-indigo-500/0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />

            <div className="grid lg:grid-cols-2 gap-12 items-center relative z-10">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full border border-rose-500/30 bg-rose-500/10 px-3 py-1 text-xs font-medium text-rose-300">
                  <SpeechIcon className="h-3.5 w-3.5" />
                  AI Mock Interview
                </div>
                <h3 className="mt-6 text-3xl font-bold text-white leading-tight">
                  Luyện như thật — <br />
                  <span className="bg-gradient-to-r from-rose-400 to-indigo-400 bg-clip-text text-transparent">
                    feedback rõ & dùng được ngay
                  </span>
                </h3>
                <p className="mt-4 text-slate-400 leading-relaxed">
                  Mô phỏng theo format interview thật: hỏi follow-up, chấm theo rubric, và gợi ý sửa câu trả lời để bạn tiến bộ sau mỗi vòng luyện.
                </p>
                <Link
                  href="/app"
                  className="mt-8 inline-flex items-center text-sm font-medium text-rose-400 hover:text-rose-300 transition-colors group-hover:translate-x-2 duration-300"
                >
                  Bắt đầu luyện tập <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </div>

              {/* Product Demo UI */}
              <div className="relative rounded-2xl border border-white/10 bg-slate-900/80 p-6 shadow-xl">
                {/* Conversation UI */}
                <div className="space-y-6">
                  {/* AI Message */}
                  <div className="flex gap-4">
                    <div className="h-10 w-10 shrink-0 rounded-full bg-gradient-to-br from-indigo-500 to-rose-500 flex items-center justify-center p-0.5">
                      <div className="h-full w-full bg-slate-900 rounded-full flex items-center justify-center">
                        <SpeechIcon className="h-4 w-4 text-white" />
                      </div>
                    </div>
                    <div className="rounded-2xl rounded-tl-none bg-white/5 border border-white/10 p-4">
                      <p className="text-sm text-slate-300">Tell me about a time you faced a difficult technical challenge.</p>
                      {/* Waveform */}
                      <div className="mt-3 flex items-center gap-1 h-8">
                        {[...Array(15)].map((_, i) => (
                          <motion.div
                            key={i}
                            animate={{ height: [8, Math.random() * 20 + 8, 8] }}
                            transition={{ duration: 0.8, repeat: Infinity, delay: Math.random() * 0.5 }}
                            className="w-1 rounded-full bg-rose-500/50"
                          />
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* User Message */}
                  <div className="flex gap-4 flex-row-reverse">
                    <div className="h-10 w-10 shrink-0 rounded-full bg-slate-800 border border-white/10" />
                    <div className="rounded-2xl rounded-tr-none bg-rose-600/20 border border-rose-500/30 p-4 max-w-[80%]">
                      <p className="text-sm text-slate-300">In my previous role, we had a severe memory leak in our Node.js microservice...</p>
                    </div>
                  </div>

                  {/* Live Scoring */}
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.5 }}
                    className="absolute -bottom-6 -right-6 rounded-xl border border-white/10 bg-slate-900/95 p-4 shadow-2xl backdrop-blur-xl"
                  >
                    <div className="flex items-center gap-4">
                      <div>
                        <div className="text-xs text-slate-400">Current Score</div>
                        <div className="text-2xl font-bold text-emerald-400">85/100</div>
                      </div>
                      <div className="h-10 w-10 rounded-full border-[3px] border-emerald-500/30 border-t-emerald-500 flex items-center justify-center animate-spin" />
                    </div>
                  </motion.div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* CV Matching Card */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="group relative rounded-3xl border border-white/10 bg-white/5 p-8 shadow-2xl backdrop-blur-md overflow-hidden hover:bg-white/10 transition-colors"
          >
            <div className="grid lg:grid-cols-2 gap-12 items-center relative z-10">
              <div className="lg:order-2">
                <div className="inline-flex items-center gap-2 rounded-full border border-indigo-500/30 bg-indigo-500/10 px-3 py-1 text-xs font-medium text-indigo-300">
                  <FileSlidersIcon className="h-3.5 w-3.5" />
                  CV Matching & Scoring
                </div>
                <h3 className="mt-6 text-3xl font-bold text-white leading-tight">
                  ATS-ready, <br />
                  <span className="bg-gradient-to-r from-indigo-400 to-sky-400 bg-clip-text text-transparent">
                    recruiter-friendly
                  </span>
                </h3>
                <p className="mt-4 text-slate-400 leading-relaxed">
                  Chấm điểm CV theo JD, gợi ý keyword và rewrite bullet points để tăng tỷ lệ được gọi.
                </p>
                <Link
                  href="/app"
                  className="mt-8 inline-flex items-center text-sm font-medium text-indigo-400 hover:text-indigo-300 transition-colors group-hover:translate-x-2 duration-300"
                >
                  Tối ưu CV ngay <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </div>

              {/* Product Demo UI */}
              <div className="relative h-[300px] lg:order-1 flex justify-center items-center">
                {/* Resume Panel */}
                <motion.div
                  initial={{ x: -20, rotate: -5 }}
                  whileInView={{ x: 0, rotate: -2 }}
                  className="absolute left-0 w-64 rounded-xl border border-white/10 bg-slate-900 p-4 shadow-xl z-10"
                >
                  <div className="h-3 w-1/2 bg-slate-700 rounded-full mb-4" />
                  <div className="space-y-2">
                    <div className="h-2 w-full bg-slate-800 rounded-full" />
                    <div className="h-2 w-5/6 bg-slate-800 rounded-full" />
                    <div className="h-2 w-4/6 bg-slate-800 rounded-full" />
                  </div>
                </motion.div>

                {/* JD Panel */}
                <motion.div
                  initial={{ x: 20, rotate: 5 }}
                  whileInView={{ x: 0, rotate: 2 }}
                  className="absolute right-0 w-64 rounded-xl border border-white/10 bg-slate-900 p-4 shadow-xl"
                >
                  <div className="h-3 w-1/3 bg-indigo-500/50 rounded-full mb-4" />
                  <div className="space-y-2">
                    <div className="h-2 w-full bg-slate-800 rounded-full" />
                    <div className="h-2 w-full bg-slate-800 rounded-full" />
                    <div className="h-2 w-2/3 bg-slate-800 rounded-full" />
                  </div>
                </motion.div>

                {/* Matching Line & Scanner */}
                <div className="absolute inset-0 flex items-center justify-center z-20">
                  <motion.div
                    animate={{ y: [-50, 50, -50] }}
                    transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                    className="w-full h-1 bg-gradient-to-r from-transparent via-indigo-500 to-transparent shadow-[0_0_15px_rgba(99,102,241,0.8)]"
                  />
                  <div className="absolute h-16 w-16 rounded-full bg-slate-950 border border-indigo-500/50 flex items-center justify-center shadow-[0_0_30px_rgba(99,102,241,0.3)]">
                    <span className="text-lg font-bold text-indigo-400">92%</span>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
          {/* AI Quiz Assessment Card */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, delay: 0.3 }}
            className="group relative rounded-3xl border border-white/10 bg-white/5 p-8 shadow-2xl backdrop-blur-md overflow-hidden hover:-translate-y-1 hover:bg-white/10 transition-all duration-300"
          >
            {/* Blue/purple glow on hover */}
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500/0 via-violet-500/10 to-indigo-500/0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />
            {/* Ambient glow */}
            <div className="absolute -top-24 -right-24 w-64 h-64 bg-blue-500/8 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-16 -left-16 w-48 h-48 bg-violet-500/8 rounded-full blur-3xl pointer-events-none" />

            <div className="grid lg:grid-cols-2 gap-12 items-center relative z-10">
              {/* Left: text content */}
              <div>
                <div className="inline-flex items-center gap-2 rounded-full border border-blue-500/30 bg-blue-500/10 px-3 py-1 text-xs font-medium text-blue-300">
                  <BookOpenCheck className="h-3.5 w-3.5" />
                  AI Quiz Assessment
                </div>

                <h3 className="mt-6 text-3xl font-bold text-white leading-tight">
                  Kiểm tra kiến thức — <br />
                  <span className="bg-gradient-to-r from-blue-400 to-violet-400 bg-clip-text text-transparent">
                    đánh giá thực lực ngay
                  </span>
                </h3>

                <p className="mt-4 text-slate-400 leading-relaxed">
                  Tạo bài kiểm tra cá nhân hoá từ kết quả phân tích CV để đánh giá mức độ sẵn sàng ứng tuyển và kiến thức chuyên môn — bao gồm câu hỏi kỹ thuật, tình huống và định hướng nghề nghiệp.
                </p>

                {/* Badge row */}
                <div className="mt-6 flex flex-wrap gap-2">
                  {[
                    { label: "30 Questions", color: "blue" },
                    { label: "45 Minutes", color: "violet" },
                    { label: "5 Attempts", color: "indigo" },
                    { label: "AI Generated", color: "sky" },
                  ].map(({ label, color }) => (
                    <span
                      key={label}
                      className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium
                        border-${color}-500/30 bg-${color}-500/10 text-${color}-300`}
                    >
                      {label}
                    </span>
                  ))}
                </div>

                <Link
                  href="/app"
                  className="mt-8 inline-flex items-center text-sm font-medium text-blue-400 hover:text-blue-300 transition-colors group-hover:translate-x-2 duration-300"
                >
                  Làm bài kiểm tra <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </div>

              {/* Right: Quiz Demo UI */}
              <div className="relative rounded-2xl border border-white/10 bg-slate-900/80 p-5 shadow-xl overflow-visible">
                {/* Quiz header */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-500/20 text-blue-400">
                      <BookOpenCheck className="h-3.5 w-3.5" />
                    </div>
                    <span className="text-sm font-semibold text-white">AI Quiz Assessment</span>
                  </div>
                  <div className="flex items-center gap-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 px-2.5 py-1 text-xs text-blue-300">
                    <Clock className="h-3 w-3" />
                    24:35
                  </div>
                </div>

                {/* Progress bar */}
                <div className="mb-3">
                  <div className="flex justify-between text-xs text-slate-400 mb-1.5">
                    <span>Quiz Progress</span>
                    <span className="font-medium text-white">18/30</span>
                  </div>
                  <div className="h-1.5 w-full rounded-full bg-white/8 overflow-hidden">
                    <motion.div
                      initial={{ width: "0%" }}
                      whileInView={{ width: "60%" }}
                      transition={{ duration: 1.2, ease: "easeOut", delay: 0.5 }}
                      className="h-full rounded-full bg-gradient-to-r from-blue-500 to-violet-500"
                    />
                  </div>
                </div>

                {/* Score prediction */}
                <div className="mb-4 rounded-xl bg-white/5 border border-white/8 px-4 py-3 flex items-center justify-between">
                  <span className="text-xs text-slate-400">Score Prediction</span>
                  <span className="text-base font-bold text-emerald-400">82%</span>
                </div>

                {/* Topic checklist */}
                <div className="space-y-2">
                  {[
                    { label: "JavaScript", done: true },
                    { label: "React", done: true },
                    { label: "System Design", done: false },
                    { label: "Database", done: true },
                  ].map(({ label, done }) => (
                    <div key={label} className="flex items-center gap-2.5 text-sm">
                      {done
                        ? <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
                        : <Circle className="h-4 w-4 shrink-0 text-slate-600" />
                      }
                      <span className={done ? "text-slate-300" : "text-slate-500"}>{label}</span>
                    </div>
                  ))}
                </div>

                {/* Floating detail chip */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.85 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.6 }}
                  className="absolute -top-5 -right-5 rounded-xl border border-white/10 bg-slate-900/95 px-4 py-2.5 shadow-2xl backdrop-blur-xl text-center"
                >
                  <div className="text-[10px] text-slate-400 mb-0.5 uppercase tracking-wider">Accuracy</div>
                  <div className="text-lg font-bold text-blue-400">88%</div>
                </motion.div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
