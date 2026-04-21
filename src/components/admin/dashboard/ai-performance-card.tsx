import { CreditCard, TrendingUp } from "lucide-react";

import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

const plans = [
  {
    name: "Free (Miễn phí)",
    percent: 45,
    color: "bg-gray-300",
  },
  {
    name: "Start (399k/tháng)",
    percent: 35,
    color: "bg-blue-500",
  },
  {
    name: "Premium (799k/tháng)",
    percent: 20,
    color: "bg-indigo-600",
  },
];

export function AiPerformanceCard() {
  return (
    <Card className="rounded-2xl bg-card">
      <div className="p-5">
        {/* Header */}
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

        {/* Plans */}
        <div className="mt-4 space-y-4">
          {plans.map((plan) => (
            <div key={plan.name} className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">{plan.name}</span>
                <span className="font-medium">{plan.percent}%</span>
              </div>

              <div className="h-2 w-full rounded-full bg-muted">
                <div
                  className={`h-2 rounded-full ${plan.color}`}
                  style={{ width: `${plan.percent}%` }}
                />
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="mt-5 rounded-xl border bg-background/40 p-3 flex items-center gap-2">
          <TrendingUp className="size-4 text-emerald-600" />
          <span className="text-sm font-medium">
            Tăng trưởng ổn định (7.8 / 10)
          </span>
        </div>
      </div>
    </Card>
  );
}
