import { Download, Pencil } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

type PlanPerformanceRow = {
  plan: string;
  description: string;
  activeUsers: number;
  conversion: string;
  revenue: string;
  retention: number;
  badge: string;
};

function ConversionBadge({
  value,
  type,
}: {
  value: string;
  type: "free" | "start" | "premium";
}) {
  if (type === "free") {
    return <Badge variant="secondary">{value}</Badge>;
  }

  if (type === "start") {
    return (
      <Badge className="bg-emerald-50 text-emerald-600 hover:bg-emerald-50">
        {value}
      </Badge>
    );
  }

  return (
    <Badge className="bg-primary/10 text-primary hover:bg-primary/10">
      {value}
    </Badge>
  );
}

function PlanIcon({ type }: { type: "free" | "start" | "premium" }) {
  const color =
    type === "premium"
      ? "bg-primary/10 text-primary"
      : type === "start"
        ? "bg-blue-50 text-blue-600"
        : "bg-slate-100 text-slate-500";

  return <div className={`h-9 w-9 rounded-2xl ${color}`} />;
}

export function PlanPerformanceTable({
  rows,
}: {
  rows: PlanPerformanceRow[];
}) {
  return (
    <Card className="rounded-2xl border-border/60 shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-xl font-semibold">
          Ma trận hiệu suất gói
        </CardTitle>

        <Button variant="outline" className="rounded-2xl">
          <Download className="mr-2 h-4 w-4" />
          Export Report
        </Button>
      </CardHeader>

      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[920px] table-auto">
            <thead>
              <tr className="border-b text-left text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                <th className="px-2 py-4">Plan Name</th>
                <th className="px-2 py-4">Active Users</th>
                <th className="px-2 py-4">Conv. Rate</th>
                <th className="px-2 py-4">Monthly Revenue</th>
                <th className="px-2 py-4">Retention</th>
                <th className="px-2 py-4 text-right">Action</th>
              </tr>
            </thead>

            <tbody>
              {rows.map((row) => (
                <tr key={row.plan} className="border-b last:border-0">
                  <td className="px-2 py-4">
                    <div className="flex items-center gap-4">
                      <PlanIcon
                        type={row.badge as "free" | "start" | "premium"}
                      />
                      <div>
                        <div className="text-lg font-semibold tracking-tight">
                          {row.plan}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {row.description}
                        </div>
                      </div>
                    </div>
                  </td>

                  <td className="px-2 py-4 text-lg font-semibold tracking-tight">
                    {row.activeUsers.toLocaleString()}
                  </td>

                  <td className="px-2 py-4">
                    <ConversionBadge
                      value={row.conversion}
                      type={row.badge as "free" | "start" | "premium"}
                    />
                  </td>

                  <td className="px-2 py-4 text-lg font-semibold tracking-tight">
                    {row.revenue}
                  </td>

                  <td className="px-2 py-4">
                    <div className="w-32 space-y-2">
                      <div className="text-lg font-semibold tracking-tight">
                        {row.retention}%
                      </div>
                      <Progress value={row.retention} className="h-2" />
                    </div>
                  </td>

                  <td className="px-2 py-4 text-right">
                    <Button variant="ghost" size="icon" className="rounded-xl">
                      <Pencil className="h-3 w-3" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
