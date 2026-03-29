"use client";

import { useMemo } from "react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";

type Point = { day: string; value: number };

const tooltipValueFormatter = (value: unknown) => {
  if (typeof value === "number") return value.toLocaleString();
  return String(value);
};

function CustomTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: { value?: unknown }[];
  label?: string;
}) {
  if (!active || !payload?.length) return null;

  const val = payload[0]?.value;
  return (
    <div className="rounded-xl border bg-background p-3 text-xs shadow-sm">
      <div className="font-medium text-foreground">{label}</div>
      <div className="mt-1 text-muted-foreground">
        {tooltipValueFormatter(val)} registrations
      </div>
    </div>
  );
}

export function GrowthChart() {
  const data = useMemo<Point[]>(
    () => [
      { day: "10 OCT", value: 84 },
      { day: "12 OCT", value: 92 },
      { day: "14 OCT", value: 88 },
      { day: "16 OCT", value: 96 },
      { day: "18 OCT", value: 104 },
      { day: "20 OCT", value: 101 },
      { day: "22 OCT", value: 112 },
      { day: "24 OCT", value: 121 },
      { day: "26 OCT", value: 118 },
      { day: "28 OCT", value: 132 },
      { day: "30 OCT", value: 139 },
    ],
    [],
  );

  return (
    // unify card inner spacing with other admin cards
    <Card className="rounded-2xl bg-card">
      <div className="p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-base font-semibold">
              Biểu đồ tăng trưởng người dùng
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Daily registrations for the last 30 days
            </p>
          </div>
          <Badge
            variant="outline"
            className="border-primary/30 bg-primary/10 text-primary"
          >
            Organic
          </Badge>
        </div>

        <div className="mt-4">
          <ResponsiveContainer width="100%" height={240}>
            <LineChart
              data={data}
              margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
            >
              <defs>
                <linearGradient id="organicStroke" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#2563eb" stopOpacity={0.95} />
                  <stop offset="100%" stopColor="#1d4ed8" stopOpacity={0.75} />
                </linearGradient>
              </defs>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="hsl(var(--border))"
              />
              <XAxis
                dataKey="day"
                tickLine={false}
                axisLine={false}
                tickMargin={10}
                className="text-xs text-muted-foreground"
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                width={40}
                className="text-xs text-muted-foreground"
              />
              <Tooltip content={<CustomTooltip />} />
              <Line
                type="monotone"
                dataKey="value"
                name="Registrations"
                stroke="url(#organicStroke)"
                strokeWidth={3}
                dot={false}
                activeDot={{ r: 4, strokeWidth: 2 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </Card>
  );
}
