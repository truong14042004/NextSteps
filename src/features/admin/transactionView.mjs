const STATUS_LABELS = {
  pending: "Đang chờ",
  paid: "Đã thanh toán",
  cancelled: "Đã hủy",
  expired: "Đã hết hạn",
  failed: "Thất bại",
}

const PLAN_LABELS = {
  free: "Free",
  start: "Start",
  premium: "Premium",
}

export const ADMIN_TRANSACTION_STATUS_KEYS = Object.keys(STATUS_LABELS)

export function formatAdminTransactionAmount(amount, currency = "VND") {
  const value = Number(amount ?? 0)
  const code = String(currency ?? "VND").toUpperCase()

  if (code === "VND") {
    return `${value.toLocaleString("vi-VN")}₫`
  }

  return `${value.toLocaleString("vi-VN")} ${code}`
}

export function normalizeAdminTransactionStatus(value) {
  const key = ADMIN_TRANSACTION_STATUS_KEYS.includes(value) ? value : "pending"

  return {
    key,
    label: STATUS_LABELS[key],
  }
}

export function formatAdminTransactionPlanLabel(planKey) {
  const key = String(planKey ?? "")
  return PLAN_LABELS[key] ?? key
}
