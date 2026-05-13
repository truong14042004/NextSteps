import assert from "node:assert/strict"
import { describe, it } from "node:test"

import {
  clampServiceReviewRating,
  getServiceReviewServiceLabel,
  getServiceReviewStatusLabel,
  normalizeServiceReviewStatus,
} from "./serviceReviewRules.mjs"

describe("service review rules", () => {
  it("clamps submitted ratings to the 1-5 range", () => {
    assert.equal(clampServiceReviewRating(0), 1)
    assert.equal(clampServiceReviewRating(4), 4)
    assert.equal(clampServiceReviewRating(8), 5)
  })

  it("labels system services for user and admin UI", () => {
    assert.equal(getServiceReviewServiceLabel("system"), "Hệ thống NextStep")
    assert.equal(getServiceReviewServiceLabel("mock_interview"), "Phỏng vấn AI")
    assert.equal(getServiceReviewServiceLabel("unknown"), "Dịch vụ hệ thống")
  })

  it("normalizes unsupported review statuses to pending", () => {
    assert.equal(normalizeServiceReviewStatus("published"), "published")
    assert.equal(normalizeServiceReviewStatus("bad-value"), "pending")
    assert.equal(getServiceReviewStatusLabel("hidden"), "Đã ẩn")
  })
})
