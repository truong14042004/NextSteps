"use client";

import { useState } from "react";
import { LightbulbIcon, ChevronDownIcon, ChevronUpIcon } from "lucide-react";

export function ResumeTipsCard() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="rounded-2xl border border-border/60 bg-white dark:bg-card p-4 shadow-sm transition-all duration-300">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-full items-center justify-between text-left focus:outline-none"
      >
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-emerald-50 dark:bg-emerald-500/10 p-2 text-emerald-700 dark:text-emerald-400">
            <LightbulbIcon className="size-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-foreground flex items-center gap-1.5">
              💡 Mẹo phân tích hiệu quả
            </h3>
            <p className="text-[10px] text-muted-foreground">
              Nhấn để xem hướng dẫn chuẩn bị dữ liệu đầu vào.
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
        <div className="mt-4 space-y-3 border-t border-border/60 pt-4 animate-in fade-in slide-in-from-top-1 duration-200">
          <div className="flex gap-3">
            <div className="flex size-5 shrink-0 items-center justify-center rounded-full bg-emerald-50 dark:bg-emerald-500/10 text-[10px] font-bold text-emerald-700 dark:text-emerald-450">
              1
            </div>
            <p className="text-xs leading-relaxed text-muted-foreground">
              <strong className="text-foreground">
                Độ dài của Job Description:
              </strong>{" "}
              Dán đầy đủ các phần yêu cầu kỹ năng và trách nhiệm công việc để AI
              so khớp chi tiết.
            </p>
          </div>

          <div className="flex gap-3">
            <div className="flex size-5 shrink-0 items-center justify-center rounded-full bg-emerald-50 dark:bg-emerald-500/10 text-[10px] font-bold text-emerald-700 dark:text-emerald-450">
              2
            </div>
            <p className="text-xs leading-relaxed text-muted-foreground">
              <strong className="text-foreground">Định dạng CV:</strong> Tải CV rõ
              ràng dạng text (PDF, Word). Tránh tệp chỉ chứa ảnh quét hoặc lỗi
              font.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
