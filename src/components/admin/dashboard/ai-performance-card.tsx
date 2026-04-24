import { CreditCard, TrendingUp } from "lucide-react";

import { Card } from "@/components/ui/card";

const colors = ["bg-gray-300", "bg-blue-500", "bg-indigo-600"];

export function AiPerformanceCard({
  distribution,
}: {
  distribution: { label: string; value: number }[];
}) {
  return (
    <Card className="rounded-2xl bg-card">
      <div className="p-5">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2">
              <CreditCard className="size-5 text-primary" />
              <h2 className="text-base font-semibold">
                Phân tích phân phối đăng ký
              </h2>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              Phân tích và hiệu suất gói mua người dùng
            </p>
          </div>
        </div>

        <div className="mt-4 space-y-4">
          {distribution.map((plan, index) => (
            <div key={plan.label} className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">{plan.label}</span>
                <span className="font-medium">{plan.value}%</span>
              </div>

              <div className="h-2 w-full rounded-full bg-muted">
                <div
                  className={`h-2 rounded-full ${colors[index] ?? "bg-primary"}`}
                  style={{ width: `${plan.value}%` }}
                />
              </div>
            </div>
          ))}
        </div>

        <div className="mt-5 flex items-center gap-2 rounded-xl border bg-background/40 p-3">
          <TrendingUp className="size-4 text-emerald-600" />
          <span className="text-sm font-medium">
            Dữ liệu được đồng bộ từ người dùng hiện có
          </span>
        </div>
      </div>
    </Card>
  );
}
