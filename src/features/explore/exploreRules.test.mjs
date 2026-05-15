import assert from "node:assert/strict"
import { describe, it } from "node:test"

import {
  canCreateRecruiterPost,
  canSubmitRecruiterRequest,
  getExplorePostStatusLabel,
  getExplorePostTypeLabel,
  getRoleLabel,
} from "./exploreRules.mjs"

describe("explore role rules", () => {
  it("allows only recruiter and admin accounts to create job posts", () => {
    assert.equal(canCreateRecruiterPost("user"), false)
    assert.equal(canCreateRecruiterPost("pro"), false)
    assert.equal(canCreateRecruiterPost("recruiter"), true)
    assert.equal(canCreateRecruiterPost("admin"), true)
  })

  it("allows only user and pro accounts to request recruiter access", () => {
    assert.equal(canSubmitRecruiterRequest("user"), true)
    assert.equal(canSubmitRecruiterRequest("pro"), true)
    assert.equal(canSubmitRecruiterRequest("recruiter"), false)
    assert.equal(canSubmitRecruiterRequest("admin"), false)
  })
})

describe("explore labels", () => {
  it("formats public role and post labels in Vietnamese", () => {
    assert.equal(getRoleLabel("recruiter"), "Nhà tuyển dụng")
    assert.equal(getExplorePostTypeLabel("job_post"), "Tuyển dụng")
    assert.equal(getExplorePostTypeLabel("cv_showcase"), "CV ứng viên")
    assert.equal(getExplorePostStatusLabel("pending"), "Chờ duyệt")
  })
})
