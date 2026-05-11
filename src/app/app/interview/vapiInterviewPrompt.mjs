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

const questionBanks = {
  intern: {
    label: "Intern/Fresher",
    questions: [
      "Bạn có thể giới thiệu ngắn về bản thân và lý do quan tâm đến vị trí {jobTitle} không?",
      "Bạn đã học hoặc tự học những kiến thức nền tảng nào liên quan đến {jobTitle}?",
      "Bạn có thể kể về một bài tập, đồ án hoặc dự án nhỏ mà bạn đã làm không?",
      "Khi gặp một kiến thức mới hoặc lỗi khó, bạn thường tìm hiểu và xử lý như thế nào?",
      "Trong thời gian tới, bạn muốn cải thiện kỹ năng nào nhất để làm tốt vị trí này?",
    ],
  },
  fresh: {
    label: "Intern/Fresher",
    questions: [
      "Bạn có thể giới thiệu ngắn về bản thân và lý do quan tâm đến vị trí {jobTitle} không?",
      "Bạn đã học hoặc tự học những kiến thức nền tảng nào liên quan đến {jobTitle}?",
      "Bạn có thể kể về một bài tập, đồ án hoặc dự án nhỏ mà bạn đã làm không?",
      "Khi gặp một kiến thức mới hoặc lỗi khó, bạn thường tìm hiểu và xử lý như thế nào?",
      "Trong thời gian tới, bạn muốn cải thiện kỹ năng nào nhất để làm tốt vị trí này?",
    ],
  },
  junior: {
    label: "Junior",
    questions: [
      "Bạn có thể tóm tắt kinh nghiệm gần đây nhất liên quan đến vị trí {jobTitle} không?",
      "Bạn đã từng xây dựng hoặc tích hợp REST API trong dự án nào chưa? Vai trò của bạn là gì?",
      "Khi làm việc với database, bạn thường chú ý điều gì để dữ liệu ổn định và dễ mở rộng?",
      "Bạn đã từng gặp bug khó trong dự án chưa? Bạn debug và xác định nguyên nhân như thế nào?",
      "Khi nhận feedback trong code review, bạn thường xử lý và cải thiện code ra sao?",
    ],
  },
  "mid-level": {
    label: "Mid-level",
    questions: [
      "Bạn có thể kể về một tính năng hoặc module bạn từng chịu trách nhiệm chính từ đầu đến cuối không?",
      "Bạn thường thiết kế API, database schema hoặc luồng xử lý nghiệp vụ như thế nào?",
      "Bạn đã từng tối ưu hiệu năng, truy vấn hoặc quy trình deploy trong dự án chưa?",
      "Khi yêu cầu nghiệp vụ chưa rõ, bạn làm gì để giảm rủi ro trước khi triển khai?",
      "Bạn phối hợp với junior, QA, designer hoặc PM như thế nào để đảm bảo chất lượng delivery?",
    ],
  },
  senior: {
    label: "Senior",
    questions: [
      "Bạn có thể kể về một hệ thống hoặc dự án phức tạp mà bạn từng dẫn dắt hoặc đóng góp chính không?",
      "Bạn cân nhắc những yếu tố nào khi chọn kiến trúc, công nghệ hoặc hướng triển khai?",
      "Bạn xử lý technical debt như thế nào khi vẫn phải đảm bảo tiến độ sản phẩm?",
      "Bạn đã từng mentor hoặc nâng năng lực kỹ thuật cho thành viên khác trong team chưa?",
      "Khi có xung đột giữa yêu cầu business và rủi ro kỹ thuật, bạn ra quyết định như thế nào?",
    ],
  },
}

const getQuestionBank = (experienceLevel, jobTitle) => {
  const normalizedLevel = experienceLevel.toLowerCase()
  const bank = questionBanks[normalizedLevel] ?? questionBanks.junior

  return `Ngân hàng câu hỏi gợi ý cho cấp độ ${experienceLevel} (${bank.label}):
${bank.questions
  .map((question, index) =>
    `${index + 1}. ${question.replaceAll("{jobTitle}", jobTitle)}`,
  )
  .join("\n")}`
}

export const buildInterviewSystemPrompt = (jobInfo, options = {}) => {
  const interviewerName =
    options.interviewerName?.trim() || getRandomMaleInterviewerName()
  const candidateName = getCandidateName(jobInfo)
  const jobTitle = getJobTitle(jobInfo)
  const experienceLevel = getExperienceLevel(jobInfo)
  const jobDescription = getJobDescription(jobInfo)
  const cvSection = getCvSection(jobInfo)
  const questionBank = getQuestionBank(experienceLevel, jobTitle)

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

${questionBank}

Kết thúc khi đã đủ khoảng 5 câu hỏi chính hoặc ứng viên muốn dừng. Câu kết thúc: "Cảm ơn ${candidateName} đã dành thời gian tham gia buổi phỏng vấn hôm nay. Chúc bạn may mắn!"`
}

export const buildInterviewFirstMessage = (jobInfo, options = {}) => {
  const interviewerName =
    options.interviewerName?.trim() || getRandomMaleInterviewerName()

  return `Xin chào ${getCandidateName(jobInfo)}! Tôi là ${interviewerName}, người phỏng vấn trí tuệ nhân tạo đồng hành cùng bạn hôm nay. Buổi phỏng vấn của chúng ta dự kiến kéo dài khoảng 15 đến 20 phút. Bạn có thể dừng vài giây để suy nghĩ; tôi sẽ chờ bạn nói hết ý. Khi bạn sẵn sàng, chúng ta bắt đầu nhé.`
}
