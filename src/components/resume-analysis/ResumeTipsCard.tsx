"use client";

import { LightbulbIcon } from "lucide-react";

export function ResumeTipsCard() {
  return (
    <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
      <div className="flex items-start gap-3">
        <div className="rounded-xl bg-emerald-50 p-2.5 text-emerald-700">
          <LightbulbIcon className="size-5" />
        </div>
        <div>
          <h3 className="text-sm font-bold text-foreground">
            Mẹo phân tích hiệu quả
          </h3>
          <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
            Nhận kết quả đánh giá tối ưu nhất bằng cách chuẩn bị dữ liệu đầu vào
            rõ ràng.
          </p>
        </div>
      </div>

      <div className="mt-4 space-y-3.5">
        <div className="flex gap-3">
          <div className="flex size-5 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-[10px]  font-bold text-emerald-700">
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
          <div className="flex size-5 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-[10px]  font-bold text-emerald-700">
            2
          </div>
          <p className="text-xs leading-relaxed text-muted-foreground">
            <strong className="text-foreground">Định dạng CV:</strong> Tải CV rõ
            ràng dạng text (PDF, Word). Tránh tệp chỉ chứa ảnh quét hoặc lỗi
            font.
          </p>
        </div>
      </div>
    </div>
  );
}
