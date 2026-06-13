"use client";

import { useState } from "react";
import { LightbulbIcon, ChevronDownIcon, ChevronUpIcon } from "lucide-react";

export function ResumeTipsCard() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="rounded-2xl border border-blue-100 dark:border-blue-900/30 bg-blue-50/40 dark:bg-blue-950/10 p-4 transition-all duration-300 shadow-sm">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-full items-center justify-between text-left focus:outline-none"
      >
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-blue-500/10 dark:bg-blue-500/20 p-2 text-blue-600 dark:text-blue-400">
            <LightbulbIcon className="size-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">
              Mẹo phân tích hiệu quả
            </h3>
            <p className="text-[10px] text-muted-foreground">
              Nhấp để xem hướng dẫn chuẩn bị dữ liệu đầu vào.
            </p>
          </div>
        </div>
        {isOpen ? (
          <ChevronUpIcon className="size-4 text-muted-foreground" />
        ) : (
          <ChevronDownIcon className="size-4 text-muted-foreground" />
        )}
      </button>

      {isOpen && (
        <div className="mt-3 space-y-3 border-t border-blue-100 dark:border-blue-900/20 pt-3 animate-in fade-in slide-in-from-top-1 duration-200">
          <div className="flex gap-2.5">
            <div className="flex size-5 shrink-0 items-center justify-center rounded-full bg-blue-500/10 dark:bg-blue-500/20 text-[10px] font-bold text-blue-700 dark:text-blue-400">
              1
            </div>
            <p className="text-xs leading-relaxed text-muted-foreground">
              CV nên dài 1–2 trang và chứa từ khóa liên quan JD để tăng điểm ATS.
            </p>
          </div>

          <div className="flex gap-2.5">
            <div className="flex size-5 shrink-0 items-center justify-center rounded-full bg-blue-500/10 dark:bg-blue-500/20 text-[10px] font-bold text-blue-700 dark:text-blue-400">
              2
            </div>
            <p className="text-xs leading-relaxed text-muted-foreground">
              Dán đầy đủ các phần yêu cầu kỹ năng và trách nhiệm công việc trong JD để AI so khớp chi tiết.
            </p>
          </div>

          <div className="flex gap-2.5">
            <div className="flex size-5 shrink-0 items-center justify-center rounded-full bg-blue-500/10 dark:bg-blue-500/20 text-[10px] font-bold text-blue-700 dark:text-blue-400">
              3
            </div>
            <p className="text-xs leading-relaxed text-muted-foreground">
              Tải CV rõ ràng dạng văn bản (PDF, Word). Tránh tệp chỉ chứa hình ảnh quét để tránh lỗi nhận diện.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
