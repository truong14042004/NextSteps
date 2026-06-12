import { LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type RevenueStatCardProps = {
  title: string;
  value: string;
  change?: string;
  changeType?: "positive" | "negative" | "neutral";
  description?: string;
  icon: LucideIcon;
};

export function RevenueStatCard({
  title,
  value,
  change,
  changeType = "neutral",
  description,
  icon: Icon,
}: RevenueStatCardProps) {
  // Determine gradient color scheme based on title
  let gradientClass = "from-red-500/10 to-rose-500/10 text-red-600 dark:text-red-400";
  const lowercaseTitle = title.toLowerCase();
  
  if (lowercaseTitle.includes("doanh thu") && lowercaseTitle.includes("tổng")) {
    gradientClass = "from-emerald-500/10 to-teal-500/10 text-emerald-600 dark:text-emerald-400";
  } else if (lowercaseTitle.includes("định kỳ") || lowercaseTitle.includes("tháng này")) {
    gradientClass = "from-blue-500/10 to-indigo-500/10 text-blue-600 dark:text-blue-400";
  } else if (lowercaseTitle.includes("giao dịch")) {
    gradientClass = "from-purple-500/10 to-violet-500/10 text-purple-600 dark:text-purple-400";
  } else if (lowercaseTitle.includes("hủy") || lowercaseTitle.includes("churn")) {
    gradientClass = "from-amber-500/10 to-orange-500/10 text-amber-600 dark:text-amber-400";
  }

  return (
    <Card className="rounded-2xl border border-slate-100 dark:border-zinc-800 bg-white/70 dark:bg-zinc-900/70 shadow-2xs backdrop-blur-xs transition-all duration-300 hover:-translate-y-[2px] hover:shadow-sm">
      <CardContent className="p-4.5 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className={cn("flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br", gradientClass)}>
            <Icon className="h-5.5 w-5.5" />
          </div>
          
          <div className="space-y-1">
            <p className="text-xs font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">
              {title}
            </p>
            <div className="flex items-baseline gap-2">
              <h3 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
                {value}
              </h3>
              {change && (
                <span
                  className={cn(
                    "inline-flex items-center rounded-md px-1.5 py-0.5 text-xs font-semibold leading-none",
                    changeType === "positive" && "bg-emerald-50 dark:bg-emerald-950/35 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/30",
                    changeType === "negative" && "bg-rose-50 dark:bg-rose-950/35 text-rose-600 dark:text-rose-400 border border-rose-100 dark:border-rose-900/30",
                    changeType === "neutral" && "bg-zinc-50 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 border border-zinc-200/50 dark:border-zinc-700/50"
                  )}
                >
                  {change}
                </span>
              )}
            </div>
            {description && (
              <p className="text-xs text-zinc-400 dark:text-zinc-500 font-medium">
                {description}
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
