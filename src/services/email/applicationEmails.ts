import "server-only"

// Template email thông báo kết quả ứng tuyển gửi cho ứng viên.

type ApplicationDecisionEmailInput = {
  candidateName: string
  jobTitle: string
  companyName: string | null
  status: "accepted" | "rejected"
  recruiterNote?: string | null
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
}

export function buildApplicationDecisionEmail({
  candidateName,
  jobTitle,
  companyName,
  status,
  recruiterNote,
}: ApplicationDecisionEmailInput) {
  // Subject header không được chứa ký tự xuống dòng (chống header injection):
  // jobTitle/companyName đến từ input của nhà tuyển dụng nên phải làm sạch.
  const sanitizeHeader = (value: string) =>
    value.replace(/[\r\n]+/g, " ").trim()
  const safeJobTitle = sanitizeHeader(jobTitle)
  const safeCompanyName = companyName ? sanitizeHeader(companyName) : null

  const positionLabel = safeCompanyName
    ? `${safeJobTitle} tại ${safeCompanyName}`
    : safeJobTitle

  const accepted = status === "accepted"
  const subject = accepted
    ? `Chúc mừng! Hồ sơ của bạn cho vị trí ${safeJobTitle} đã được chấp nhận`
    : `Cập nhật kết quả ứng tuyển vị trí ${safeJobTitle}`

  const greeting = `Xin chào ${candidateName},`

  const intro = accepted
    ? `Chúc mừng bạn! Nhà tuyển dụng đã xem xét và quyết định tiếp nhận hồ sơ của bạn cho vị trí ${positionLabel}.`
    : `Cảm ơn bạn đã quan tâm và ứng tuyển vị trí ${positionLabel}. Sau khi cân nhắc kỹ lưỡng, nhà tuyển dụng rất tiếc chưa thể tiếp tục với hồ sơ của bạn ở thời điểm này.`

  const noteBlock = recruiterNote?.trim()
    ? `\n\nLời nhắn từ nhà tuyển dụng:\n${recruiterNote.trim()}`
    : ""

  const closing = accepted
    ? "Nhà tuyển dụng sẽ sớm liên hệ với bạn về các bước tiếp theo. Vui lòng để ý hộp thư và điện thoại."
    : "Chúc bạn sớm tìm được cơ hội phù hợp. Đừng nản lòng, hãy tiếp tục theo dõi các cơ hội mới trên NextStep nhé!"

  const text = `${greeting}\n\n${intro}${noteBlock}\n\n${closing}\n\n— Đội ngũ NextStep`

  const noteHtml = recruiterNote?.trim()
    ? `<div style="margin:16px 0;padding:12px 16px;background:#f8fafc;border-left:3px solid ${
        accepted ? "#10b981" : "#f43f5e"
      };border-radius:6px;color:#334155;white-space:pre-line;">
        <strong style="display:block;margin-bottom:4px;color:#0f172a;">Lời nhắn từ nhà tuyển dụng</strong>
        ${escapeHtml(recruiterNote.trim())}
      </div>`
    : ""

  const html = `<div style="font-family:Segoe UI,Roboto,Arial,sans-serif;max-width:560px;margin:0 auto;color:#0f172a;">
    <div style="padding:24px 0;text-align:center;">
      <span style="font-size:20px;font-weight:700;background:linear-gradient(90deg,#f43f5e,#6366f1);-webkit-background-clip:text;background-clip:text;color:transparent;">NextStep</span>
    </div>
    <div style="padding:24px;border:1px solid #e2e8f0;border-radius:16px;">
      <p style="font-size:15px;">${escapeHtml(greeting)}</p>
      <p style="font-size:15px;line-height:1.6;color:#334155;">${escapeHtml(intro)}</p>
      ${noteHtml}
      <p style="font-size:15px;line-height:1.6;color:#334155;">${escapeHtml(closing)}</p>
      <p style="margin-top:24px;font-size:14px;color:#64748b;">— Đội ngũ NextStep</p>
    </div>
  </div>`

  return { subject, text, html }
}
