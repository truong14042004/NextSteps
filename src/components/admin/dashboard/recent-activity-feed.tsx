import { Activity, BrainCircuit, CheckCircle2, FileText, UploadCloud, UserPlus } from "lucide-react";
import Link from "next/link";
import { Card } from "@/components/ui/card";

export type ActivityItem = {
  id: string;
  type: "register" | "upload_cv" | "create_jd" | "interview" | "payment";
  user: string;
  time: Date;
  detail: string;
};

const iconMap = {
  register: { icon: UserPlus, color: "text-emerald-500 bg-emerald-500/10 border-emerald-500/20" },
  upload_cv: { icon: UploadCloud, color: "text-blue-500 bg-blue-500/10 border-blue-500/20" },
  create_jd: { icon: FileText, color: "text-amber-500 bg-amber-500/10 border-amber-500/20" },
  interview: { icon: BrainCircuit, color: "text-purple-500 bg-purple-500/10 border-purple-500/20" },
  payment: { icon: CheckCircle2, color: "text-red-500 bg-red-500/10 border-red-500/20" },
};

function timeAgo(date: Date | string) {
  const d = new Date(date);
  const diff = Date.now() - d.getTime();
  const sec = Math.floor(diff / 1000);
  if (sec < 60) return `Vừa xong`;
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}m trước`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h trước`;
  const days = Math.floor(hr / 24);
  if (days < 7) return `${days}d trước`;
  return d.toLocaleDateString("vi-VN");
}

export function RecentActivityFeed({ activities }: { activities: ActivityItem[] }) {
  return (
    <Card className="rounded-[20px] border border-border/40 bg-card shadow-sm h-full flex flex-col justify-between">
      <div className="p-4 flex-1 flex flex-col justify-between gap-3">
        <div className="flex items-center justify-between border-b border-border/40 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="rounded-xl bg-purple-500/10 p-2 text-purple-500 border border-purple-500/10 shrink-0">
              <Activity className="size-4.5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-foreground leading-none">
                Hoạt động gần đây
              </h2>
              <p className="text-[10px] text-muted-foreground/80 mt-1 leading-none">
                Sự kiện thời gian thực
              </p>
            </div>
          </div>
          <Link
            href="/admin/user-management"
            className="text-[10px] font-bold text-primary hover:underline"
          >
            Xem tất cả
          </Link>
        </div>

        {activities.length === 0 ? (
          <div className="py-8 text-center text-xs text-muted-foreground flex-1 flex items-center justify-center">
            Không có hoạt động mới
          </div>
        ) : (
          <div className="relative pl-6 flex-1 flex flex-col justify-center space-y-2 before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-[1.5px] before:bg-border/60">
            {activities.map((item) => {
              const config = iconMap[item.type] ?? iconMap.register;
              const Icon = config.icon;

              return (
                <div
                  key={item.id}
                  className="relative flex items-start justify-between gap-3 p-1.5 rounded-xl hover:bg-muted/40 transition-all duration-200 group/item hover:translate-x-0.5"
                >
                  {/* Timeline Icon Node */}
                  <div className={`absolute -left-[20px] top-2 flex size-[18px] items-center justify-center rounded-full border ${config.color} bg-card shadow-sm group-hover/item:scale-105 transition-transform`}>
                    <Icon className="size-2.5" />
                  </div>

                  <div className="space-y-0.5 flex-1 pl-2.5">
                    <p className="text-xs font-bold text-foreground leading-none">
                      {item.user}
                    </p>
                    <p className="text-[10px] text-muted-foreground leading-tight">
                      {item.detail}
                    </p>
                  </div>

                  <span className="text-[9px] font-semibold text-muted-foreground/60 whitespace-nowrap self-start mt-0.5">
                    {timeAgo(item.time)}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </Card>
  );
}
