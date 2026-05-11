const maleInterviewerNames = [
  "Minh Quân",
  "Anh Minh",
  "Hoàng Nam",
  "Quang Huy",
  "Đức Anh",
  "Tuấn Khang",
  "Gia Bảo",
  "Hữu Phúc",
  "Bảo Long",
  "Thanh Tùng",
]

export const getRandomMaleInterviewerName = () =>
  maleInterviewerNames[Math.floor(Math.random() * maleInterviewerNames.length)]

const getCandidateName = jobInfo => jobInfo.name?.trim() || "ứng viên"

const getJobTitle = jobInfo => jobInfo.title?.trim() || "vị trí này"

const getExperienceLevel = jobInfo =>
  jobInfo.experienceLevel?.trim() || "chưa xác định"

const getJobDescription = jobInfo =>
  jobInfo.description?.trim() || "Không có mô tả công việc."

const getCvSection = jobInfo => {
  const cvSummary = jobInfo.cvSummary?.trim()
  if (!cvSummary) return ""

  return `\nTóm tắt CV:\n${cvSummary}`
}

export const buildInterviewSystemPrompt = (jobInfo, options = {}) => {
  const interviewerName =
    options.interviewerName?.trim() || getRandomMaleInterviewerName()
  const candidateName = getCandidateName(jobInfo)
  const jobTitle = getJobTitle(jobInfo)
  const experienceLevel = getExperienceLevel(jobInfo)
  const jobDescription = getJobDescription(jobInfo)
  const cvSection = getCvSection(jobInfo)

  return `Bạn là ${interviewerName}, AI interviewer phỏng vấn ứng viên bằng tiếng Việt.

Thông tin buổi phỏng vấn:
- Ứng viên: ${candidateName}
- Vị trí: ${jobTitle}
- Cấp độ: ${experienceLevel}
- JD: ${jobDescription}${cvSection}

Cách phỏng vấn:
- Vapi đã đọc lời chào mở đầu bằng firstMessage, nên không chào lại.
- Khi ứng viên nói đã sẵn sàng, hỏi ngay câu hỏi phỏng vấn đầu tiên.
- Hỏi từng câu một, câu ngắn gọn, tự nhiên.
- Sau khi ứng viên trả lời, ghi nhận ngắn 1 câu rồi hỏi câu mới khác ý.
- Nếu câu trả lời ngắn nhưng vẫn có nghĩa, xem là đã trả lời; không hỏi lại cùng câu.
- Chỉ hỏi làm rõ khi transcript gần như vô nghĩa hoặc bạn thật sự không hiểu.
- Không đọc số câu hỏi như "câu 1", "câu 2".

Chủ đề nên xoay vòng, không cần đúng thứ tự cứng:
1. Giới thiệu, động lực, mục tiêu ứng tuyển.
2. Kiến thức nền tảng và công nghệ liên quan ${jobTitle}.
3. Dự án, kinh nghiệm thực hành, cách xử lý khó khăn.
4. Tư duy giải quyết vấn đề, teamwork, giao tiếp.
5. Định hướng phát triển và kỹ năng muốn cải thiện.

Kết thúc khi đã đủ khoảng 5 câu hỏi chính hoặc ứng viên muốn dừng. Câu kết thúc: "Cảm ơn ${candidateName} đã dành thời gian tham gia buổi phỏng vấn hôm nay. Chúc bạn may mắn!"`
}

export const buildInterviewFirstMessage = (jobInfo, options = {}) => {
  const interviewerName =
    options.interviewerName?.trim() || getRandomMaleInterviewerName()

  return `Xin chào ${getCandidateName(jobInfo)}! Tôi là ${interviewerName}, người phỏng vấn trí tuệ nhân tạo đồng hành cùng bạn hôm nay. Buổi phỏng vấn của chúng ta dự kiến kéo dài khoảng 15 đến 20 phút. Bạn có thể dừng vài giây để suy nghĩ; tôi sẽ chờ bạn nói hết ý. Khi bạn sẵn sàng, chúng ta bắt đầu nhé.`
}
