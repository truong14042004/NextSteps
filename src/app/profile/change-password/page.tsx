import Link from "next/link"
import { ArrowLeft, ShieldCheck, Key, HelpCircle } from "lucide-react"

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { getCurrentUser } from "@/services/clerk/lib/getCurrentUser"
import ChangePasswordClient from "./ChangePasswordClient"

export default async function ChangePasswordPage() {
  const { userId, user, redirectToSignIn } = await getCurrentUser({
    allData: true,
  })

  if (userId == null) redirectToSignIn()

  const backHref = user?.role === "admin" ? "/admin/profile" : "/profile"

  return (
    <div className="min-h-screen bg-slate-50/50 dark:bg-slate-950/20">
      <div className="container max-w-4xl py-8 space-y-6">
        {/* Back Link */}
        <div>
          <Link
            href={backHref}
            className="inline-flex items-center gap-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 transition-colors bg-white dark:bg-white/5 border border-slate-200/50 dark:border-white/5 px-3 py-1.5 rounded-xl shadow-sm"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Quay lại Hồ sơ
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Form Column */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="rounded-3xl border-slate-100 dark:border-white/5 bg-white dark:bg-slate-900/50 shadow-sm">
              <CardHeader className="pb-3 border-b border-slate-50 dark:border-white/5">
                <CardTitle className="text-base font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                  <Key className="h-4 w-4 text-rose-500" />
                  Đổi mật khẩu
                </CardTitle>
                <CardDescription className="text-xs text-slate-400">
                  Cập nhật mật khẩu định kỳ giúp tài khoản của bạn luôn được bảo vệ an toàn.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                <ChangePasswordClient />
              </CardContent>
            </Card>
          </div>

          {/* Right Security Column */}
          <div className="space-y-6">
            <Card className="rounded-3xl border-slate-100 dark:border-white/5 bg-white dark:bg-slate-900/50 shadow-sm overflow-hidden">
              <CardHeader className="pb-3 border-b border-slate-50 dark:border-white/5 bg-gradient-to-br from-indigo-500/5 to-rose-500/5 dark:from-indigo-500/10 dark:to-rose-500/10">
                <CardTitle className="text-sm font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                  <ShieldCheck className="h-4.5 w-4.5 text-emerald-500" />
                  Thông tin bảo mật
                </CardTitle>
              </CardHeader>
              <CardContent className="p-5 space-y-5">
                {/* Security items */}
                <div className="space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Lần đổi gần nhất</span>
                  <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Chưa thay đổi gần đây (Tài khoản mới)
                  </p>
                </div>

                <div className="space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Trạng thái bảo mật</span>
                  <div>
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                      An toàn
                    </span>
                  </div>
                </div>

                <hr className="border-slate-100 dark:border-white/5" />

                {/* Strong password tips */}
                <div className="space-y-2.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                    <HelpCircle className="h-3 w-3 text-slate-400" />
                    Mẹo đặt mật khẩu mạnh
                  </span>
                  <ul className="text-xs text-slate-500 dark:text-slate-400 space-y-2 pl-4 list-disc">
                    <li>Sử dụng ít nhất 8 ký tự trở lên.</li>
                    <li>Kết hợp chữ hoa, chữ thường và chữ số.</li>
                    <li>Sử dụng ít nhất một ký tự đặc biệt (!, @, #, $, ...).</li>
                    <li>Tránh sử dụng thông tin cá nhân dễ đoán như ngày sinh, tên của bạn.</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
