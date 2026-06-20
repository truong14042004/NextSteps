export const roleLabels = {
  user: "User",
  pro: "Pro",
  recruiter: "Nhà tuyển dụng",
  admin: "Admin",
}

export const explorePostTypeLabels = {
  job_post: "Tuyển dụng",
  cv_showcase: "CV ứng viên",
}

export const explorePostStatusLabels = {
  pending: "Chờ duyệt",
  published: "Đã public",
  rejected: "Từ chối",
  hidden: "Đã ẩn",
  deleted: "Đã xóa",
}

export const recruiterRequestStatusLabels = {
  pending: "Chờ duyệt",
  approved: "Đã duyệt",
  rejected: "Từ chối",
  cancelled: "Đã hủy",
}

export const jobApplicationStatusLabels = {
  pending: "Mới nộp",
  reviewing: "Đang xem xét",
  accepted: "Đã nhận",
  rejected: "Từ chối",
  withdrawn: "Đã rút",
}

export function getRoleLabel(role) {
  return roleLabels[role] ?? role
}

export function getExplorePostTypeLabel(type) {
  return explorePostTypeLabels[type] ?? type
}

export function getExplorePostStatusLabel(status) {
  return explorePostStatusLabels[status] ?? status
}

export function getRecruiterRequestStatusLabel(status) {
  return recruiterRequestStatusLabels[status] ?? status
}

export function getJobApplicationStatusLabel(status) {
  return jobApplicationStatusLabels[status] ?? status
}

export function canCreateRecruiterPost(role) {
  return role === "recruiter" || role === "admin"
}

export function canSubmitRecruiterRequest(role) {
  return role === "user" || role === "pro"
}

export function canPublishRecruiterPostImmediately(role) {
  return role === "admin"
}

// Chỉ ứng viên thường (không phải recruiter/admin) mới nộp hồ sơ ứng tuyển.
export function canApplyToJob(role) {
  return role === "user" || role === "pro"
}

export function canManageRecruiterArea(role) {
  return role === "recruiter" || role === "admin"
}
