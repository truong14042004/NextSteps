import assert from "node:assert/strict"
import { describe, it } from "node:test"

import { syncAssistantMessagesFromConversation } from "./vapiAssistantMessageSync.mjs"

describe("syncAssistantMessagesFromConversation", () => {
  it("compacts firstMessage fragments into one assistant message", () => {
    const nextMessages = syncAssistantMessagesFromConversation([], [
      { role: "assistant", content: "Xin chào Trần Xuân Trường!" },
      {
        role: "assistant",
        content:
          "Tôi là Hoàng Nam, người phỏng vấn trí tuệ nhân tạo đồng hành cùng bạn hôm nay.",
      },
      {
        role: "assistant",
        content:
          "Tôi là Hoàng Nam, người phỏng vấn trí tuệ nhân tạo đồng hành cùng bạn hôm nay. Buổi phỏng vấn của chúng ta dự kiến kéo dài khoảng 15 đến 20 phút.",
      },
      {
        role: "assistant",
        content:
          "Tôi là Hoàng Nam, người phỏng vấn trí tuệ nhân tạo đồng hành cùng bạn hôm nay. Buổi phỏng vấn của chúng ta dự kiến kéo dài khoảng 15 đến 20 phút. Bạn có thể dừng vài giây để suy nghĩ; tôi sẽ chờ bạn nói hết ý. Khi bạn sẵn sàng, chúng ta bắt đầu nhé.",
      },
    ])

    assert.deepEqual(nextMessages, [
      {
        role: "assistant",
        content:
          "Xin chào Trần Xuân Trường! Tôi là Hoàng Nam, người phỏng vấn trí tuệ nhân tạo đồng hành cùng bạn hôm nay. Buổi phỏng vấn của chúng ta dự kiến kéo dài khoảng 15 đến 20 phút. Bạn có thể dừng vài giây để suy nghĩ; tôi sẽ chờ bạn nói hết ý. Khi bạn sẵn sàng, chúng ta bắt đầu nhé.",
      },
    ])
  })

  it("keeps distinct assistant turns after compacting fragments", () => {
    const opening =
      "Xin chào Trần Xuân Trường! Tôi là Hoàng Nam, người phỏng vấn trí tuệ nhân tạo đồng hành cùng bạn hôm nay. Khi bạn sẵn sàng, chúng ta bắt đầu nhé."
    const question =
      "Điều gì ở vị trí backend developer khiến bạn cảm thấy hứng thú và quyết định ứng tuyển vào đây?"

    const nextMessages = syncAssistantMessagesFromConversation(
      [{ role: "assistant", content: opening }],
      [
        { role: "assistant", content: opening },
        { role: "user", content: "Tôi đã sẵn sàng." },
        { role: "assistant", content: question },
      ],
    )

    assert.deepEqual(nextMessages, [
      { role: "assistant", content: opening },
      { role: "assistant", content: question },
    ])
  })
})
