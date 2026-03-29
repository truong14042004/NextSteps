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
  return (
    <Card className="rounded-3xl border-border/60 shadow-sm">
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-2">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              {title}
            </p>

            <div className="flex items-center gap-2">
              <h3 className="text-3xl font-semibold tracking-tight">{value}</h3>

              {change ? (
                <span
                  className={cn(
                    "inline-flex rounded-full px-2 py-0.5 text-xs font-medium",
                    changeType === "positive" &&
                      "bg-emerald-50 text-emerald-600",
                    changeType === "negative" && "bg-red-50 text-red-600",
                    changeType === "neutral" &&
                      "bg-muted text-muted-foreground",
                  )}
                >
                  {change}
                </span>
              ) : null}
            </div>

            {description ? (
              <p className="text-sm text-muted-foreground">{description}</p>
            ) : null}
          </div>

          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <Icon className="h-5 w-5" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
