"use client";

import { motion } from "framer-motion";
import { Upload, FileSearch, SpeechIcon, MessageSquare } from "lucide-react";

const steps = [
  {
    icon: Upload,
    title: "1. Upload CV & JD",
    description: "Tải lên CV của bạn và mô tả công việc mong muốn. Hệ thống sẽ tự động trích xuất thông tin quan trọng.",
  },
  {
    icon: FileSearch,
    title: "2. Receive Match Score",
    description: "Nhận điểm đánh giá độ phù hợp (ATS score) cùng với gợi ý từ khóa để tối ưu CV ngay lập tức.",
  },
  {
    icon: SpeechIcon,
    title: "3. Start Voice Interview",
    description: "Bắt đầu cuộc phỏng vấn bằng giọng nói với AI. Câu hỏi được cá nhân hóa dựa trên CV và JD của bạn.",
  },
  {
    icon: MessageSquare,
    title: "4. Get Personalized Feedback",
    description: "Nhận phản hồi chi tiết về cấu trúc câu trả lời, độ rõ ràng, và các số liệu cần bổ sung.",
  },
];

export function HowItWorksClient() {
  return (
    <section className="relative py-24 bg-slate-950 overflow-hidden">
      <div className="container mx-auto px-4 relative z-10">
        <div className="text-center mb-20">
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-3xl font-bold tracking-tight md:text-5xl bg-gradient-to-r from-rose-400 via-fuchsia-500 to-indigo-500 bg-clip-text text-transparent"
          >
            HOW IT WORKS
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="mt-4 text-slate-400 max-w-2xl mx-auto"
          >
            Quy trình 4 bước đơn giản giúp bạn tự tin chinh phục mọi buổi phỏng vấn.
          </motion.p>
        </div>

        <div className="relative max-w-4xl mx-auto">
          {/* Glowing Line */}
          <div className="absolute left-[27px] md:left-1/2 top-0 bottom-0 w-[2px] bg-white/10 md:-translate-x-1/2">
            <motion.div
              initial={{ height: 0 }}
              whileInView={{ height: "100%" }}
              viewport={{ once: true }}
              transition={{ duration: 1.5, ease: "easeOut" }}
              className="w-full bg-gradient-to-b from-rose-500 via-fuchsia-500 to-indigo-500 shadow-[0_0_10px_rgba(225,29,72,0.8)]"
            />
          </div>

          <div className="space-y-12 md:space-y-24">
            {steps.map((step, index) => {
              const isEven = index % 2 === 0;
              return (
                <div key={index} className={`relative flex items-center md:justify-between ${isEven ? 'md:flex-row-reverse' : ''}`}>
                  {/* Icon Node */}
                  <div className="absolute left-0 md:left-1/2 md:-translate-x-1/2 flex items-center justify-center w-14 h-14 rounded-full border-4 border-slate-950 bg-slate-900 z-10">
                    <step.icon className="h-6 w-6 text-rose-500" />
                  </div>

                  {/* Empty space for alternating layout */}
                  <div className="hidden md:block w-5/12" />

                  {/* Card */}
                  <motion.div
                    initial={{ opacity: 0, x: isEven ? -50 : 50 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true, margin: "-100px" }}
                    transition={{ duration: 0.6, delay: 0.2 }}
                    className="w-full md:w-5/12 pl-20 md:pl-0"
                  >
                    <div className="p-6 rounded-3xl border border-white/10 bg-white/5 backdrop-blur-md shadow-xl hover:bg-white/10 transition-colors">
                      <h3 className="text-xl font-bold text-white mb-2">{step.title}</h3>
                      <p className="text-slate-400 text-sm leading-relaxed">{step.description}</p>
                    </div>
                  </motion.div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
