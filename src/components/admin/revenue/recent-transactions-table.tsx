import { ArrowRight } from "lucide-react";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const transactions = [
  {
    id: "1",
    name: "John Doe",
    initials: "JD",
    plan: "Premium",
    amount: "$49.00",
    date: "Oct 24, 2023",
    status: "Success",
  },
  {
    id: "2",
    name: "Sarah Miller",
    initials: "SM",
    plan: "Start",
    amount: "$19.00",
    date: "Oct 23, 2023",
    status: "Pending",
  },
  {
    id: "3",
    name: "Robert Kang",
    initials: "RK",
    plan: "Premium",
    amount: "$49.00",
    date: "Oct 22, 2023",
    status: "Success",
  },
  {
    id: "4",
    name: "Amanda Lee",
    initials: "AL",
    plan: "Free",
    amount: "$0.00",
    date: "Oct 21, 2023",
    status: "Success",
  },
];

function StatusBadge({ status }: { status: string }) {
  if (status === "Success") {
    return (
      <Badge className="rounded-full bg-emerald-50 text-emerald-600 hover:bg-emerald-50">
        ● Success
      </Badge>
    );
  }

  if (status === "Pending") {
    return (
      <Badge className="rounded-full bg-amber-50 text-amber-600 hover:bg-amber-50">
        ● Pending
      </Badge>
    );
  }

  return <Badge variant="secondary">{status}</Badge>;
}

function PlanBadge({ plan }: { plan: string }) {
  if (plan === "Premium") {
    return (
      <Badge className="rounded-full bg-primary/10 text-primary hover:bg-primary/10">
        {plan}
      </Badge>
    );
  }

  if (plan === "Start") {
    return (
      <Badge className="rounded-full bg-orange-50 text-orange-600 hover:bg-orange-50">
        {plan}
      </Badge>
    );
  }

  return (
    <Badge className="rounded-full bg-slate-100 text-slate-600 hover:bg-slate-100">
      {plan}
    </Badge>
  );
}

export function RecentTransactionsTable() {
  return (
    <Card className="rounded-3xl border-border/60 shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-lg font-semibold">
            Giao dịch gần đây
          </CardTitle>
          <p className="mt-1 text-sm text-muted-foreground">
            Theo dõi trạng thái thanh toán và doanh thu phát sinh mới nhất.
          </p>
        </div>

        <button
          type="button"
          className="inline-flex items-center gap-1 text-sm font-medium text-primary"
        >
          Xem toàn bộ
          <ArrowRight className="h-4 w-4" />
        </button>
      </CardHeader>

      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] table-auto">
            <thead>
              <tr className="border-b text-left text-xs uppercase tracking-wide text-muted-foreground">
                <th className="px-2 py-3 font-medium">Người dùng</th>
                <th className="px-2 py-3 font-medium">Gói</th>
                <th className="px-2 py-3 font-medium">Số tiền</th>
                <th className="px-2 py-3 font-medium">Ngày</th>
                <th className="px-2 py-3 font-medium">Trạng thái</th>
              </tr>
            </thead>

            <tbody>
              {transactions.map((item) => (
                <tr key={item.id} className="border-b last:border-0">
                  <td className="px-2 py-4">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-9 w-9">
                        <AvatarFallback className="bg-slate-100 text-xs font-medium text-slate-700">
                          {item.initials}
                        </AvatarFallback>
                      </Avatar>

                      <div className="font-medium">{item.name}</div>
                    </div>
                  </td>

                  <td className="px-2 py-4">
                    <PlanBadge plan={item.plan} />
                  </td>

                  <td className="px-2 py-4 font-medium">{item.amount}</td>
                  <td className="px-2 py-4 text-sm text-muted-foreground">
                    {item.date}
                  </td>
                  <td className="px-2 py-4">
                    <StatusBadge status={item.status} />
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
