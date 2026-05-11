import assert from "node:assert/strict"
import { describe, it } from "node:test"

import {
  getAnsweredQuestionsAfterUserTranscript,
  isReadyOnlyResponse,
  isRepeatedAnsweredQuestion,
  shouldTrackAssistantQuestion,
} from "./vapiInterviewTurnGuard.mjs"

describe("vapi interview turn guard", () => {
  it("does not count the opening firstMessage as an interview question", () => {
    const opening =
      "Xin chào Trần Xuân Trường! Tôi là Hoàng Nam, người phỏng vấn trí tuệ nhân tạo đồng hành cùng bạn hôm nay. Khi bạn sẵn sàng, chúng ta bắt đầu nhé."

    assert.equal(shouldTrackAssistantQuestion(opening), false)
  })

  it("does not mark ready-only replies as answered interview questions", () => {
    const answered = getAnsweredQuestionsAfterUserTranscript({
      answeredQuestions: [],
      lastAssistantQuestion:
        "Bạn có thể kể về bản thân và lý do ứng tuyển vị trí backend developer này không?",
      userTranscript: "Tôi đã sẵn sàng.",
    })

    assert.deepEqual(answered, [])
    assert.equal(isReadyOnlyResponse("Tôi đã sẵn sàng."), true)
  })

  it("counts a short meaningful answer as answered and detects a repeated question", () => {
    const firstQuestion =
      "Bạn có thể kể về bản thân và lý do ứng tuyển vị trí backend developer này không?"
    const answered = getAnsweredQuestionsAfterUserTranscript({
      answeredQuestions: [],
      lastAssistantQuestion: firstQuestion,
      userTranscript: "Tôi muốn học thêm nhiều kiến thức.",
    })

    assert.equal(answered.length, 1)
    assert.equal(
      isRepeatedAnsweredQuestion(
        answered,
        "Bạn có thể chia sẻ thêm về bản thân và lý do bạn ứng tuyển backend developer không?",
      ),
      true,
    )
  })

  it("allows a new different question after a short answer", () => {
    const answered = [
      "Bạn có thể kể về bản thân và lý do ứng tuyển vị trí backend developer này không?",
    ]

    assert.equal(
      isRepeatedAnsweredQuestion(
        answered,
        "Bạn đã từng làm việc với REST API hoặc cơ sở dữ liệu trong dự án nào chưa?",
      ),
      false,
    )
  })
})
