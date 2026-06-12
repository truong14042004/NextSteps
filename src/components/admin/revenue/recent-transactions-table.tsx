import { ArrowRight } from "lucide-react";
import Link from "next/link";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type TransactionRow = {
  id: string;
  name: string;
  initials: string;
  plan: string;
  amount: string;
  date: string;
  status: string;
};

function StatusBadge({ status }: { status: string }) {
  if (status === "Success" || status === "paid" || status === "đã thanh toán") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 dark:bg-emerald-950/35 border border-emerald-100 dark:border-emerald-900/40 px-2 py-0.5 text-xs font-semibold text-emerald-700 dark:text-emerald-400">
        <span className="h-1 w-1 rounded-full bg-emerald-500" />
        Success
      </span>
    );
  }

  if (status === "Pending" || status === "pending" || status === "đang chờ") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 dark:bg-amber-950/35 border border-amber-100 dark:border-amber-900/40 px-2 py-0.5 text-xs font-semibold text-amber-700 dark:text-amber-400">
        <span className="h-1 w-1 rounded-full bg-amber-500" />
        Pending
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 dark:bg-rose-950/35 border border-rose-100 dark:border-rose-900/40 px-2 py-0.5 text-xs font-semibold text-rose-700 dark:text-rose-400">
      <span className="h-1 w-1 rounded-full bg-rose-500" />
      Failed
    </span>
  );
}

function PlanBadge({ plan }: { plan: string }) {
  const p = plan ?? "Free";

  if (p === "Premium") {
    return (
      <Badge className="bg-purple-50 hover:bg-purple-50 text-purple-700 border border-purple-100 dark:bg-purple-950/30 dark:border-purple-900/50 dark:text-purple-400 font-semibold px-2 py-0.5 text-xs rounded-md shadow-2xs">
        Premium
      </Badge>
    );
  }

  if (p === "Start") {
    return (
      <Badge className="bg-blue-50 hover:bg-blue-50 text-blue-700 border border-blue-100 dark:bg-blue-950/30 dark:border-blue-900/50 dark:text-blue-400 font-semibold px-2 py-0.5 text-xs rounded-md shadow-2xs">
        Start
      </Badge>
    );
  }

  return (
    <Badge className="bg-zinc-50 hover:bg-zinc-50 text-zinc-500 border border-zinc-150 dark:bg-zinc-850 dark:border-zinc-800 dark:text-zinc-400 font-semibold px-2 py-0.5 text-xs rounded-md shadow-2xs">
      Free
    </Badge>
  );
}

export function RecentTransactionsTable({
  transactions,
}: {
  transactions: TransactionRow[];
}) {
  const latestTransactions = transactions.slice(0, 5);

  return (
    <Card className="rounded-2xl border border-slate-100 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden shadow-xs">
      <CardHeader className="flex flex-row items-center justify-between border-b border-zinc-50 dark:border-zinc-800/50 p-5">
        <div>
          <CardTitle className="text-lg font-bold text-zinc-900 dark:text-zinc-50">
            Giao dịch gần đây
          </CardTitle>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            Theo dõi trạng thái thanh toán và doanh thu phát sinh mới nhất.
          </p>
        </div>

        <Link
          href="/admin/transaction-management"
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-zinc-900 hover:text-zinc-650 dark:text-zinc-100 dark:hover:text-zinc-350 transition-colors"
        >
          Xem tất cả
          <ArrowRight className="h-4 w-4" />
        </Link>
      </CardHeader>

      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] table-auto text-left border-collapse">
            <thead>
              <tr className="border-b border-zinc-100 dark:border-zinc-800 text-xs font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">
                <th className="px-6 py-4">User</th>
                <th className="px-6 py-4">Gói</th>
                <th className="px-6 py-4">Số tiền</th>
                <th className="px-6 py-4">Trạng thái</th>
                <th className="px-6 py-4">Ngày thanh toán</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-zinc-50 dark:divide-zinc-800/50">
              {latestTransactions.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-6 py-10 text-center text-sm text-zinc-400 dark:text-zinc-500"
                  >
                    Chưa có dữ liệu giao dịch
                  </td>
                </tr>
              ) : (
                latestTransactions.map((item) => (
                  <tr key={item.id} className="group transition-all duration-150 hover:bg-zinc-50/50 dark:hover:bg-zinc-800/30">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-9 w-9 rounded-lg ring-2 ring-zinc-100 dark:ring-zinc-800 transition-transform group-hover:scale-102">
                          <AvatarFallback className="bg-red-50 dark:bg-red-950/20 text-xs font-semibold text-red-600 dark:text-red-400 rounded-lg">
                            {item.initials}
                          </AvatarFallback>
                        </Avatar>

                        <div className="font-semibold text-sm text-zinc-900 dark:text-zinc-100">
                          {item.name}
                        </div>
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      <PlanBadge plan={item.plan} />
                    </td>

                    <td className="px-6 py-4 font-bold text-sm text-zinc-900 dark:text-zinc-50">
                      {item.amount}
                    </td>

                    <td className="px-6 py-4">
                      <StatusBadge status={item.status} />
                    </td>

                    <td className="px-6 py-4 text-xs font-medium text-zinc-550 dark:text-zinc-400">
                      {item.date}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
