"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Image from "next/image";
import {
  ArrowLeft,
  Check,
  CheckCircle2,
  Copy,
  CreditCard,
  QrCode,
  ShieldCheck,
  Sparkles,
  Wallet,
} from "lucide-react";

type PaymentMethod = "vnpay" | "momo" | "visa";

type CheckoutProduct = {
  name: string;
  subtitle: string;
  description: string;
  priceLabel: string;
  rawPrice: number;
  billingLabel: string;
  features: string[];
  refundText: string;
};

export default function CheckoutPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const plan = searchParams.get("plan") ?? "premium";
  const type = searchParams.get("type") ?? "monthly";
  const price = searchParams.get("price");

  const [method, setMethod] = useState<PaymentMethod>("vnpay");
  const [showQRDetails, setShowQRDetails] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [copied, setCopied] = useState(false);
  const [email, setEmail] = useState("");
  const [card, setCard] = useState({
    name: "",
    number: "",
    exp: "",
    cvc: "",
  });

  const product = useMemo<CheckoutProduct>(() => {
    const parsedPrice = Number(price);

    if (plan === "standard" || type === "single") {
      const standardPrice =
        Number.isFinite(parsedPrice) && parsedPrice > 0 ? parsedPrice : 15000;

      return {
        name: "NextStep Standard",
        subtitle: "Gói lẻ theo lượt",
        description:
          "Phù hợp khi bạn cần tối ưu CV hoặc luyện phỏng vấn chuyên sâu ngay lúc này.",
        priceLabel: `${standardPrice.toLocaleString("vi-VN")} VNĐ`,
        rawPrice: standardPrice,
        billingLabel: "Thanh toán một lần",
        refundText: "Hỗ trợ hoàn tiền trong 7 ngày nếu chưa sử dụng lượt.",
        features: [
          '1 lần "Deep Scan" CV chi tiết',
          "Hoặc 1 phiên Mock Interview chuyên sâu (15 phút)",
          "Checklist cải thiện sau buổi luyện",
          "Gợi ý chỉnh sửa theo JD & rubric",
        ],
      };
    }

    const premiumPrice =
      Number.isFinite(parsedPrice) && parsedPrice > 0 ? parsedPrice : 99000;

    return {
      name: "NextStep Premium",
      subtitle: "Gói tháng",
      description:
        "Dành cho người muốn luyện phỏng vấn, tối ưu CV và sử dụng đầy đủ tính năng cao cấp trong tháng.",
      priceLabel: `${premiumPrice.toLocaleString("vi-VN")} VNĐ / tháng`,
      rawPrice: premiumPrice,
      billingLabel: "Thanh toán theo tháng",
      refundText: "Hoàn tiền trong 7 ngày. Huỷ bất kỳ lúc nào.",
      features: [
        "Tối đa 20 lượt sử dụng mỗi ngày",
        "Toàn bộ tính năng cao cấp: Mock Interview, Deep Scan, Technical Prep",
        "Lưu lịch sử feedback & báo cáo",
        "Ưu tiên trải nghiệm tính năng mới",
      ],
    };
  }, [plan, price, type]);

  const paymentCode =
    method === "vnpay"
      ? `NEXTSTEP-VNPAY-${product.rawPrice}`
      : method === "momo"
        ? `NEXTSTEP-MOMO-${product.rawPrice}`
        : "CARD-DEMO";

  async function handleCopyCode() {
    try {
      await navigator.clipboard.writeText(paymentCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    } catch {
      setCopied(false);
    }
  }

  function onPay() {
    setProcessing(true);

    setTimeout(() => {
      setProcessing(false);
      router.push("/app");
    }, 1200);
  }

  return (
    <>
      <CheckoutNavbar />
      <main className="min-h-screen bg-background py-10 md:py-14">
        <div className="pointer-events-none fixed inset-0 -z-10">
          <div className="absolute left-1/2 top-0 h-72 w-[42rem] -translate-x-1/2 rounded-full bg-primary/10 blur-3xl" />
          <div className="absolute bottom-0 right-0 h-72 w-72 rounded-full bg-muted blur-3xl" />
        </div>

        <div className="container mx-auto px-4">
          <div className="mx-auto mb-6 max-w-6xl">
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              <ArrowLeft className="h-4 w-4" />
              Quay lại trang trước
            </Link>
          </div>

          <div className="mx-auto max-w-6xl">
            <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr] items-stretch">
              {/* LEFT */}
              <Card className="rounded-3xl border bg-card/70 shadow-sm flex flex-col h-full">
                <CardHeader className="border-b bg-background/40 px-6 py-6 md:px-8">
                  <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
                    <div className="max-w-2xl">
                      <div className="inline-flex items-center gap-2 rounded-full border bg-background px-3 py-1 text-xs text-muted-foreground shadow-sm">
                        <Sparkles className="h-3.5 w-3.5 text-primary" />
                        Thanh toán an toàn cho {product.name}
                      </div>

                      <CardTitle className="mt-4 text-2xl md:text-3xl">
                        Hoàn tất thanh toán
                      </CardTitle>

                      <p className="mt-2 text-sm leading-relaxed text-muted-foreground md:text-base">
                        Bạn đang thanh toán cho{" "}
                        <span className="font-medium text-foreground">
                          {product.subtitle}
                        </span>
                        . Chọn phương thức phù hợp để tiếp tục.
                      </p>
                    </div>

                    <div className="rounded-2xl border bg-background px-4 py-3 text-left md:min-w-[220px] md:text-right">
                      <div className="text-xs text-muted-foreground">
                        Tổng thanh toán
                      </div>
                      <div className="mt-1 text-2xl font-bold text-primary">
                        {product.priceLabel}
                      </div>
                      <div className="mt-1 text-xs text-muted-foreground">
                        {product.billingLabel}
                      </div>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="flex-1 space-y-6 px-6 py-6 md:px-8">
                  <div>
                    <div className="mb-3 text-sm font-medium">
                      Chọn phương thức thanh toán
                    </div>

                    <div className="grid gap-3 sm:grid-cols-3">
                      <PaymentMethodCard
                        active={method === "vnpay"}
                        title="VNPay"
                        subtitle="QR / ngân hàng"
                        icon={<QrCode className="h-5 w-5" />}
                        onClick={() => {
                          setMethod("vnpay");
                          setShowQRDetails(false);
                        }}
                      />

                      <PaymentMethodCard
                        active={method === "momo"}
                        title="Momo"
                        subtitle="Ví điện tử / QR"
                        icon={<Wallet className="h-5 w-5" />}
                        onClick={() => {
                          setMethod("momo");
                          setShowQRDetails(false);
                        }}
                      />

                      <PaymentMethodCard
                        active={method === "visa"}
                        title="Visa / MasterCard"
                        subtitle="Thẻ quốc tế"
                        icon={<CreditCard className="h-5 w-5" />}
                        onClick={() => {
                          setMethod("visa");
                          setShowQRDetails(false);
                        }}
                      />
                    </div>
                  </div>

                  <div className="rounded-3xl border bg-background/70 p-5 md:p-6">
                    {method === "visa" ? (
                      <div className="space-y-4">
                        <div className="flex items-center gap-2">
                          <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                            <CreditCard className="h-4 w-4" />
                          </div>
                          <div>
                            <div className="text-sm font-medium">
                              Thông tin thẻ
                            </div>
                            <div className="text-xs text-muted-foreground">
                              Nhập thông tin để mô phỏng quy trình thanh toán
                              bằng thẻ.
                            </div>
                          </div>
                        </div>

                        <div className="grid gap-4">
                          <div>
                            <Label htmlFor="card-name" className="text-xs">
                              Tên chủ thẻ
                            </Label>
                            <Input
                              id="card-name"
                              value={card.name}
                              onChange={(e) =>
                                setCard((s) => ({ ...s, name: e.target.value }))
                              }
                              placeholder="NGUYEN VAN A"
                              className="mt-1 h-11 rounded-2xl"
                            />
                          </div>

                          <div>
                            <Label htmlFor="card-number" className="text-xs">
                              Số thẻ
                            </Label>
                            <Input
                              id="card-number"
                              value={card.number}
                              onChange={(e) =>
                                setCard((s) => ({
                                  ...s,
                                  number: e.target.value,
                                }))
                              }
                              placeholder="4242 4242 4242 4242"
                              className="mt-1 h-11 rounded-2xl"
                            />
                          </div>

                          <div className="grid gap-4 sm:grid-cols-[1fr_120px]">
                            <div>
                              <Label htmlFor="card-exp" className="text-xs">
                                MM/YY
                              </Label>
                              <Input
                                id="card-exp"
                                value={card.exp}
                                onChange={(e) =>
                                  setCard((s) => ({
                                    ...s,
                                    exp: e.target.value,
                                  }))
                                }
                                placeholder="04/29"
                                className="mt-1 h-11 rounded-2xl"
                              />
                            </div>

                            <div>
                              <Label htmlFor="card-cvc" className="text-xs">
                                CVC
                              </Label>
                              <Input
                                id="card-cvc"
                                value={card.cvc}
                                onChange={(e) =>
                                  setCard((s) => ({
                                    ...s,
                                    cvc: e.target.value,
                                  }))
                                }
                                placeholder="123"
                                className="mt-1 h-11 rounded-2xl"
                              />
                            </div>
                          </div>
                        </div>

                        <div className="rounded-2xl bg-muted/50 p-3 text-xs leading-relaxed text-muted-foreground">
                          Đây là giao diện demo. Khi triển khai thực tế, phần
                          thanh toán thẻ nên kết nối với cổng như Stripe hoặc
                          nhà cung cấp PCI-compliant.
                        </div>
                      </div>
                    ) : (
                      <div className="grid gap-5 md:grid-cols-[260px_1fr] md:items-start">
                        <div className="flex flex-col items-center rounded-3xl border bg-white p-4 shadow-sm">
                          <div className="mb-3 text-sm font-medium">
                            Quét mã để thanh toán
                          </div>

                          <div className="grid h-48 w-48 grid-cols-9 gap-1 rounded-xl bg-slate-100 p-2">
                            {Array.from({ length: 81 }).map((_, i) => (
                              <div
                                key={i}
                                className={`rounded-[2px] ${
                                  i % 2 === 0 || i % 7 === 0
                                    ? "bg-slate-900"
                                    : "bg-white"
                                }`}
                              />
                            ))}
                          </div>

                          <div className="mt-3 text-center text-xs text-muted-foreground">
                            QR demo cho {method === "vnpay" ? "VNPay" : "Momo"}
                          </div>
                        </div>

                        <div className="space-y-4">
                          <div className="flex items-center gap-2">
                            <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                              {method === "vnpay" ? (
                                <QrCode className="h-4 w-4" />
                              ) : (
                                <Wallet className="h-4 w-4" />
                              )}
                            </div>
                            <div>
                              <div className="text-sm font-medium">
                                Thanh toán bằng{" "}
                                {method === "vnpay" ? "VNPay" : "Momo"}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                Quét QR bằng ứng dụng ngân hàng hoặc ví để hoàn
                                tất thanh toán.
                              </div>
                            </div>
                          </div>

                          <div className="rounded-2xl border bg-muted/30 p-4">
                            <div className="text-sm font-medium">
                              Mã thanh toán
                            </div>

                            <div className="mt-2 flex items-center justify-between gap-3 rounded-2xl bg-background px-4 py-3">
                              <span className="truncate text-sm font-medium">
                                {paymentCode}
                              </span>

                              <Button
                                variant="outline"
                                size="sm"
                                onClick={handleCopyCode}
                                className="rounded-xl"
                                type="button"
                              >
                                {copied ? (
                                  <>
                                    <CheckCircle2 className="mr-2 h-4 w-4" />
                                    Đã copy
                                  </>
                                ) : (
                                  <>
                                    <Copy className="mr-2 h-4 w-4" />
                                    Sao chép
                                  </>
                                )}
                              </Button>
                            </div>

                            <div className="mt-3 flex flex-wrap gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                className="rounded-xl"
                                onClick={() => setShowQRDetails((s) => !s)}
                                type="button"
                              >
                                {showQRDetails
                                  ? "Ẩn chi tiết"
                                  : "Hiện chi tiết chuyển khoản"}
                              </Button>
                            </div>

                            {showQRDetails && (
                              <div className="mt-4 space-y-2 rounded-2xl bg-background p-4 text-sm">
                                <div className="flex items-center justify-between gap-3">
                                  <span className="text-muted-foreground">
                                    Cổng thanh toán
                                  </span>
                                  <span className="font-medium">
                                    {method === "vnpay"
                                      ? "VNPay Gateway"
                                      : "Momo Wallet"}
                                  </span>
                                </div>
                                <div className="flex items-center justify-between gap-3">
                                  <span className="text-muted-foreground">
                                    Nội dung
                                  </span>
                                  <span className="font-medium">
                                    {paymentCode}
                                  </span>
                                </div>
                                <div className="flex items-center justify-between gap-3">
                                  <span className="text-muted-foreground">
                                    Số tiền
                                  </span>
                                  <span className="font-medium text-primary">
                                    {product.rawPrice.toLocaleString("vi-VN")}{" "}
                                    VNĐ
                                  </span>
                                </div>
                              </div>
                            )}
                          </div>

                          <div className="text-xs leading-relaxed text-muted-foreground">
                            Sau khi thanh toán thành công, hệ thống sẽ kích hoạt{" "}
                            <span className="font-medium text-foreground">
                              {product.name}
                            </span>{" "}
                            cho tài khoản của bạn.
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="rounded-3xl border bg-background/70 p-5">
                    <div className="mb-3 text-sm font-medium">
                      Email nhận hóa đơn
                    </div>
                    <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
                      <Input
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="you@email.com"
                        className="h-11 rounded-2xl"
                      />
                      <div className="flex items-center rounded-2xl bg-muted px-4 text-xs text-muted-foreground">
                        Hóa đơn sẽ gửi về email này
                      </div>
                    </div>
                  </div>
                </CardContent>

                <CardFooter className="mt-auto flex flex-col items-start justify-between gap-4 border-t bg-background/30 px-6 py-4 text-xs text-muted-foreground md:flex-row md:items-center md:px-8">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="h-4 w-4 text-primary" />
                    Kết nối bảo mật, mã hóa và xử lý thanh toán an toàn.
                  </div>
                  <div>{product.refundText}</div>
                </CardFooter>
              </Card>

              {/* RIGHT */}
              <div className="flex flex-col h-full gap-6">
                {/* Make both right-side cards stretch to match left column height */}
                <Card className="flex flex-col flex-1 rounded-3xl border bg-card/70 shadow-sm">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg">Tóm tắt đơn hàng</CardTitle>
                  </CardHeader>

                  <CardContent className="flex-1 flex flex-col gap-5">
                    <div className="rounded-2xl border bg-background/70 p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <div className="font-medium">{product.name}</div>
                          <div className="mt-1 text-sm text-muted-foreground">
                            {product.subtitle}
                          </div>
                        </div>
                        <div className="text-right font-semibold text-primary">
                          {product.priceLabel}
                        </div>
                      </div>

                      <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                        {product.description}
                      </p>

                      <ul className="mt-4 space-y-2">
                        {product.features.map((item) => (
                          <li
                            key={item}
                            className="flex items-start gap-2 text-sm text-muted-foreground"
                          >
                            <span className="mt-1 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                              <Check className="h-3.5 w-3.5" />
                            </span>
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="rounded-2xl border bg-background/70 p-4">
                      <div className="space-y-3">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">
                            Gói đã chọn
                          </span>
                          <span className="font-medium">
                            {product.subtitle}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">
                            Hình thức thanh toán
                          </span>
                          <span className="font-medium">
                            {type === "single" ? "Một lần" : "Theo tháng"}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">
                            Giảm giá
                          </span>
                          <span>0 VNĐ</span>
                        </div>
                        <div className="h-px bg-border" />
                        <div className="flex items-center justify-between">
                          <span className="font-medium">Tổng thanh toán</span>
                          <span className="text-lg font-bold text-primary">
                            {product.rawPrice.toLocaleString("vi-VN")} VNĐ
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="mt-auto">
                      <Button
                        onClick={onPay}
                        disabled={processing}
                        className="h-12 w-full rounded-2xl bg-gradient-to-r from-red-600 via-red-500 to-rose-500 text-white shadow-lg shadow-red-500/25 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-red-500/40"
                      >
                        {processing ? (
                          "Đang xử lý thanh toán..."
                        ) : (
                          <>
                            Thanh toán ngay
                            <Check className="ml-2 h-4 w-4" />
                          </>
                        )}
                      </Button>

                      <p className="mt-3 text-center text-xs leading-relaxed text-muted-foreground">
                        Bằng việc thanh toán, bạn đồng ý với{" "}
                        <Link
                          href="/terms"
                          className="underline underline-offset-2"
                        >
                          Điều khoản dịch vụ
                        </Link>{" "}
                        và{" "}
                        <Link
                          href="/privacy"
                          className="underline underline-offset-2"
                        >
                          Chính sách bảo mật
                        </Link>
                        .
                      </p>
                    </div>
                  </CardContent>
                </Card>

                <Card className="flex flex-col flex-1 rounded-3xl border bg-card/70 shadow-sm">
                  <CardContent className="p-5 flex-1 overflow-auto">
                    <div className="mb-3 text-sm font-medium">
                      Vì sao có thể tin tưởng?
                    </div>

                    <div className="space-y-3">
                      <TrustItem text="Thiết kế checkout rõ ràng, dễ kiểm tra thông tin trước khi thanh toán." />
                      <TrustItem text="Hỗ trợ nhiều phương thức thanh toán quen thuộc tại Việt Nam." />
                      <TrustItem text={product.refundText} />
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}

function CheckoutNavbar() {
  return (
    <header className="sticky top-0 z-50 border-b bg-background/70 backdrop-blur-md">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center">
          <Link href="/" className="flex items-center gap-3">
            <Image
              src="/logo.png"
              alt="NextStep logo"
              width={36}
              height={36}
              className="rounded-md object-contain"
              priority
            />
            <div className="flex flex-col leading-none">
              <span className="text-lg font-semibold tracking-tight">
                NextStep
              </span>
            </div>
          </Link>
        </div>
      </div>
    </header>
  );
}
function PaymentMethodCard({
  active,
  title,
  subtitle,
  icon,
  onClick,
}: {
  active: boolean;
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "rounded-3xl border p-4 text-left transition-all duration-200",
        "hover:-translate-y-0.5 hover:shadow-md",
        active
          ? "border-primary bg-primary/5 ring-2 ring-primary/20"
          : "bg-background/70",
      ].join(" ")}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-muted text-foreground">
          {icon}
        </div>
        {active ? (
          <span className="rounded-full bg-primary px-2 py-1 text-[10px] font-medium text-primary-foreground">
            Đang chọn
          </span>
        ) : null}
      </div>

      <div className="mt-4">
        <div className="text-sm font-medium">{title}</div>
        <div className="mt-1 text-xs text-muted-foreground">{subtitle}</div>
      </div>
    </button>
  );
}

function TrustItem({ text }: { text: string }) {
  return (
    <div className="flex items-start gap-3 rounded-2xl bg-background/70 p-3">
      <span className="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
        <Check className="h-3.5 w-3.5" />
      </span>
      <span className="text-sm text-muted-foreground">{text}</span>
    </div>
  );
}
