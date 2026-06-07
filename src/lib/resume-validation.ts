export const RESUME_MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024;

export const RESUME_ALLOWED_MIME_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "text/plain",
];

export function validateResumeFile(file: File | null) {
  if (!file) {
    return { valid: false, message: "Vui lòng chọn một tệp CV" };
  }

  if (file.size > RESUME_MAX_FILE_SIZE_BYTES) {
    return { valid: false, message: "Kích thước tệp vượt quá giới hạn 10MB" };
  }

  if (!RESUME_ALLOWED_MIME_TYPES.includes(file.type)) {
    return { valid: false, message: "Vui lòng tải lên tệp PDF, Word hoặc tệp văn bản" };
  }

  return { valid: true, message: "" };
}