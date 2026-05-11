export const SERVICE_REVIEW_SERVICE_KEYS = [
  "system",
  "resume_analysis",
  "ai_question",
  "mock_interview",
]

export const SERVICE_REVIEW_STATUSES = ["pending", "published", "hidden"]

const SERVICE_LABELS = {
  system: "Hệ thống NextStep",
  resume_analysis: "Phân tích CV/JD",
  ai_question: "Câu hỏi AI",
  mock_interview: "Phỏng vấn AI",
}

const STATUS_LABELS = {
  pending: "Chờ duyệt",
  published: "Đã hiển thị",
  hidden: "Đã ẩn",
}

export function clampServiceReviewRating(value) {
  const rating = Number(value)
  if (!Number.isFinite(rating)) return 1
  return Math.min(5, Math.max(1, Math.round(rating)))
}

export function getServiceReviewServiceLabel(serviceKey) {
  return SERVICE_LABELS[serviceKey] ?? "Dịch vụ hệ thống"
}

export function normalizeServiceReviewStatus(status) {
  return SERVICE_REVIEW_STATUSES.includes(status) ? status : "pending"
}

export function getServiceReviewStatusLabel(status) {
  return STATUS_LABELS[normalizeServiceReviewStatus(status)]
}
