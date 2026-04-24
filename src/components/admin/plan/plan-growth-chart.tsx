"use client";

import { useState } from "react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const filters = ["30 Days", "90 Days"] as const;

export function PlanGrowthChart({
  data,
}: {
  data: { label: string; value: number }[];
}) {
  const [active, setActive] = useState<(typeof filters)[number]>("30 Days");
  const maxValue = Math.max(1, ...data.map(point => point.value));

  return (
    <Card className="rounded-3xl border-border/60 shadow-sm">
      <CardHeader className="flex flex-row items-start justify-between gap-4">
        <div>
          <CardTitle className="text-xl font-semibold">
            Xu hướng tăng trưởng
          </CardTitle>
          <p className="mt-1 text-sm text-muted-foreground">
            Lượng đăng ký gói mới trong kỳ gần nhất.
          </p>
        </div>

        <div className="inline-flex rounded-2xl bg-muted p-1">
          {filters.map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => setActive(item)}
              className={cn(
                "rounded-xl px-4 py-2 text-sm font-medium transition-colors",
                active === item
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground",
              )}
            >
              {item}
            </button>
          ))}
        </div>
      </CardHeader>

      <CardContent>
        <div className="relative h-[240px] overflow-hidden rounded-3xl bg-muted/20 p-6">
          {data.length === 0 ? (
            <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
              Chưa có dữ liệu subscription để vẽ xu hướng
            </div>
          ) : (
            <div className="flex h-full items-end gap-3">
              {data.map(point => (
                <div
                  key={point.label}
                  className="flex h-full flex-1 flex-col items-center justify-end gap-2"
                >
                  <div
                    className="w-full max-w-10 rounded-t-2xl bg-primary"
                    style={{ height: `${(point.value / maxValue) * 100}%` }}
                  />
                  <span className="text-xs text-muted-foreground">
                    {point.label}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
