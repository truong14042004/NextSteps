import z from "zod"

const optionalUrlSchema = z
  .string()
  .trim()
  .url("URL không hợp lệ")
  .optional()
  .or(z.literal(""))
  .transform(value => (value === "" ? undefined : value))

const optionalEmailSchema = z
  .string()
  .trim()
  .email("Email không hợp lệ")
  .optional()
  .or(z.literal(""))
  .transform(value => (value === "" ? undefined : value))

export const recruiterPostSchema = z.object({
  title: z.string().trim().min(5, "Tiêu đề tối thiểu 5 ký tự").max(180),
  content: z.string().trim().min(30, "Nội dung tối thiểu 30 ký tự").max(6000),
  companyName: z.string().trim().min(2, "Tên công ty là bắt buộc").max(160),
  positionTitle: z.string().trim().min(2, "Vị trí tuyển dụng là bắt buộc").max(160),
  location: z.string().trim().max(160).optional().or(z.literal("")),
  salaryRange: z.string().trim().max(120).optional().or(z.literal("")),
  skills: z.string().trim().max(1000).optional().or(z.literal("")),
  // Hạn nộp CV — form gửi chuỗi "YYYY-MM-DD" hoặc rỗng (không hạn).
  deadline: z
    .string()
    .trim()
    .optional()
    .or(z.literal(""))
    .refine(
      value => !value || !Number.isNaN(new Date(value).getTime()),
      "Ngày hết hạn không hợp lệ",
    ),
})

export const cvShowcasePostSchema = z.object({
  title: z.string().trim().min(5, "Tiêu đề tối thiểu 5 ký tự").max(180),
  content: z.string().trim().min(20, "Nội dung tối thiểu 20 ký tự").max(4000),
  skills: z.string().trim().max(1000).optional().or(z.literal("")),
  cvUrl: z.string().trim().url("CV URL không hợp lệ"),
  cvFileName: z.string().trim().min(1).max(255),
})

export const commentSchema = z.object({
  content: z.string().trim().min(1, "Vui lòng nhập bình luận").max(1200),
})

export const recruiterRequestSchema = z.object({
  companyName: z.string().trim().min(2, "Tên công ty là bắt buộc").max(160),
  companyWebsite: optionalUrlSchema,
  businessEmail: optionalEmailSchema,
  position: z.string().trim().min(2, "Chức vụ là bắt buộc").max(120),
  reason: z.string().trim().min(20, "Lý do tối thiểu 20 ký tự").max(2500),
})

export const adminReviewSchema = z.object({
  note: z.string().trim().max(2500).optional().or(z.literal("")),
})

export const jobApplicationSchema = z.object({
  fullName: z.string().trim().min(2, "Họ tên là bắt buộc").max(160),
  email: optionalEmailSchema,
  phone: z.string().trim().max(40).optional().or(z.literal("")),
  coverLetter: z.string().trim().max(3000).optional().or(z.literal("")),
  cvUrl: z.string().trim().url("CV URL không hợp lệ"),
  cvFileName: z.string().trim().min(1).max(255),
})
