"use client";

import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const filters = ["Daily", "Monthly", "Yearly"] as const;
type Filter = (typeof filters)[number];

export function RevenueGrowthChart({
  data,
  transactions = [],
}: {
  data: { month: string; value: number }[];
  transactions?: {
    id: string;
    name: string;
    initials: string;
    plan: string;
    amount: string;
    status: string;
    date: string;
  }[];
}) {
  const [activeFilter, setActiveFilter] = useState<Filter>("Monthly");
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  // Compute filtered dataset client-side using actual transactions and metrics
  const filteredData = useMemo(() => {
    if (activeFilter === "Daily") {
      // Find the last 7 calendar days
      const days = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];
      
      const last7Days = Array.from({ length: 7 }, (_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - (6 - i));
        
        // Format as dd/mm/yyyy to match transaction dates (e.g. 12/06/2026)
        const dd = String(d.getDate()).padStart(2, "0");
        const mm = String(d.getMonth() + 1).padStart(2, "0");
        const yyyy = d.getFullYear();
        return `${dd}/${mm}/${yyyy}`;
      });

      return last7Days.map(dateStr => {
        // Find transactions on this date and sum their numeric amounts
        const dailySum = transactions
          .filter(t => t.date === dateStr && (t.status === "Success" || t.status === "paid" || t.status === "đã thanh toán"))
          .reduce((sum, t) => {
            const num = parseInt(t.amount.replace(/\D/g, "")) || 0;
            return sum + num;
          }, 0);

        // Parse day of week and format label
        const parts = dateStr.split("/");
        const dateObj = new Date(Number(parts[2]), Number(parts[1]) - 1, Number(parts[0]));
        const label = days[dateObj.getDay()] + ` (${parts[0]}/${parts[1]})`;

        return { label, value: dailySum };
      });
    }

    if (activeFilter === "Yearly") {
      const currentTotal = data.reduce((sum, item) => sum + item.value, 0);
      return [
        { label: "2024", value: 0 },
        { label: "2025", value: 0 },
        { label: "2026", value: currentTotal },
      ];
    }

    // Default "Monthly"
    return data.map((item) => ({
      label: item.month,
      value: item.value,
    }));
  }, [activeFilter, data, transactions]);

  const maxValue = useMemo(
    () => Math.max(1, ...filteredData.map((item) => item.value)),
    [filteredData],
  );

  // Helper to assign vibrant gradient styling
  const getBarColor = (index: number, isLast: boolean, isHovered: boolean) => {
    if (isHovered) {
      return "from-purple-500 to-pink-500 shadow-md shadow-purple-500/20";
    }
    if (isLast) {
      return "from-red-600 to-rose-500 shadow-md shadow-red-500/20";
    }

    // Premium SaaS gradient palettes
    const gradients = [
      "from-blue-600 to-indigo-500",
      "from-teal-500 to-emerald-500",
      "from-amber-500 to-orange-500",
      "from-violet-500 to-purple-500",
    ];

    return gradients[index % gradients.length];
  };

  return (
    <Card className="rounded-2xl border border-slate-100 dark:border-zinc-800 bg-white/70 dark:bg-zinc-900/70 shadow-xs backdrop-blur-xs">
      <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between pb-6">
        <div>
          <CardTitle className="text-lg font-bold text-zinc-900 dark:text-zinc-50">
            Tăng trưởng doanh thu
          </CardTitle>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400 font-medium">
            {activeFilter === "Daily" && "Hiển thị doanh thu theo các ngày trong tuần."}
            {activeFilter === "Monthly" && "Hiệu suất trực quan của dòng doanh thu trong năm nay."}
            {activeFilter === "Yearly" && "Hiệu suất doanh thu lũy kế qua các năm."}
          </p>
        </div>

        <div className="inline-flex rounded-xl bg-zinc-100 dark:bg-zinc-800 p-0.75">
          {filters.map((filter) => (
            <button
              key={filter}
              type="button"
              onClick={() => {
                setActiveFilter(filter);
                setHoveredIndex(null);
              }}
              className={cn(
                "rounded-lg px-3 py-1.5 text-xs font-semibold transition-all",
                activeFilter === filter
                  ? "bg-white dark:bg-zinc-900 text-zinc-950 dark:text-zinc-50 shadow-xs"
                  : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200",
              )}
            >
              {filter}
            </button>
          ))}
        </div>
      </CardHeader>

      <CardContent>
        <div className="relative w-full h-[280px] rounded-xl border border-zinc-100/80 dark:border-zinc-800/40 bg-zinc-50/30 dark:bg-zinc-900/30 p-5 flex flex-col justify-between">
          {filteredData && filteredData.length > 0 ? (
            <div className="relative flex-1">
              <svg className="w-full h-full overflow-visible" viewBox="0 0 500 180" preserveAspectRatio="none">
                <defs>
                  <linearGradient id="revenue-area-gradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#b30000" stopOpacity="0.25" />
                    <stop offset="100%" stopColor="#b30000" stopOpacity="0.00" />
                  </linearGradient>
                </defs>
                
                {/* Grid Lines */}
                <line x1="0" y1="36" x2="500" y2="36" stroke="currentColor" strokeOpacity="0.04" strokeDasharray="3" className="text-zinc-500" />
                <line x1="0" y1="72" x2="500" y2="72" stroke="currentColor" strokeOpacity="0.04" strokeDasharray="3" className="text-zinc-500" />
                <line x1="0" y1="108" x2="500" y2="108" stroke="currentColor" strokeOpacity="0.04" strokeDasharray="3" className="text-zinc-500" />
                <line x1="0" y1="144" x2="500" y2="144" stroke="currentColor" strokeOpacity="0.04" strokeDasharray="3" className="text-zinc-500" />
                <line x1="0" y1="180" x2="500" y2="180" stroke="currentColor" strokeOpacity="0.08" className="text-zinc-500" />

                {(() => {
                  const maxVal = Math.max(1, ...filteredData.map(p => p.value));
                  const points = filteredData.map((item, idx) => {
                    const x = (idx / Math.max(1, filteredData.length - 1)) * 480 + 10;
                    const y = 165 - (item.value / maxVal) * 140;
                    return { x, y, val: item.value, label: item.label, idx };
                  });

                  const getCurvePath = (pts: { x: number; y: number }[]) => {
                    if (pts.length === 0) return "";
                    let path = `M ${pts[0].x} ${pts[0].y}`;
                    for (let i = 0; i < pts.length - 1; i++) {
                      const p0 = pts[i];
                      const p1 = pts[i + 1];
                      const cp1x = p0.x + (p1.x - p0.x) / 3;
                      const cp1y = p0.y;
                      const cp2x = p0.x + 2 * (p1.x - p0.x) / 3;
                      const cp2y = p1.y;
                      path += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p1.x} ${p1.y}`;
                    }
                    return path;
                  };

                  const pathD = getCurvePath(points);
                  const areaD = pathD ? `${pathD} L ${points[points.length - 1].x} 180 L ${points[0].x} 180 Z` : "";

                  return (
                    <>
                      {/* Gradient area */}
                      {areaD && <path d={areaD} fill="url(#revenue-area-gradient)" />}
                      
                      {/* Spline line */}
                      {pathD && <path d={pathD} fill="none" stroke="#b30000" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />}

                      {/* Hover gridlines */}
                      {points.map((p) => (
                        <g key={p.idx}>
                          {hoveredIndex === p.idx && (
                            <line
                              x1={p.x}
                              y1={10}
                              x2={p.x}
                              y2={180}
                              stroke="#cbd5e1"
                              strokeOpacity="0.6"
                              strokeWidth="1"
                              strokeDasharray="3"
                            />
                          )}
                          <rect
                            x={p.x - 20}
                            y={0}
                            width={40}
                            height={180}
                            fill="transparent"
                            className="cursor-pointer"
                            onMouseEnter={() => setHoveredIndex(p.idx)}
                            onMouseLeave={() => setHoveredIndex(null)}
                          />
                        </g>
                      ))}

                      {/* Dot highlight */}
                      {points.map((p) => {
                        const isHovered = hoveredIndex === p.idx;
                        return (
                          <circle
                            key={p.idx}
                            cx={p.x}
                            cy={p.y}
                            r={isHovered ? 6 : 4}
                            className={cn(
                              "cursor-pointer pointer-events-none transition-all duration-200 fill-white stroke-[#b30000] stroke-[2.5px]",
                              isHovered && "fill-[#b30000] stroke-[#b30000] r-6"
                            )}
                          />
                        );
                      })}
                    </>
                  );
                })()}
              </svg>
            </div>
          ) : (
            <div className="flex h-full items-center justify-center text-sm text-zinc-400">
              Không có dữ liệu tăng trưởng doanh thu
            </div>
          )}

          {/* X Axis labels */}
          <div className="flex justify-between mt-3 px-1 text-[11px] font-semibold text-zinc-400 dark:text-zinc-500 select-none">
            {filteredData.map((item) => (
              <span key={item.label} className="text-center flex-1">
                {item.label}
              </span>
            ))}
          </div>

          {/* Custom floating tooltip */}
          {hoveredIndex !== null && filteredData[hoveredIndex] && (
            <div className="absolute top-2 left-1/2 transform -translate-x-1/2 bg-zinc-900 dark:bg-zinc-50 text-white dark:text-zinc-950 text-[10px] font-extrabold py-1 px-3 rounded-lg shadow-sm pointer-events-none z-20">
              {filteredData[hoveredIndex].label}: {filteredData[hoveredIndex].value.toLocaleString("vi-VN")}₫
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
