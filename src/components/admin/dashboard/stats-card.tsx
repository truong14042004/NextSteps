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

  return (
    <Card className="rounded-xl bg-card">
      <div className="p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="rounded-2xl bg-primary/10 p-3 text-primary">
              <Icon className="size-5" />
            </div>
            <div>
              <div className="text-sm font-medium text-muted-foreground">
                {label}
              </div>
              <div className="mt-2 text-2xl font-semibold tracking-tight">
                {value}
              </div>
            </div>
          </div>

          {isStable ? (
            <Badge
              variant="outline"
              className="border-primary/30 bg-primary/10 text-primary"
            >
              {badgeText ?? "Stable"}
            </Badge>
          ) : growthKind === "negative" ? (
            <div
              className={cn(
                "flex items-center gap-1 rounded-full border px-3 py-1 text-xs",
                "border-rose-500/20 bg-rose-500/10 text-rose-700",
              )}
            >
              <TrendingDown className="size-3.5" />
              <span>{growthText}</span>
            </div>
          ) : (
            <div
              className={cn(
                "flex items-center gap-1 rounded-full border px-3 py-1 text-xs",
                "border-emerald-500/20 bg-emerald-500/10 text-emerald-700",
              )}
            >
              <TrendingUp className="size-3.5" />
              <span>{growthText}</span>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}
