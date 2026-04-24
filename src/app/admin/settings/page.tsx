import { getAdminActivitySummary } from "@/features/admin/metrics";

export default async function AdminSettingsPage() {
  const summary = await getAdminActivitySummary();

  return (
    <div className="space-y-6">
      <section>
        <h1 className="text-2xl font-semibold tracking-tight">Cài đặt</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Tổng quan cấu hình hệ thống và dữ liệu vận hành hiện tại.
        </p>
      </section>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryCard label="Người dùng" value={summary.users} />
        <SummaryCard label="Hồ sơ công việc" value={summary.jobInfos} />
        <SummaryCard label="Phỏng vấn" value={summary.interviews} />
        <SummaryCard label="Câu hỏi" value={summary.questions} />
      </section>
    </div>
  );
}

function SummaryCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border bg-card p-5 shadow-sm">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="mt-2 text-2xl font-semibold tracking-tight">
        {value.toLocaleString()}
      </p>
    </div>
  );
}
