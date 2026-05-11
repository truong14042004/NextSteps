import assert from "node:assert/strict"
import { describe, it } from "node:test"

import {
  extractModelOutputText,
  mergeModelOutputText,
} from "./vapiModelOutputText.mjs"

describe("vapi model output text", () => {
  it("extracts text from nested model-output payloads", () => {
    assert.equal(
      extractModelOutputText({
        output: [{ delta: "Bạn có thể" }, { text: " kể thêm không?" }],
      }),
      "Bạn có thể kể thêm không?",
    )
  })

  it("merges both token chunks and cumulative chunks", () => {
    assert.equal(mergeModelOutputText("Bạn có", " thể"), "Bạn có thể")
    assert.equal(
      mergeModelOutputText("Bạn có", "Bạn có thể kể thêm không?"),
      "Bạn có thể kể thêm không?",
    )
  })
})
