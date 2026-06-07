"use client";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { CheckIcon, Loader2Icon, SparkleIcon } from "lucide-react";
import { PROGRESS_STEPS } from "@/components/resume-analysis/constants";

export function ResumeLoadingState({ loadingStep }: { loadingStep: number }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
      <div className="flex items-center gap-3">
        <div className="relative">
          <div className="absolute -inset-1 rounded-full bg-primary/20 blur animate-pulse" />
          <Loader2Icon className="relative size-5 animate-spin text-primary" />
        </div>
        <div>
          <h3 className="text-base font-bold text-foreground">
            AI Coach đang phân tích dữ liệu
          </h3>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Quá trình so khớp nâng cao mất khoảng 15 giây...
          </p>
        </div>
      </div>

      <div className="mt-6 space-y-4">
        {PROGRESS_STEPS.map((step) => {
          const isCompleted = loadingStep > step.id;
          const isActive = loadingStep === step.id;

          return (
            <div key={step.id} className="relative flex gap-4">
              {step.id !== PROGRESS_STEPS.length - 1 && (
                <div
                  className={cn(
                    "absolute left-[11px] top-6 h-10 w-0.5 transition-colors duration-500",
                    isCompleted ? "bg-emerald-500" : "bg-border",
                  )}
                />
              )}

              <div
                className={cn(
                  "relative z-10 flex size-6 shrink-0 items-center justify-center rounded-full text-xs font-bold transition-all duration-500",
                  isCompleted
                    ? "bg-emerald-500 text-white"
                    : isActive
                      ? "scale-110 bg-primary text-primary-foreground shadow-sm animate-pulse"
                      : "bg-muted text-muted-foreground",
                )}
              >
                {isCompleted ? <CheckIcon className="size-3.5" /> : step.id + 1}
              </div>

              <div className="min-w-0">
                <h4
                  className={cn(
                    "text-xs font-bold transition-colors duration-500",
                    isActive
                      ? " font-bold text-primary"
                      : "text-foreground",
                  )}
                >
                  {step.title}
                </h4>
                <p className="mt-0.5 truncate text-[10px] text-muted-foreground">
                  {step.desc}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-6 flex items-center justify-between rounded-xl border border-primary/10 bg-primary/5 p-4">
        <div className="flex items-center gap-2 text-xs font-medium text-primary">
          <SparkleIcon className="size-3.5 animate-spin" />
          AI đang tính toán chỉ số tương thích...
        </div>
        <Badge className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold text-primary">
          Đang xử lý
        </Badge>
      </div>
    </div>
  );
}
