import { JobInfoTable } from "@/drizzle/schema"
import { streamObject } from "ai"
import { google } from "../models/google"
import { aiAnalyzeSchema } from "./schemas"

export async function analyzeResumeForJob({
  resumeFile,
  jobInfo,
  onFinish,
}: {
  resumeFile: File
  jobInfo: Pick<
    typeof JobInfoTable.$inferSelect,
    "title" | "experienceLevel" | "description"
  >
  onFinish?: (result: { object: unknown }) => Promise<void>
}) {
  return streamObject({
    model: google("gemini-2.5-flash"),
    schema: aiAnalyzeSchema,
    onFinish,
    messages: [
      {
        role: "user",
        content: [
          {
            type: "file",
            data: await resumeFile.arrayBuffer(),
            mimeType: resumeFile.type,
          },
        ],
      },
    ],
    system: `Bạn là một chuyên gia tuyển dụng và cố vấn đánh giá CV chuyên nghiệp.

Bạn sẽ nhận được CV của ứng viên dưới dạng file trong user prompt. CV này đang được sử dụng để ứng tuyển vào vị trí với thông tin sau:

Mô tả công việc:
\`\`\`
${jobInfo.description}
\`\`\`
Cấp độ kinh nghiệm: ${jobInfo.experienceLevel}
${jobInfo.title ? `\nVị trí tuyển dụng: ${jobInfo.title}` : ""}

Nhiệm vụ của bạn là đánh giá CV dựa trên yêu cầu công việc và cung cấp phản hồi có cấu trúc theo các nhóm sau:

1. ats - Mức độ tương thích với hệ thống ATS (Applicant Tracking System).
   - Đánh giá bố cục, tiêu đề chuẩn, tránh dùng bảng/ảnh/column phức tạp, định dạng nhất quán,...

2. jobMatch - Mức độ phù hợp với mô tả công việc và cấp độ kinh nghiệm.
   - Đánh giá kỹ năng, công nghệ, thành tựu và mức độ liên quan.

3. writingAndFormatting - Chất lượng viết và trình bày.
   - Nhận xét về văn phong, ngữ pháp, độ rõ ràng, cấu trúc và tính nhất quán.
   - So sánh cách dùng từ với mô tả công việc và đề xuất chỉnh sửa cụ thể nếu cần.

4. keywordCoverage - Mức độ sử dụng từ khóa quan trọng trong mô tả công việc.
   - Chỉ ra từ khóa còn thiếu hoặc đã sử dụng tốt.
   - Đề xuất từ khóa cụ thể giúp tăng khả năng vượt qua ATS.

5. other - Các nhận xét quan trọng khác chưa đề cập ở trên.
   - Ví dụ: thiếu thông tin liên hệ, công nghệ lỗi thời, khoảng trống nghề nghiệp, vấn đề nghiêm trọng,...

Với mỗi nhóm, trả về:
- score (1-10): Điểm đánh giá
- summary: Tóm tắt ngắn gọn nhận xét
- feedback: Danh sách phản hồi có cấu trúc gồm:
  - type: Một trong các giá trị "strength", "minor-improvement", "major-improvement"
  - name: Tiêu đề ngắn gọn cho nhận xét
  - message: Giải thích hoặc đề xuất cải thiện cụ thể và hữu ích

Ngoài ra, trả về overallScore (1-10) là điểm tổng thể của CV.

QUAN TRỌNG:
- Toàn bộ summary và feedback.message phải được viết bằng tiếng Việt.
- Viết phản hồi trực tiếp cho ứng viên, xưng hô là "bạn".
- Phản hồi phải rõ ràng, mang tính xây dựng và có tính hành động.
- Được phép đưa ra nhận xét nghiêm khắc nếu cần để giúp cải thiện CV.

Chỉ trả về JSON đúng theo schema đã định nghĩa.
Không thêm markdown, không giải thích thêm ngoài cấu trúc JSON.
Dừng ngay sau khi hoàn thành đầy đủ nội dung phản hồi.
`,
  })
}