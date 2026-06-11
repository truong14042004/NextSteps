"use client";

import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { CheckIcon, SparkleIcon, SparklesIcon } from "lucide-react";
import { PROGRESS_STEPS } from "@/components/resume-analysis/constants";

export function ResumeLoadingState({ loadingStep }: { loadingStep: number }) {
  const [percent, setPercent] = useState(0);

  // Animate progress percentage smoothly
  useEffect(() => {
    const targetPercent = Math.min(loadingStep * 25, 100);
    const interval = setInterval(() => {
      setPercent((prev) => {
        if (prev < targetPercent) {
          return prev + 1;
        }
        if (prev > targetPercent) {
          return prev - 1;
        }
        clearInterval(interval);
        return prev;
      });
    }, 20);
    return () => clearInterval(interval);
  }, [loadingStep]);

  return (
    <div className="rounded-[28px] border border-border/60 bg-white dark:bg-card p-6 md:p-8 shadow-sm max-w-2xl mx-auto my-12 animate-in fade-in duration-300">
      <div className="flex flex-col items-center text-center space-y-4">
        <div className="relative flex items-center justify-center size-16 rounded-full bg-primary/10 text-primary">
          <div className="absolute inset-0 rounded-full bg-primary/20 blur animate-pulse" />
          <SparklesIcon className="size-8 animate-spin" style={{ animationDuration: '3s' }} />
        </div>
        
        <div>
          <h3 className="text-xl font-bold text-foreground">
            AI Coach đang phân tích dữ liệu
          </h3>
          <p className="mt-1 text-sm text-muted-foreground max-w-md">
            Quá trình phân tích nâng cao, đối chiếu dữ liệu CV và yêu cầu JD sẽ hoàn tất trong khoảng 15 giây...
          </p>
        </div>
      </div>

      {/* Modern Progress Bar */}
      <div className="mt-8">
        <div className="flex items-center justify-between text-xs font-bold text-muted-foreground mb-2">
          <span>Tiến trình phân tích</span>
          <span className="text-primary">{percent}%</span>
        </div>
        <div className="h-2.5 w-full bg-muted rounded-full overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-primary to-orange-500 rounded-full transition-all duration-300 ease-out"
            style={{ width: `${percent}%` }}
          />
        </div>
      </div>

      <div className="mt-8 space-y-4">
        {PROGRESS_STEPS.map((step) => {
          const isCompleted = loadingStep > step.id;
          const isActive = loadingStep === step.id;

          return (
            <div 
              key={step.id} 
              className={cn(
                "relative flex gap-4 p-3 rounded-xl border transition-all duration-300",
                isActive 
                  ? "border-primary/20 bg-primary/[0.02] shadow-sm" 
                  : isCompleted 
                    ? "border-emerald-500/10 bg-emerald-500/[0.01]" 
                    : "border-transparent bg-transparent opacity-60"
              )}
            >
              {step.id !== PROGRESS_STEPS.length - 1 && (
                <div
                  className={cn(
                    "absolute left-[27px] top-11 h-8 w-0.5 transition-colors duration-500",
                    isCompleted ? "bg-emerald-500" : "bg-border/60",
                  )}
                />
              )}

              <div
                className={cn(
                  "relative z-10 flex size-8 shrink-0 items-center justify-center rounded-full text-xs font-bold transition-all duration-500",
                  isCompleted
                    ? "bg-emerald-500 text-white"
                    : isActive
                      ? "scale-110 bg-primary text-primary-foreground shadow-md shadow-primary/20 animate-pulse"
                      : "bg-muted text-muted-foreground",
                )}
              >
                {isCompleted ? <CheckIcon className="size-4" /> : step.id + 1}
              </div>

              <div className="min-w-0 flex-1">
                <h4
                  className={cn(
                    "text-sm font-bold transition-colors duration-500",
                    isActive
                      ? "text-primary"
                      : "text-foreground",
                  )}
                >
                  {step.title}
                </h4>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {step.desc}
                </p>
              </div>

              {isActive && (
                <div className="flex items-center gap-1.5 shrink-0 self-center">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                  </span>
                  <span className="text-[10px] font-bold text-primary uppercase tracking-wider">Xử lý...</span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-6 flex items-center justify-between rounded-2xl border border-primary/10 bg-primary/5 p-4">
        <div className="flex items-center gap-2 text-xs font-bold text-primary">
          <SparkleIcon className="size-4 animate-spin" />
          AI đang so khớp chỉ số tương thích...
        </div>
        <Badge className="rounded-full bg-primary/10 px-2.5 py-0.5 text-[10px] font-bold text-primary">
          Đang xử lý
        </Badge>
      </div>
    </div>
  );
}
