import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const items = [
  { label: "Free", value: 63, color: "bg-slate-300" },
  { label: "Start", value: 27, color: "bg-slate-500" },
  { label: "Premium", value: 10, color: "bg-primary" },
];

export function PlanDistributionCard() {
  const free = 63;
  const start = 27;
  const premium = 10;

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
              <div className="text-2xl font-semibold tracking-tight">12.8k</div>
              <div className="text-sm font-medium text-muted-foreground">
                TOTAL
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          {items.map((item) => (
            <div key={item.label} className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className={`h-3 w-3 rounded-full ${item.color}`} />
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
