import { CreditCard, TrendingUp } from "lucide-react";

import { Card } from "@/components/ui/card";

const planConfigs: Record<
  string,
  { title: string; color: string; textClass: string; borderClass: string; bgClass: string }
> = {
  free: {
    title: "Gói Free",
    color: "bg-zinc-400 dark:bg-zinc-600",
    textClass: "text-zinc-600 dark:text-zinc-400",
    borderClass: "border-zinc-200 dark:border-zinc-800",
    bgClass: "bg-zinc-500/5",
  },
  start: {
    title: "Gói Start",
    color: "bg-blue-500",
    textClass: "text-blue-600 dark:text-blue-400",
    borderClass: "border-blue-500/10 dark:border-blue-500/20",
    bgClass: "bg-blue-500/5",
  },
  premium: {
    title: "Gói Premium",
    color: "bg-purple-600",
    textClass: "text-purple-600 dark:text-purple-400",
    borderClass: "border-purple-500/10 dark:border-purple-500/20",
    bgClass: "bg-purple-500/5",
  },
};

export function AiPerformanceCard({
  distribution,
}: {
  distribution: { label: string; value: number; count: number }[];
}) {
  return (
    <Card className="rounded-[20px] border border-border/40 bg-card shadow-sm h-full flex flex-col justify-between">
      <div className="p-4 flex-1 flex flex-col justify-between gap-3">
        {/* Module Header */}
        <div className="flex items-center gap-2.5 border-b border-border/40 pb-3">
          <div className="rounded-xl bg-red-500/10 p-2 text-red-500 border border-red-500/10 shrink-0">
            <CreditCard className="size-4.5" />
          </div>
          <div className="flex-1">
            <h2 className="text-sm font-bold text-foreground leading-none">
              Phân tích phân phối đăng ký
            </h2>
            <p className="text-[10px] text-muted-foreground/80 mt-1 leading-none">
              Tỷ lệ các gói dịch vụ
            </p>
          </div>
        </div>

        {/* Billing Blocks Section */}
        <div className="flex-1 flex flex-col justify-center space-y-2.5">
          {distribution.map((plan) => {
            const key = plan.label.toLowerCase();
            const config = planConfigs[key] ?? planConfigs.free;

            return (
              <div
                key={plan.label}
                className={`border ${config.borderClass} ${config.bgClass} rounded-xl p-2.5 flex flex-col justify-between gap-1 hover:shadow-sm transition-all duration-200`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-foreground leading-none">{config.title}</span>
                  <span className={`text-xs font-bold leading-none ${config.textClass}`}>
                    {plan.value}%
                  </span>
                </div>

                <div className="flex items-center justify-between text-[10px] text-muted-foreground/85 font-semibold leading-none mt-0.5">
                  <span>{plan.count.toLocaleString("vi-VN")} users</span>
                </div>

                <div className="h-1.5 w-full rounded-full bg-muted/60 overflow-hidden mt-1">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${config.color}`}
                    style={{ width: `${plan.value}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </Card>
  );
}
