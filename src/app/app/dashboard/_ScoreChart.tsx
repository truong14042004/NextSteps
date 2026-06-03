"use client"

import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"

type Point = {
  date: string
  score: number
  total: number
  percent: number
}

export function ScoreChart({ points }: { points: Point[] }) {
  if (points.length === 0) {
    return (
      <div className="h-48 flex items-center justify-center text-sm text-muted-foreground">
        Chưa có dữ liệu — làm quiz đầu tiên để xem biểu đồ
      </div>
    )
  }

  return (
    <div className="h-48 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={points} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
          <XAxis dataKey="date" tick={{ fontSize: 11 }} />
          <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
          <Tooltip
            content={({ active, payload }) => {
              if (!active || !payload?.length) return null
              const p = payload[0].payload as Point
              return (
                <div className="rounded-md border bg-background p-2 text-xs shadow-sm">
                  <div className="font-medium">{p.date}</div>
                  <div className="text-muted-foreground">
                    {p.score}/{p.total} câu ({p.percent}%)
                  </div>
                </div>
              )
            }}
          />
          <Line
            type="monotone"
            dataKey="percent"
            stroke="hsl(var(--primary))"
            strokeWidth={2}
            dot={{ r: 3 }}
            activeDot={{ r: 5 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
