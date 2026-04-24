import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type PlanDistribution = {
  total: number;
  items: { label: string; value: number; count: number }[];
};

const colors = ["bg-slate-300", "bg-slate-500", "bg-primary"];

export function PlanDistributionCard({
  distribution,
}: {
  distribution: PlanDistribution;
}) {
  const free = distribution.items[0]?.value ?? 0;
  const start = distribution.items[1]?.value ?? 0;
  const premium = distribution.items[2]?.value ?? 0;

  const background = `conic-gradient(
    #1e3a8a 0% ${premium}%,
    #64748b ${premium}% ${premium + start}%,
    #cbd5e1 ${premium + start}% 100%
  )`;

  return (
    <Card className="rounded-xl border-border/60 shadow-sm">
      <CardHeader>
        <CardTitle className="text-xl font-semibold">Phân bổ gói</CardTitle>
      </CardHeader>

      <CardContent className="space-y-8">
        <div className="flex justify-center pt-2">
          <div
            className="relative flex h-36 w-36 items-center justify-center rounded-full"
            style={{ background }}
          >
            <div className="flex h-28 w-28 flex-col items-center justify-center rounded-full bg-background shadow-sm">
              <div className="text-2xl font-semibold tracking-tight">
                {distribution.total.toLocaleString()}
              </div>
              <div className="text-sm font-medium text-muted-foreground">
                TOTAL
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          {distribution.items.map((item, index) => (
            <div key={item.label} className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span
                  className={`h-3 w-3 rounded-full ${colors[index] ?? "bg-primary"}`}
                />
                <span className="text-base">{item.label}</span>
              </div>
              <span className="text-base font-semibold">{item.value}%</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
