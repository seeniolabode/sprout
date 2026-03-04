import { describe, expect, it } from "vitest"
import { generateBranchName } from "../../src/domain/generateBranchName.js"

describe("generateBranchName", () => {
  it("creates jira branch names with issue key for normal intents", () => {
    expect(
      generateBranchName({
        intent: "feat",
        issueKey: "MC-37",
        description: "Edit Flow"
      })
    ).toBe("feat/MC-37-edit-flow")
  })

  it("creates release branch with issue key in jira mode", () => {
    expect(
      generateBranchName({
        intent: "release",
        issueKey: "MC-42",
        description: "March Patch"
      })
    ).toBe("release/MC-42-march-patch")
  })

  it("creates release branch without issue key in custom mode", () => {
    expect(
      generateBranchName({
        intent: "release",
        description: "1.2.0"
      })
    ).toBe("release/1.2.0")
  })

  it("creates non-release custom branch without issue key", () => {
    expect(
      generateBranchName({
        intent: "chore",
        description: "dependency updates"
      })
    ).toBe("chore/dependency-updates")
  })

  it("throws when description slug is empty", () => {
    expect(() =>
      generateBranchName({
        intent: "fix",
        issueKey: "MC-99",
        description: "🚀✨"
      })
    ).toThrow("Description produced an empty slug")
  })

  it("throws when release version is empty after sanitization", () => {
    expect(() =>
      generateBranchName({
        intent: "release",
        description: "🚀✨"
      })
    ).toThrow("Release version is empty after sanitization")
  })
})
