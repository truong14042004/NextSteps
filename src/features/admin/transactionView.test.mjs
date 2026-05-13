import assert from "node:assert/strict"
import { describe, it } from "node:test"

import {
  formatAdminTransactionAmount,
  formatAdminTransactionPlanLabel,
  normalizeAdminTransactionStatus,
} from "./transactionView.mjs"

describe("admin transaction view helpers", () => {
  it("formats VND amounts for admin transaction rows", () => {
    assert.equal(formatAdminTransactionAmount(399000, "VND"), "399.000₫")
  })

  it("normalizes payment statuses into Vietnamese labels", () => {
    assert.deepEqual(normalizeAdminTransactionStatus("paid"), {
      key: "paid",
      label: "Đã thanh toán",
    })
    assert.deepEqual(normalizeAdminTransactionStatus("unknown"), {
      key: "pending",
      label: "Đang chờ",
    })
  })

  it("formats known plan keys", () => {
    assert.equal(formatAdminTransactionPlanLabel("start"), "Start")
    assert.equal(formatAdminTransactionPlanLabel("premium"), "Premium")
    assert.equal(formatAdminTransactionPlanLabel("custom"), "custom")
  })
})
