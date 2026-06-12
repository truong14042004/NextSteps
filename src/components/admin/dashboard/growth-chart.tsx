"use client";

import { useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { BarChart3 } from "lucide-react";
import { cn } from "@/lib/utils";

type Point = { day: string; value: number };

export function GrowthChart({ data }: { data: Point[] }) {
  const chartData = useMemo(() => data || [], [data]);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const maxValue = useMemo(() => {
    return Math.max(1, ...chartData.map((item) => item.value));
  }, [chartData]);

  return (
    <Card className="rounded-[20px] border border-slate-100 dark:border-zinc-800 bg-white/70 dark:bg-zinc-900/70 shadow-xs backdrop-blur-xs h-full flex flex-col justify-between">
      <div className="p-4 flex-1 flex flex-col justify-between gap-3">
        {/* Module Header */}
        <div className="flex items-center gap-2.5 border-b border-zinc-100 dark:border-zinc-800/60 pb-3">
          <div className="rounded-xl bg-gradient-to-br from-blue-500 to-indigo-500 p-2 text-white shadow-xs shrink-0 animate-pulse-slow">
            <BarChart3 className="size-4.5" />
          </div>
          <div className="flex-1">
            <h2 className="text-sm font-bold text-zinc-900 dark:text-zinc-50 leading-none">
              Tăng trưởng người dùng
            </h2>
            <p className="text-[10px] text-zinc-500 dark:text-zinc-400 mt-1 leading-none">
              Đăng ký trong 30 ngày qua
            </p>
          </div>
          <span className="inline-flex items-center rounded-full bg-blue-500/10 px-2 py-0.5 text-[9px] font-semibold text-blue-600 dark:text-blue-400 ring-1 ring-inset ring-blue-500/20 shrink-0">
            Organic
          </span>
        </div>

        {/* Line Chart Area */}
        <div className="relative h-[140px] w-full mt-1">
          {chartData.length > 0 ? (
            <div className="relative w-full h-full">
              <svg className="w-full h-full overflow-visible" viewBox="0 0 500 120" preserveAspectRatio="none">
                <defs>
                  <linearGradient id="user-growth-area-gradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.22" />
                    <stop offset="100%" stopColor="#6366f1" stopOpacity="0.00" />
                  </linearGradient>
                  <linearGradient id="user-growth-stroke-gradient" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#3b82f6" />
                    <stop offset="100%" stopColor="#6366f1" />
                  </linearGradient>
                </defs>

                {/* Grid Lines */}
                <line x1="0" y1="24" x2="500" y2="24" stroke="currentColor" strokeOpacity="0.04" strokeDasharray="3" className="text-zinc-500" />
                <line x1="0" y1="48" x2="500" y2="48" stroke="currentColor" strokeOpacity="0.04" strokeDasharray="3" className="text-zinc-500" />
                <line x1="0" y1="72" x2="500" y2="72" stroke="currentColor" strokeOpacity="0.04" strokeDasharray="3" className="text-zinc-500" />
                <line x1="0" y1="96" x2="500" y2="96" stroke="currentColor" strokeOpacity="0.04" strokeDasharray="3" className="text-zinc-500" />
                <line x1="0" y1="120" x2="500" y2="120" stroke="currentColor" strokeOpacity="0.08" className="text-zinc-500" />

                {(() => {
                  const points = chartData.map((item, idx) => {
                    const x = (idx / Math.max(1, chartData.length - 1)) * 480 + 10;
                    const y = 110 - (item.value / maxValue) * 90;
                    return { x, y, value: item.value, day: item.day, idx };
                  });

                  const getCurvePath = (pts: { x: number; y: number }[]) => {
                    if (pts.length === 0) return "";
                    let path = `M ${pts[0].x} ${pts[0].y}`;
                    for (let i = 0; i < pts.length - 1; i++) {
                      const p0 = pts[i];
                      const p1 = pts[i + 1];
                      // S-curve control points
                      const cp1x = p0.x + (p1.x - p0.x) / 3;
                      const cp1y = p0.y;
                      const cp2x = p0.x + 2 * (p1.x - p0.x) / 3;
                      const cp2y = p1.y;
                      path += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p1.x} ${p1.y}`;
                    }
                    return path;
                  };

                  const pathD = getCurvePath(points);
                  const areaD = pathD ? `${pathD} L ${points[points.length - 1].x} 120 L ${points[0].x} 120 Z` : "";

                  return (
                    <>
                      {/* Gradient Fill under spline */}
                      {areaD && <path d={areaD} fill="url(#user-growth-area-gradient)" />}

                      {/* Smooth spline stroke */}
                      {pathD && (
                        <path
                          d={pathD}
                          fill="none"
                          stroke="url(#user-growth-stroke-gradient)"
                          strokeWidth="2.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      )}

                      {/* Interactive hover tracking vertical lines */}
                      {points.map((p) => (
                        <g key={p.idx}>
                          {hoveredIndex === p.idx && (
                            <line
                              x1={p.x}
                              y1={10}
                              x2={p.x}
                              y2={120}
                              stroke="currentColor"
                              strokeOpacity="0.15"
                              strokeWidth="1"
                              strokeDasharray="2 2"
                              className="text-zinc-500"
                            />
                          )}
                          <rect
                            x={p.x - 10}
                            y={0}
                            width={20}
                            height={120}
                            fill="transparent"
                            className="cursor-pointer"
                            onMouseEnter={() => setHoveredIndex(p.idx)}
                            onMouseLeave={() => setHoveredIndex(null)}
                          />
                        </g>
                      ))}

                      {/* Floating hover highlights (dots) */}
                      {points.map((p) => {
                        const isHovered = hoveredIndex === p.idx;
                        return (
                          <circle
                            key={p.idx}
                            cx={p.x}
                            cy={p.y}
                            r={isHovered ? 5.5 : 3.5}
                            className={cn(
                              "pointer-events-none transition-all duration-200 fill-white stroke-[2px] stroke-blue-500",
                              isHovered && "fill-blue-600 stroke-white stroke-[1.5px] shadow-sm"
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
            <div className="flex h-full items-center justify-center text-xs text-zinc-400">
              Không có dữ liệu
            </div>
          )}

          {/* Floating custom tooltip */}
          {hoveredIndex !== null && chartData[hoveredIndex] && (
            <div className="absolute -top-12 left-1/2 transform -translate-x-1/2 bg-zinc-900/95 dark:bg-white/95 text-white dark:text-zinc-900 text-[10px] font-extrabold py-1.5 px-3 rounded-xl shadow-lg border border-zinc-800 dark:border-zinc-200/50 backdrop-blur-xs flex flex-col items-center pointer-events-none z-50">
              <span className="opacity-70 font-semibold">{chartData[hoveredIndex].day}</span>
              <span className="text-blue-400 dark:text-blue-600 mt-0.5">{chartData[hoveredIndex].value.toLocaleString()} lượt đăng ký</span>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}

