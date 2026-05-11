const QUESTION_STOP_WORDS = new Set([
  "anh",
  "ban",
  "bang",
  "biet",
  "cho",
  "co",
  "cua",
  "da",
  "dang",
  "duoc",
  "em",
  "gi",
  "hay",
  "khong",
  "la",
  "mot",
  "nao",
  "nay",
  "nhung",
  "nhu",
  "noi",
  "tai",
  "the",
  "thi",
  "toi",
  "trong",
  "va",
  "ve",
  "vi",
  "voi",
])

export function normalizeInterviewText(value) {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/[đĐ]/g, "d")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase()
}

export function isReadyOnlyResponse(value) {
  const normalized = normalizeInterviewText(value)

  return /^(toi da san sang|em da san sang|minh da san sang|san sang|bat dau|bat dau di|ok|okay|duoc|duoc roi|vang|da)$/.test(
    normalized,
  )
}

export function isOpeningInterviewMessage(value) {
  const normalized = normalizeInterviewText(value)

  return (
    normalized.includes("nguoi phong van tri tue nhan tao") ||
    (
      normalized.includes("buoi phong van") &&
      normalized.includes("san sang") &&
      normalized.includes("bat dau")
    )
  )
}

export function isQuestionLike(value) {
  const normalized = normalizeInterviewText(value)

  return (
    String(value ?? "").includes("?") ||
    normalized.includes("ban co the") ||
    normalized.includes("hay ke") ||
    normalized.includes("hay chia se") ||
    normalized.includes("giai thich") ||
    normalized.includes("vi sao") ||
    normalized.includes("tai sao") ||
    normalized.includes("nhu the nao") ||
    normalized.includes("the nao")
  )
}

export function shouldTrackAssistantQuestion(value) {
  return isQuestionLike(value) && !isOpeningInterviewMessage(value)
}

function getQuestionTokens(value) {
  return normalizeInterviewText(value)
    .split(" ")
    .filter(
      token =>
        token.length > 2 &&
        !QUESTION_STOP_WORDS.has(token) &&
        !/^\d+$/.test(token),
    )
}

export function areQuestionsSimilar(first, second) {
  const firstNormalized = normalizeInterviewText(first)
  const secondNormalized = normalizeInterviewText(second)

  if (!firstNormalized || !secondNormalized) return false
  if (firstNormalized === secondNormalized) return true

  const firstTokens = new Set(getQuestionTokens(first))
  const secondTokens = new Set(getQuestionTokens(second))
  const smallerTokenCount = Math.min(firstTokens.size, secondTokens.size)

  if (smallerTokenCount < 3) {
    return (
      firstNormalized.includes(secondNormalized) ||
      secondNormalized.includes(firstNormalized)
    )
  }

  let sharedTokenCount = 0
  firstTokens.forEach(token => {
    if (secondTokens.has(token)) sharedTokenCount += 1
  })

  return sharedTokenCount / smallerTokenCount >= 0.4
}

export function isRepeatedAnsweredQuestion(answeredQuestions, assistantContent) {
  if (!shouldTrackAssistantQuestion(assistantContent)) return false

  return answeredQuestions.some(answeredQuestion =>
    areQuestionsSimilar(answeredQuestion, assistantContent),
  )
}

export function getAnsweredQuestionsAfterUserTranscript({
  answeredQuestions,
  lastAssistantQuestion,
  userTranscript,
}) {
  // Chỉ bỏ qua nếu là câu "sẵn sàng" / "bắt đầu" - không phải câu trả lời thật
  if (isReadyOnlyResponse(userTranscript)) {
    return answeredQuestions
  }

  // Nếu câu trước không phải câu hỏi thì không cần track
  if (!shouldTrackAssistantQuestion(lastAssistantQuestion)) {
    return answeredQuestions
  }

  // Đã mark câu này rồi thì bỏ qua
  if (
    answeredQuestions.some(answeredQuestion =>
      areQuestionsSimilar(answeredQuestion, lastAssistantQuestion),
    )
  ) {
    return answeredQuestions
  }

  // Dù câu trả lời ngắn vẫn mark là đã trả lời để không hỏi lại
  return [...answeredQuestions, lastAssistantQuestion]
}

export function buildAnsweredQuestionsSystemMessage(answeredQuestions) {
  if (!Array.isArray(answeredQuestions) || answeredQuestions.length === 0) {
    return null
  }

  const answeredQuestionList = answeredQuestions
    .map((question, index) => `${index + 1}. ${question}`)
    .join("\n")

  return `[SYSTEM NOTE - QUAN TRỌNG] Ứng viên đã trả lời các câu hỏi sau. TUYỆT ĐỐI KHÔNG hỏi lại hoặc paraphrase lại bất kỳ câu nào dưới đây:
${answeredQuestionList}

Kể cả nếu câu trả lời chỉ 1-2 từ, vẫn xem là đã trả lời và chuyển sang câu hỏi hoàn toàn mới. Không nhắc lại nội dung câu trả lời cũ. Hỏi một câu mới khác chủ đề chưa khai thác.`
}
