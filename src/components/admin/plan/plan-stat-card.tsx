import { LucideIcon } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type PlanStatCardProps = {
  title: string;
  value: string;
  change?: string;
  badge?: string;
  changeType?: "positive" | "negative" | "neutral";
  icon: LucideIcon;
  featured?: boolean;
};

export function PlanStatCard({
  title,
  value,
  change,
  badge,
  changeType = "neutral",
  icon: Icon,
  featured = false,
}: PlanStatCardProps) {
  return (
    <Card
      className={cn(
        "rounded-2xl border-border/60 shadow-sm",
        featured && "border-primary/20 bg-primary text-primary-foreground",
      )}
    >
      <CardContent className="p-3.5">
        <div className="flex items-start justify-between gap-4">
          <div
            className={cn(
              "flex h-7 w-7 items-center justify-center rounded-2xl",
              featured
                ? "bg-white/10 text-white"
                : "bg-primary/10 text-primary",
            )}
          >
            <Icon className="h-5 w-5" />
          </div>

          {(change || badge) && (
            <span
              className={cn(
                "inline-flex rounded-full px-2.5 py-1 text-xs font-medium",
                featured && "bg-white text-primary",
                !featured &&
                  changeType === "positive" &&
                  "bg-emerald-50 text-emerald-600",
                !featured &&
                  changeType === "negative" &&
                  "bg-red-50 text-red-600",
                !featured &&
                  changeType === "neutral" &&
                  "bg-muted text-muted-foreground",
              )}
            >
              {change ?? badge}
            </span>
          )}
        </div>

        <div className="mt-8 space-y-2">
          <p
            className={cn(
              "text-xs font-semibold uppercase tracking-[0.2em]",
              featured ? "text-white/80" : "text-muted-foreground",
            )}
          >
            {title}
          </p>
          <h3 className="text-2xl font-semibold tracking-tight">{value}</h3>
        </div>
      </CardContent>
    </Card>
  );
}
