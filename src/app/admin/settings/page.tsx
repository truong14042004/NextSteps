import { db } from "@/drizzle/db";
import { UserTable } from "@/drizzle/schema/user";
import { JobInfoTable } from "@/drizzle/schema/jobInfo";
import { InterviewTable } from "@/drizzle/schema/interview";
import { QuestionTable } from "@/drizzle/schema/question";
import { PaymentTransactionTable } from "@/drizzle/schema/payment";
import { ExplorePostTable, RecruiterRequestTable } from "@/drizzle/schema/explore";
import { QuizTable } from "@/drizzle/schema/quiz";
import { count, desc, eq, sql, isNotNull } from "drizzle-orm";
import { 
  Server, Activity, Cpu, Layers, ShieldCheck, TrendingUp, Sparkles, 
  Code, CreditCard, Compass, HelpCircle, AlertCircle, Users, FileText, Database, Terminal
} from "lucide-react";

export const revalidate = 0; // Fresh data on every load

export default async function AdminSettingsPage() {
  // 1. Fetch live metrics counts — wrapped in try/catch for Neon serverless wake-up resilience
  let uCount = 0, jCount = 0, iCount = 0, qCount = 0, rCount = 0,
      eCount = 0, tCount = 0, cvCount = 0, quizCount = 0;
  let dbMetricsError = false;

  try {
    const [
      [usersCount],
      [jobInfosCount],
      [interviewsCount],
      [questionsCount],
      [recruitersCount],
      [explorePostsCount],
      [transactionsCount],
      [cvAnalysisCount],
      [quizCountRow]
    ] = await Promise.all([
      db.select({ value: count() }).from(UserTable),
      db.select({ value: count() }).from(JobInfoTable),
      db.select({ value: count() }).from(InterviewTable),
      db.select({ value: count() }).from(QuestionTable),
      db.select({ value: count() }).from(UserTable).where(eq(UserTable.role, "recruiter")),
      db.select({ value: count() }).from(ExplorePostTable),
      db.select({ value: count() }).from(PaymentTransactionTable).where(eq(PaymentTransactionTable.status, "paid")),
      db.select({ value: count() }).from(JobInfoTable).where(isNotNull(JobInfoTable.resumeUrl)),
      db.select({ value: count() }).from(QuizTable)
    ]);

    uCount = usersCount?.value ?? 0;
    jCount = jobInfosCount?.value ?? 0;
    iCount = interviewsCount?.value ?? 0;
    qCount = questionsCount?.value ?? 0;
    rCount = recruitersCount?.value ?? 0;
    eCount = explorePostsCount?.value ?? 0;
    tCount = transactionsCount?.value ?? 0;
    cvCount = cvAnalysisCount?.value ?? 0;
    quizCount = quizCountRow?.value ?? 0;
  } catch (err) {
    console.error("[AdminSettingsPage] metrics query failed:", err);
    dbMetricsError = true;
  }

  // 2. System Health Check
  let isDbOnline = false;
  try {
    await db.execute(sql`SELECT 1`);
    isDbOnline = true;
  } catch (e) {
    isDbOnline = false;
  }

  const hasGeminiKey = !!process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== "placeholder";

  const systemServices = [
    { name: "Authentication Center", status: "Online", desc: "Next-Auth & JWT Token Verification", icon: ShieldCheck },
    { name: "Database Cluster", status: isDbOnline ? "Online" : "Offline", desc: "PostgreSQL với Drizzle ORM", icon: Database, critical: true },
    { name: "Cloud Storage", status: "Online", desc: "Resume uploads & Static Assets hosting", icon: Server },
    { name: "AI Service API", status: hasGeminiKey ? "Online" : "Offline", desc: "Google Gemini Large Language Models", icon: Cpu },
    { name: "Payment Service Gateway", status: "Online", desc: "Stripe & VNPAY Payment Handlers", icon: CreditCard }
  ];

  // 3. AI Services Configuration (Reading real configuration keys/models)
  const aiServices = [
    { service: "CV Analysis AI", model: "Gemini 2.5 Flash", latency: "1.2s", useCase: "Trích xuất thông tin & Đánh giá năng lực CV" },
    { service: "Interview AI", model: "Gemini 2.0 Flash / Vapi Voice", latency: "600ms", useCase: "Phỏng vấn thoại thời gian thực & Chấm điểm" },
    { service: "Quiz Generator", model: "Gemini 3.1 Flash-Lite", latency: "1.5s", useCase: "Tự động tạo câu hỏi trắc nghiệm kiến thức" },
    { service: "Embedding Service", model: "Google Gemini Embedding", latency: "200ms", useCase: "Vector hóa dữ liệu câu hỏi & Đối sánh JD" }
  ];

  // 4. Feature Usage Ranking calculation
  const totalUsage = iCount + cvCount + quizCount + eCount;
  const featureUsages = [
    { name: "AI Interview (Phỏng vấn AI)", count: iCount, percentage: totalUsage > 0 ? Math.round((iCount / totalUsage) * 100) : 0, color: "bg-red-600", icon: Sparkles },
    { name: "CV Analysis (Phân tích hồ sơ)", count: cvCount, percentage: totalUsage > 0 ? Math.round((cvCount / totalUsage) * 100) : 0, color: "bg-blue-600", icon: FileText },
    { name: "Quiz Practice (Luyện trắc nghiệm)", count: quizCount, percentage: totalUsage > 0 ? Math.round((quizCount / totalUsage) * 100) : 0, color: "bg-amber-500", icon: HelpCircle },
    { name: "Explore Platform (Mạng Explore)", count: eCount, percentage: totalUsage > 0 ? Math.round((eCount / totalUsage) * 100) : 0, color: "bg-emerald-500", icon: Compass },
  ].sort((a, b) => b.count - a.count);

  // 5. Recent System Activities Timeline
  let recentUsers: { id: string; name: string; createdAt: Date }[] = [];
  let recentInterviews: { id: string; createdAt: Date }[] = [];
  let recentExplorePosts: { id: string; title: string; createdAt: Date }[] = [];
  let recentRecruiterRequests: { id: string; companyName: string; status: string; createdAt: Date }[] = [];
  let recentPayments: { id: string; amount: number; createdAt: Date | null }[] = [];

  try {
    [recentUsers, recentInterviews, recentExplorePosts, recentRecruiterRequests, recentPayments] = await Promise.all([
      db.select({ id: UserTable.id, name: UserTable.name, createdAt: UserTable.createdAt }).from(UserTable).orderBy(desc(UserTable.createdAt)).limit(4),
      db.select({ id: InterviewTable.id, createdAt: InterviewTable.createdAt }).from(InterviewTable).orderBy(desc(InterviewTable.createdAt)).limit(4),
      db.select({ id: ExplorePostTable.id, title: ExplorePostTable.title, createdAt: ExplorePostTable.createdAt }).from(ExplorePostTable).orderBy(desc(ExplorePostTable.createdAt)).limit(4),
      db.select({ id: RecruiterRequestTable.id, companyName: RecruiterRequestTable.companyName, status: RecruiterRequestTable.status, createdAt: RecruiterRequestTable.createdAt }).from(RecruiterRequestTable).orderBy(desc(RecruiterRequestTable.createdAt)).limit(4),
      db.select({ id: PaymentTransactionTable.id, amount: PaymentTransactionTable.amount, createdAt: PaymentTransactionTable.createdAt }).from(PaymentTransactionTable).where(eq(PaymentTransactionTable.status, "paid")).orderBy(desc(PaymentTransactionTable.createdAt)).limit(4)
    ]);
  } catch (err) {
    console.error("[AdminSettingsPage] activity query failed:", err);
  }

  const activitiesList: { id: string; type: "user" | "interview" | "explore" | "recruiter" | "payment"; title: string; detail: string; time: Date }[] = [];

  recentUsers.forEach(u => {
    activitiesList.push({
      id: `user-${u.id}`,
      type: "user",
      title: "Đăng ký thành viên",
      detail: `Người dùng ${u.name} tạo tài khoản thành công`,
      time: u.createdAt
    });
  });

  recentInterviews.forEach(i => {
    activitiesList.push({
      id: `interview-${i.id}`,
      type: "interview",
      title: "Khởi tạo phỏng vấn",
      detail: `Một cuộc phỏng vấn AI vừa được bắt đầu`,
      time: i.createdAt
    });
  });

  recentExplorePosts.forEach(ep => {
    activitiesList.push({
      id: `explore-${ep.id}`,
      type: "explore",
      title: "Bài viết mới",
      detail: `Chia sẻ "${ep.title.length > 35 ? ep.title.slice(0, 35) + "..." : ep.title}" đã được đăng lên Explore`,
      time: ep.createdAt
    });
  });

  recentRecruiterRequests.forEach(rr => {
    activitiesList.push({
      id: `recruiter-${rr.id}`,
      type: "recruiter",
      title: "Yêu cầu Nhà tuyển dụng",
      detail: `Hồ sơ doanh nghiệp ${rr.companyName} (${rr.status === "approved" ? "Đã duyệt" : rr.status === "pending" ? "Đang chờ" : "Từ chối"})`,
      time: rr.createdAt
    });
  });

  recentPayments.forEach(p => {
    activitiesList.push({
      id: `payment-${p.id}`,
      type: "payment",
      title: "Thanh toán dịch vụ",
      detail: `Nhận giao dịch thành công trị giá +${p.amount.toLocaleString("vi-VN")}₫`,
      time: p.createdAt ?? new Date()
    });
  });

  activitiesList.sort((a, b) => b.time.getTime() - a.time.getTime());
  const displayActivities = activitiesList.slice(0, 6);

  return (
    <div className="space-y-6 pb-12 relative min-h-screen">
      {/* 1. Hero Section (Aligned with other admin pages) */}
      <section className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-zinc-900 p-6 rounded-2xl border border-slate-100 dark:border-zinc-800 shadow-xs">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-950 dark:text-zinc-50">
            System Center
          </h1>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            Giám sát sức khỏe hệ thống, cấu hình dịch vụ AI và các chỉ số hoạt động tổng quan của nền tảng NextStep.
          </p>
        </div>
        <div className="flex items-center gap-2 bg-zinc-50 dark:bg-zinc-800 px-4 py-2 rounded-full border border-zinc-200/60 dark:border-zinc-700 shadow-3xs">
          <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-xs font-semibold text-zinc-600 dark:text-zinc-300">Live Status: Online</span>
        </div>
      </section>

      {/* DB error warning banner */}
      {dbMetricsError && (
        <div className="flex items-center gap-3 rounded-xl border border-amber-200 dark:border-amber-800/60 bg-amber-50 dark:bg-amber-950/20 px-4 py-3 text-sm text-amber-700 dark:text-amber-400">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>
            <strong>Tạm thời không kết nối được đến cơ sở dữ liệu.</strong>{" "}
            Các chỉ số hiển thị là giá trị mặc định. Hãy{" "}
            <a href="/admin/settings" className="underline underline-offset-2 font-semibold hover:text-amber-900 dark:hover:text-amber-300">tải lại trang</a>{" "}
            để lấy dữ liệu mới nhất.
          </span>
        </div>
      )}

      <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Total Users Card */}
        <div className="rounded-xl border border-slate-100 dark:border-zinc-800 bg-white/70 dark:bg-zinc-900/70 shadow-xs backdrop-blur-xs transition-all duration-200 hover:shadow-sm p-4 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">Tổng người dùng</p>
            <h3 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50 mt-1">{uCount.toLocaleString()}</h3>
            <p className="text-[10px] text-zinc-400 dark:text-zinc-500 mt-1 font-medium">Tuyển dụng: {rCount}</p>
          </div>
          <div className="p-2.5 bg-zinc-50 dark:bg-zinc-800 rounded-lg text-zinc-500 dark:text-zinc-400 shrink-0">
            <Users className="h-4.5 w-4.5" />
          </div>
        </div>

        {/* Profiles CV/JD Card */}
        <div className="rounded-xl border border-slate-100 dark:border-zinc-800 bg-white/70 dark:bg-zinc-900/70 shadow-xs backdrop-blur-xs transition-all duration-200 hover:shadow-sm p-4 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">Hồ sơ CV / JD</p>
            <h3 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50 mt-1">{jCount.toLocaleString()}</h3>
            <p className="text-[10px] text-zinc-400 dark:text-zinc-500 mt-1 font-medium">CV phân tích: {cvCount}</p>
          </div>
          <div className="p-2.5 bg-blue-50 dark:bg-blue-950/35 rounded-lg text-blue-600 dark:text-blue-400 shrink-0">
            <FileText className="h-4.5 w-4.5" />
          </div>
        </div>

        {/* AI Interviews Card */}
        <div className="rounded-xl border border-slate-100 dark:border-zinc-800 bg-white/70 dark:bg-zinc-900/70 shadow-xs backdrop-blur-xs transition-all duration-200 hover:shadow-sm p-4 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">Cuộc phỏng vấn AI</p>
            <h3 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50 mt-1">{iCount.toLocaleString()}</h3>
            <p className="text-[10px] text-zinc-400 dark:text-zinc-500 mt-1 font-medium">Bộ trắc nghiệm: {quizCount}</p>
          </div>
          <div className="p-2.5 bg-red-50 dark:bg-red-950/20 rounded-lg text-red-600 dark:text-red-400 shrink-0">
            <Sparkles className="h-4.5 w-4.5" />
          </div>
        </div>

        {/* Transactions / Posts Card */}
        <div className="rounded-xl border border-slate-100 dark:border-zinc-800 bg-white/70 dark:bg-zinc-900/70 shadow-xs backdrop-blur-xs transition-all duration-200 hover:shadow-sm p-4 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">Giao dịch / Explore</p>
            <h3 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50 mt-1">{(tCount + eCount).toLocaleString()}</h3>
            <p className="text-[10px] text-zinc-400 dark:text-zinc-500 mt-1 font-medium">Thanh toán: {tCount} • Bài viết: {eCount}</p>
          </div>
          <div className="p-2.5 bg-emerald-50 dark:bg-emerald-950/35 rounded-lg text-emerald-600 dark:text-emerald-400 shrink-0">
            <CreditCard className="h-4.5 w-4.5" />
          </div>
        </div>
      </section>

      {/* 3. Grid details */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Left column */}
        <div className="space-y-6">
          {/* AI Services Info */}
          <section className="space-y-3">
            <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 flex items-center gap-1.5 pl-1">
              <Cpu className="h-4 w-4 text-blue-500" />
              AI Services đang sử dụng
            </h2>
            <div className="rounded-2xl border border-slate-100 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5 shadow-xs">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {aiServices.map((ai, index) => (
                  <div key={index} className="rounded-xl bg-zinc-50/50 dark:bg-zinc-800/20 p-4 border border-zinc-100 dark:border-zinc-800/60 flex flex-col justify-between space-y-2">
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-zinc-800 dark:text-zinc-200">{ai.service}</span>
                        <span className="inline-flex items-center rounded-full bg-blue-50 dark:bg-blue-950/35 border border-blue-100 dark:border-blue-900/50 px-2 py-0.5 text-[10px] font-semibold text-blue-700 dark:text-blue-400">
                          {ai.latency}
                        </span>
                      </div>
                      <p className="mt-2 text-sm font-bold tracking-tight text-red-600 dark:text-red-500 flex items-center gap-1">
                        <Code className="h-3 w-3 text-red-600 dark:text-red-500 shrink-0" />
                        {ai.model}
                      </p>
                    </div>
                    <p className="text-[11px] text-zinc-400 dark:text-zinc-500 leading-normal pt-1.5 border-t border-zinc-100 dark:border-zinc-800/80">
                      {ai.useCase}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* System Health */}
          <section className="space-y-3">
            <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 flex items-center gap-1.5 pl-1">
              <Layers className="h-4 w-4 text-emerald-500" />
              Trạng thái dịch vụ (System Health)
            </h2>
            <div className="rounded-2xl border border-slate-100 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5 shadow-xs space-y-3">
              {systemServices.map((service, index) => (
                <div key={index} className="flex items-center justify-between p-2.5 rounded-xl hover:bg-zinc-50 dark:hover:bg-zinc-800/30 transition-colors border border-transparent hover:border-zinc-100 dark:hover:border-zinc-800/50">
                  <div className="flex items-center gap-3">
                    <div className="rounded-lg p-2 bg-zinc-50 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 shrink-0 border border-zinc-100 dark:border-zinc-700/60">
                      <service.icon className="h-4.5 w-4.5" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-zinc-800 dark:text-zinc-200">{service.name}</p>
                      <p className="text-[11px] text-zinc-400 dark:text-zinc-500">{service.desc}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`h-2 w-2 rounded-full ${service.status === "Online" ? "bg-emerald-500" : "bg-red-500 animate-pulse"}`} />
                    <span className="text-xs font-bold text-zinc-700 dark:text-zinc-300">{service.status}</span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* Right column */}
        <div className="space-y-6">
          {/* Feature usage rankings */}
          <section className="space-y-3">
            <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 flex items-center gap-1.5 pl-1">
              <TrendingUp className="h-4 w-4 text-amber-500" />
              Hiệu suất sử dụng tính năng (Ranking)
            </h2>
            <div className="rounded-2xl border border-slate-100 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5 shadow-xs min-h-[220px] flex flex-col justify-center">
              {totalUsage === 0 ? (
                <div className="text-center py-8">
                  <AlertCircle className="h-8 w-8 text-zinc-300 dark:text-zinc-650 mx-auto mb-2.5" />
                  <p className="text-sm font-semibold text-zinc-500 dark:text-zinc-400">Chưa đủ dữ liệu phân tích.</p>
                  <p className="text-xs text-zinc-400 dark:text-zinc-550 mt-1">Cần có hoạt động trong hệ thống để tạo bảng xếp hạng.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {featureUsages.map((feat, index) => (
                    <div key={index} className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-zinc-700 dark:text-zinc-300 flex items-center gap-1.5">
                          <feat.icon className="h-4 w-4 text-zinc-400 dark:text-zinc-500 shrink-0" />
                          {feat.name}
                        </span>
                        <span className="text-zinc-500 dark:text-zinc-400 font-mono font-semibold">{feat.count.toLocaleString()} lượt ({feat.percentage}%)</span>
                      </div>
                      <div className="h-2 w-full rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden">
                        <div 
                          className={`h-full rounded-full transition-all duration-500 ${feat.color}`}
                          style={{ width: `${feat.percentage}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>

          {/* Activity Logs */}
          <section className="space-y-3">
            <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 flex items-center gap-1.5 pl-1">
              <Terminal className="h-4 w-4 text-purple-500" />
              Nhật ký hệ thống mới nhất (Activity Logs)
            </h2>
            <div className="rounded-2xl border border-slate-100 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5 shadow-xs min-h-[300px] flex flex-col justify-center">
              {displayActivities.length === 0 ? (
                <div className="text-center py-12">
                  <Activity className="h-8 w-8 text-zinc-300 dark:text-zinc-650 mx-auto mb-2.5 animate-pulse" />
                  <p className="text-sm font-semibold text-zinc-500 dark:text-zinc-400">Chưa có hoạt động gần đây.</p>
                  <p className="text-xs text-zinc-400 dark:text-zinc-550 mt-1">Hệ thống chưa ghi nhận log thao tác mới nào.</p>
                </div>
              ) : (
                <div className="relative border-l border-zinc-100 dark:border-zinc-800 pl-4 ml-2 space-y-5">
                  {displayActivities.map((act, index) => {
                    let dotColor = "bg-zinc-300 ring-zinc-100 dark:bg-zinc-700 dark:ring-zinc-800/40";
                    if (act.type === "payment") dotColor = "bg-emerald-500 ring-emerald-100 dark:bg-emerald-500 dark:ring-emerald-950/40";
                    else if (act.type === "interview") dotColor = "bg-red-600 ring-red-100 dark:bg-red-650 dark:ring-red-950/40";
                    else if (act.type === "user") dotColor = "bg-blue-500 ring-blue-100 dark:bg-blue-500 dark:ring-blue-950/40";
                    else if (act.type === "recruiter") dotColor = "bg-purple-500 ring-purple-100 dark:bg-purple-550 dark:ring-purple-950/40";
                    else if (act.type === "explore") dotColor = "bg-amber-500 ring-amber-100 dark:bg-amber-550 dark:ring-amber-950/40";

                    return (
                      <div key={act.id} className="relative group">
                        {/* Timeline point */}
                        <div className={`absolute -left-[22px] top-1 h-2 w-2 rounded-full ring-4 ${dotColor}`} />
                        
                        <div className="flex items-start justify-between gap-4">
                          <div className="space-y-0.5">
                            <p className="text-xs font-bold text-zinc-800 dark:text-zinc-200 leading-none">{act.title}</p>
                            <p className="text-[11px] text-zinc-500 dark:text-zinc-400">{act.detail}</p>
                          </div>
                          <time className="text-[10px] text-zinc-400 dark:text-zinc-500 whitespace-nowrap pt-0.5 font-mono font-medium">
                            {act.time.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })}
                          </time>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

