import assert from "node:assert/strict"
import { describe, it } from "node:test"

import { buildInterviewSystemPrompt } from "./vapiInterviewPrompt.mjs"

const baseJobInfo = {
  name: "Trần Xuân Trường",
  title: "Backend Developer",
  description: "Node.js, REST API, PostgreSQL",
  cvSummary: "",
}

describe("buildInterviewSystemPrompt", () => {
  it("includes only the question bank matching the interview level", () => {
    const prompt = buildInterviewSystemPrompt(
      {
        ...baseJobInfo,
        experienceLevel: "junior",
      },
      { interviewerName: "Hoàng Nam" },
    )

    assert.match(prompt, /Ngân hàng câu hỏi gợi ý cho cấp độ junior/)
    assert.match(prompt, /Junior/)
    assert.match(prompt, /REST API/)
    assert.doesNotMatch(prompt, /Senior/)
    assert.doesNotMatch(prompt, /Intern\/Fresher/)
  })
})
