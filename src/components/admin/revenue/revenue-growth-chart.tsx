"use client";

import { useMemo, useState } from "react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const filters = ["Daily", "Monthly", "Yearly"] as const;
type Filter = (typeof filters)[number];

export function RevenueGrowthChart({
  data,
}: {
  data: { month: string; value: number }[];
}) {
  const [activeFilter, setActiveFilter] = useState<Filter>("Monthly");

  const maxValue = useMemo(
    () => Math.max(1, ...data.map((item) => item.value)),
    [data],
  );

  return (
    <Card className="rounded-3xl border-border/60 shadow-sm">
      <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <CardTitle className="text-lg font-semibold">
            Tăng trưởng doanh thu hàng tháng
          </CardTitle>
          <p className="mt-1 text-sm text-muted-foreground">
            Hiệu suất trực quan của dòng doanh thu trong 12 tháng gần nhất.
          </p>
        </div>

        <div className="inline-flex rounded-2xl bg-muted p-1">
          {filters.map((filter) => (
            <button
              key={filter}
              type="button"
              onClick={() => setActiveFilter(filter)}
              className={cn(
                "rounded-xl px-3 py-1.5 text-xs font-medium transition-colors",
                activeFilter === filter
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {filter}
            </button>
          ))}
        </div>
      </CardHeader>

      <CardContent>
        <div className="flex h-[320px] items-end gap-4 rounded-2xl bg-muted/20 px-4 pb-6 pt-4">
          {data.map((item, index) => {
            const height = `${(item.value / maxValue) * 100}%`;
            const isLast = index === data.length - 1;

            return (
              <div
                key={item.month}
                className="flex h-full flex-1 flex-col items-center justify-end gap-3"
              >
                <div className="flex h-full w-full items-end justify-center">
                  <div
                    className={cn(
                      "w-full max-w-[44px] rounded-t-2xl transition-all",
                      isLast ? "bg-primary" : "bg-slate-200",
                    )}
                    style={{ height }}
                  />
                </div>
                <span className="text-xs font-medium text-muted-foreground">
                  {item.month}
                </span>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
