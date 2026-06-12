import * as React from "react";
import { TrendingDown, TrendingUp } from "lucide-react";

import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";

export type StatsCardProps = {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  growthText?: string;
  growthKind?: "positive" | "negative" | "stable";
  badgeText?: string;
};

export function StatsCard({
  icon: Icon,
  label,
  value,
  growthText,
  growthKind = "positive",
  badgeText,
}: StatsCardProps) {
  const isStable = growthKind === "stable" || badgeText != null;

  // Modern contextual color schemas based on the KPI label
  let themeStyles = {
    bg: "from-primary/8 to-primary/4 hover:border-primary/30 hover:shadow-primary/5",
    iconBg: "from-primary/12 to-primary/4 text-primary border-primary/10",
  };

  const lowerLabel = label.toLowerCase();
  if (lowerLabel.includes("hoạt động")) {
    themeStyles = {
      bg: "from-emerald-500/8 to-emerald-500/4 hover:border-emerald-500/30 hover:shadow-emerald-500/5",
      iconBg: "from-emerald-500/12 to-emerald-500/4 text-emerald-600 dark:text-emerald-400 border-emerald-500/10",
    };
  } else if (lowerLabel.includes("phỏng vấn")) {
    themeStyles = {
      bg: "from-purple-500/8 to-purple-500/4 hover:border-purple-500/30 hover:shadow-purple-500/5",
      iconBg: "from-purple-500/12 to-purple-500/4 text-purple-600 dark:text-purple-400 border-purple-500/10",
    };
  } else if (lowerLabel.includes("doanh thu")) {
    themeStyles = {
      bg: "from-amber-500/8 to-amber-500/4 hover:border-amber-500/30 hover:shadow-amber-500/5",
      iconBg: "from-amber-500/12 to-amber-500/4 text-amber-600 dark:text-amber-400 border-amber-500/10",
    };
  } else if (lowerLabel.includes("đăng ký")) {
    themeStyles = {
      bg: "from-blue-500/8 to-blue-500/4 hover:border-blue-500/30 hover:shadow-blue-500/5",
      iconBg: "from-blue-500/12 to-blue-500/4 text-blue-600 dark:text-blue-400 border-blue-500/10",
    };
  }

  return (
    <Card className={cn(
      "rounded-[16px] border border-border/40 bg-gradient-to-br bg-card shadow-sm hover:-translate-y-0.5 hover:shadow-md transition-all duration-200 group",
      themeStyles.bg
    )}>
      <div className="p-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className={cn(
            "rounded-xl p-2.5 bg-gradient-to-br group-hover:scale-105 transition-transform duration-300 shrink-0 border",
            themeStyles.iconBg
          )}>
            <Icon className="size-5" />
          </div>
          <div>
            <h3 className="text-[10px] font-bold text-muted-foreground/85 tracking-wider uppercase block">
              {label}
            </h3>
            <span className="text-xl font-bold tracking-tight text-foreground block leading-tight mt-0.5">
              {value}
            </span>
          </div>
        </div>

        <div className="flex flex-col items-end gap-0.5 shrink-0">
          {growthText && (
            <div>
              {growthKind === "negative" ? (
                <div className="flex items-center gap-1 rounded-full border border-rose-500/20 bg-rose-500/10 px-2 py-0.5 text-[10px] font-semibold text-rose-600 dark:bg-rose-500/25 dark:text-rose-400 shadow-sm">
                  <TrendingDown className="size-3" />
                  <span>{growthText}</span>
                </div>
              ) : growthKind === "positive" ? (
                <div className="flex items-center gap-1 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-600 dark:bg-emerald-500/25 dark:text-emerald-400 shadow-sm">
                  <TrendingUp className="size-3" />
                  <span>{growthText}</span>
                </div>
              ) : null}
            </div>
          )}

          {!growthText && isStable && (
            <Badge
              variant="outline"
              className="border-primary/20 bg-primary/5 text-primary text-[9px] font-semibold rounded-full px-2 py-0.5"
            >
              {badgeText ?? "Stable"}
            </Badge>
          )}

          {growthText && (
            <span className="text-[10px] text-muted-foreground/70 font-medium">
              so với kỳ trước
            </span>
          )}
        </div>
      </div>
    </Card>
  );
}
